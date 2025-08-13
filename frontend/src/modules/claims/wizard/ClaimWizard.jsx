import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, authHeader } from '../../auth/AuthContext.jsx';

const steps = [
  { key: 'description', label: 'Description' },
  { key: 'questions', label: 'Questions' },
  { key: 'answers', label: 'Answers' },
  { key: 'events', label: 'Events' },
  { key: 'final', label: 'Final Doc' },
  { key: 'vaform', label: 'VA Form' }
];

export default function ClaimWizard() {
  const { id, step } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const hdr = authHeader(token);
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [desc, setDesc] = useState('');
  const [descError, setDescError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [answerErrors, setAnswerErrors] = useState({});
  const prevQuestionsRef = useRef([]);
  const [questionDiff, setQuestionDiff] = useState(null);
  const autosaveTimer = useRef(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const currentStepIndex = Math.max(0, steps.findIndex(s=>s.key===step));
  const current = steps[currentStepIndex] || steps[0];

  async function load() {
    setLoading(true);
    try {
      const c = await axios.get(`/claims/${id}`, { headers: hdr });
      setClaim(c.data);
      setDesc(c.data.caseDescription || '');
      setAnswers(c.data.userAnswers || {});
      setSelectedEvents((c.data.selectedClaims||[]).map(e=>e.id));
      if (prevQuestionsRef.current.length && c.data.analysisQuestions) {
        const oldIds = new Set(prevQuestionsRef.current.map(q=>q.id));
        const newIds = new Set(c.data.analysisQuestions.map(q=>q.id));
        const added = c.data.analysisQuestions.filter(q=>!oldIds.has(q.id));
        const removed = prevQuestionsRef.current.filter(q=>!newIds.has(q.id));
        if (added.length || removed.length) setQuestionDiff({ added, removed });
      }
      if (c.data.analysisQuestions) prevQuestionsRef.current = c.data.analysisQuestions;
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, [id]); // eslint-disable-line

  function validateDescription(text) {
    if (text.length > 4000) return 'Description exceeds 4000 character limit';
    if (text.trim().length < 30) return 'Provide at least 30 characters for meaningful generation';
    return null;
  }
  async function saveDescription(manual=false) {
    const err = validateDescription(desc);
    setDescError(err);
    if (err) return;
    if (!manual) setSaving(true);
    await axios.patch(`/claims/${id}/description`, { caseDescription: desc }, { headers: hdr });
    if (!manual) setSaving(false);
  }
  async function generateQuestions() {
    setSaving(true);
    setQuestionDiff(null);
    await axios.post(`/claims/${id}/generate-questions`, {}, { headers: hdr });
    await load(); setSaving(false);
  }
  function validateAnswer(text) {
    if (text.length > 1500) return 'Answer exceeds 1500 characters';
    return null;
  }
  async function saveAnswers() {
    const errs = {};
    for (const q of claim.analysisQuestions||[]) {
      const e = validateAnswer(answers[q.id]||'');
      if (e) errs[q.id] = e;
    }
    setAnswerErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await axios.patch(`/claims/${id}/answers`, { userAnswers: answers }, { headers: hdr });
    setSaving(false);
  }
  async function identifyEvents() {
    setSaving(true);
    await axios.post(`/claims/${id}/identify-events`, {}, { headers: hdr });
    await load(); setSaving(false);
  }
  async function saveSelectedEvents() {
    setSaving(true);
    const events = (claim.potentialClaimEvents||[]).filter(e=>selectedEvents.includes(e.id));
    await axios.patch(`/claims/${id}/selected-claims`, { selectedClaims: events }, { headers: hdr });
    setSaving(false);
  }
  async function generateFinalDoc() {
    setSaving(true);
    await axios.post(`/claims/${id}/generate-final-doc`, {}, { headers: hdr });
    await load(); setSaving(false);
  }
  async function generateVAForm() {
    setSaving(true);
    await axios.post(`/claims/${id}/generate-va-form`, {}, { headers: hdr });
    await load(); setSaving(false);
  }

  function goto(i) { navigate(`/claims/${id}/wizard/${steps[i].key}`); }
  function next() { if (currentStepIndex < steps.length-1) goto(currentStepIndex+1); }
  function prev() { if (currentStepIndex > 0) goto(currentStepIndex-1); }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!claim) return <div className="p-6">Not found</div>;

  const progressPct = ((currentStepIndex) / (steps.length-1)) * 100;
  return <div className="p-6 pb-28 space-y-6 relative">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Claim Wizard</h1>
      <div className="text-sm text-gray-600">Status: {claim.status}</div>
    </div>
    <div className="h-2 bg-gray-200 rounded overflow-hidden">
      <div className="h-full bg-blue-600 transition-all" style={{width: progressPct+'%'}} />
    </div>
    <nav className="flex flex-wrap gap-2 text-xs">
      {steps.map((s,i)=> <button key={s.key} onClick={()=>goto(i)} className={`px-3 py-1 rounded border ${i===currentStepIndex?'bg-blue-600 text-white':'bg-white'}`}>{i+1}. {s.label}</button>)}
    </nav>
    <div className="border rounded bg-white p-4 space-y-4">
      {current.key === 'description' && <div className="space-y-3">
        <h2 className="font-medium">Case Description</h2>
  <textarea rows={6} className="w-full border rounded p-2" value={desc} onChange={e=> { const v = e.target.value; setDesc(v); const err = validateDescription(v); setDescError(err); if (autosaveTimer.current) clearTimeout(autosaveTimer.current); autosaveTimer.current = setTimeout(()=> saveDescription(true), 1200); }} />
  {descError && <div className="text-xs text-red-600">{descError}</div>}
  <button disabled={saving || !!descError} onClick={()=>saveDescription(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Save Description</button>
        <div className="text-xs text-gray-500">Provide a detailed narrative to seed question generation.</div>
        <div>
          <button disabled={saving} onClick={generateQuestions} className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Generate Questions</button>
        </div>
        {claim.analysisQuestions && <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-56">{JSON.stringify(claim.analysisQuestions,null,2)}</pre>}
      </div>}

      {current.key === 'questions' && <div className="space-y-3">
        <h2 className="font-medium">Questions</h2>
        {(!claim.analysisQuestions||!claim.analysisQuestions.length) && <div className="text-sm text-gray-500">No questions yet. Go back to Description and generate.</div>}
        {questionDiff && <div className="text-xs bg-yellow-50 border border-yellow-300 rounded p-2 space-y-1">
          {questionDiff.added?.length ? <div><span className="font-semibold">Added:</span> {questionDiff.added.map(q=>q.text).join('; ')}</div> : null}
          {questionDiff.removed?.length ? <div><span className="font-semibold">Removed:</span> {questionDiff.removed.map(q=>q.text).join('; ')}</div> : null}
        </div>}
        <ul className="space-y-2">
          {claim.analysisQuestions?.map(q=> <li key={q.id} className="border rounded p-2 bg-gray-50 text-sm">{q.text}</li>)}
        </ul>
      </div>}

      {current.key === 'answers' && <div className="space-y-3">
        <h2 className="font-medium">Answers</h2>
        {claim.analysisQuestions?.map(q=> <div key={q.id} className="space-y-1">
          <div className="text-sm font-medium">{q.text}</div>
          <textarea rows={3} className="w-full border rounded p-2 text-sm" value={answers[q.id]||''} onChange={e=> { const v = e.target.value; setAnswers(a=> ({...a, [q.id]: v})); setAnswerErrors(er=> ({...er, [q.id]: validateAnswer(v)})); if (autosaveTimer.current) clearTimeout(autosaveTimer.current); autosaveTimer.current = setTimeout(()=> saveAnswers(), 1500); }} />
          {answerErrors[q.id] && <div className="text-xs text-red-600">{answerErrors[q.id]}</div>}
        </div>)}
        <button disabled={saving || Object.values(answerErrors).some(Boolean)} onClick={saveAnswers} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Save Answers</button>
      </div>}

      {current.key === 'events' && <div className="space-y-3">
        <h2 className="font-medium">Potential Events</h2>
        <button disabled={saving} onClick={identifyEvents} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Identify Events</button>
        <div className="grid gap-2 md:grid-cols-2">
          {claim.potentialClaimEvents?.map(evt=> <label key={evt.id} className="border rounded p-2 flex items-start gap-2 text-sm bg-gray-50">
            <input type="checkbox" checked={selectedEvents.includes(evt.id)} onChange={()=> setSelectedEvents(list=> list.includes(evt.id) ? list.filter(x=>x!==evt.id) : [...list, evt.id])} />
            <span>{evt.title}</span>
          </label>)}
        </div>
        <button disabled={saving} onClick={saveSelectedEvents} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Save Selected</button>
      </div>}

      {current.key === 'final' && <div className="space-y-3">
        <h2 className="font-medium">Final Document</h2>
        <button disabled={saving} onClick={generateFinalDoc} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Generate Final Document</button>
        {claim.finalDocument && <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-80">{JSON.stringify(claim.finalDocument,null,2)}</pre>}
      </div>}

      {current.key === 'vaform' && <div className="space-y-3">
        <h2 className="font-medium">VA Form Data</h2>
        <button disabled={saving} onClick={generateVAForm} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Generate VA Form Data</button>
        {claim.vaFormData && <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-80">{JSON.stringify(claim.vaFormData,null,2)}</pre>}
      </div>}
    </div>
    <div className="fixed inset-x-0 bottom-0 bg-white border-t px-6 py-3 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <button onClick={prev} disabled={currentStepIndex===0} className="px-3 py-1 rounded border disabled:opacity-40">Back</button>
        <button onClick={next} disabled={currentStepIndex===steps.length-1} className="px-3 py-1 rounded border disabled:opacity-40">Next</button>
      </div>
      <div className="flex items-center gap-4">
        {saving && <span className="text-gray-500 animate-pulse">Saving…</span>}
        {!saving && <span className="text-gray-400">Idle</span>}
      </div>
    </div>
  </div>;
}
