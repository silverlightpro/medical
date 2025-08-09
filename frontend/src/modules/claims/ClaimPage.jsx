import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth, authHeader } from '../auth/AuthContext.jsx';

export default function ClaimPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desc, setDesc] = useState('');
  const [setup, setSetup] = useState({ veteranName: '', relationship: '' });
  const [docs, setDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const hdr = authHeader(token);

  async function load() {
    setLoading(true); setError(null);
    try {
      const c = await axios.get(`/claims/${id}`, { headers: hdr });
      setClaim(c.data);
      setDesc(c.data.caseDescription || '');
      setSetup(c.data.claimSetupData || { veteranName: '', relationship: '' });
      const allDocs = await axios.get('/documents', { headers: hdr });
      setDocs(allDocs.data);
    } catch (e) { setError(e.response?.data?.error || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, [id]); // eslint-disable-line

  async function saveDescription() {
    await axios.patch(`/claims/${id}/description`, { caseDescription: desc }, { headers: hdr });
    load();
  }
  async function saveSetup() {
    await axios.patch(`/claims/${id}/setup`, { claimSetupData: setup }, { headers: hdr });
    load();
  }
  async function updateStatus(newStatus) {
    await axios.patch(`/claims/${id}/status`, { status: newStatus }, { headers: hdr });
    load();
  }
  async function runQuestions() {
    await axios.post(`/claims/${id}/generate-questions`, {}, { headers: hdr });
    load();
  }
  async function runEvents() {
    await axios.post(`/claims/${id}/identify-events`, {}, { headers: hdr });
    load();
  }
  async function runFinal() {
    await axios.post(`/claims/${id}/generate-final-doc`, {}, { headers: hdr });
    load();
  }
  async function runVAForm() {
    await axios.post(`/claims/${id}/generate-va-form`, {}, { headers: hdr });
    load();
  }
  async function associateDocs() {
    await axios.post(`/claims/${id}/documents`, { documentIds: selectedDocIds }, { headers: hdr });
    setSelectedDocIds([]);
    load();
  }
  async function toggleArchive() {
    await axios.patch(`/claims/${id}/archive`, { archived: !claim.archived }, { headers: hdr });
    load();
  }
  async function deleteClaim() {
    if (!window.confirm('Delete this claim?')) return;
    await axios.delete(`/claims/${id}`, { headers: hdr });
    window.location.href = '/';
  }

  const claimDocs = docs.filter(d=>d.claimId === id);
  const unlinkedDocs = docs.filter(d=>!d.claimId);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!claim) return <div className="p-6">Not found</div>;

  return <div className="p-6 space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Claim {claim.id.slice(0,8)}</h1>
        <div className="text-sm text-gray-600">Status: {claim.status} {claim.archived && '(Archived)'}</div>
      </div>
      <div className="space-x-2">
        <button onClick={toggleArchive} className="px-3 py-1 rounded bg-yellow-600 text-white text-sm">{claim.archived ? 'Unarchive' : 'Archive'}</button>
        <button onClick={deleteClaim} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Delete</button>
      </div>
    </div>

    <section className="space-y-2">
      <h2 className="font-medium">Case Description</h2>
      <textarea className="w-full border rounded p-2" rows={4} value={desc} onChange={e=>setDesc(e.target.value)} />
      <button onClick={saveDescription} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save Description</button>
    </section>

    <section className="space-y-2">
      <h2 className="font-medium">Setup</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <input className="border p-2 rounded" placeholder="Veteran Name" value={setup.veteranName} onChange={e=>setSetup({...setup,veteranName:e.target.value})} />
        <input className="border p-2 rounded" placeholder="Relationship" value={setup.relationship} onChange={e=>setSetup({...setup,relationship:e.target.value})} />
      </div>
      <button onClick={saveSetup} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save Setup</button>
    </section>

    <section className="space-y-2">
      <h2 className="font-medium">Status Progression</h2>
      <div className="flex gap-2">
        {['Draft','Analysis Complete','Final Document Ready','Submitted','C&P Exam Scheduled','Decision Received'].map(s=> <button key={s} onClick={()=>updateStatus(s)} className={`px-2 py-1 rounded text-xs border ${claim.status===s?'bg-blue-600 text-white':'bg-white'}`}>{s}</button>)}
      </div>
      {claim.statusHistory && <ul className="text-xs text-gray-600 list-disc ml-5 space-y-1 max-h-40 overflow-auto">{(claim.statusHistory||[]).map((h,i)=><li key={i}>{h.status} @ {new Date(h.at).toLocaleString()}</li>)}</ul>}
    </section>

    <section className="space-y-2">
      <h2 className="font-medium">AI Steps</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        <button onClick={runQuestions} className="bg-indigo-600 text-white px-3 py-1 rounded">Generate Questions</button>
        <button onClick={runEvents} className="bg-indigo-600 text-white px-3 py-1 rounded">Identify Events</button>
        <button onClick={runFinal} className="bg-indigo-600 text-white px-3 py-1 rounded">Generate Final Doc</button>
        <button onClick={runVAForm} className="bg-indigo-600 text-white px-3 py-1 rounded">Generate VA Form Data</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-medium">Questions</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(claim.analysisQuestions,null,2)}</pre>
        </div>
        <div>
          <h3 className="font-medium">Potential Events</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(claim.potentialClaimEvents,null,2)}</pre>
        </div>
        <div>
          <h3 className="font-medium">Final Document</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(claim.finalDocument,null,2)}</pre>
        </div>
        <div>
          <h3 className="font-medium">VA Form Data</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(claim.vaFormData,null,2)}</pre>
        </div>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="font-medium">Documents</h2>
      <div className="text-sm">Linked Documents</div>
      <ul className="list-disc ml-5 text-sm">
        {claimDocs.map(d=> <li key={d.id}>{d.fileName}</li>)}
        {!claimDocs.length && <li className="text-gray-500">None linked</li>}
      </ul>
      <div className="text-sm">Associate Existing (unlinked) Documents</div>
      <div className="flex flex-col gap-1 max-w-md">
        {unlinkedDocs.map(d=> <label key={d.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedDocIds.includes(d.id)} onChange={()=> setSelectedDocIds(ids=> ids.includes(d.id)? ids.filter(x=>x!==d.id): [...ids,d.id])} /> {d.fileName}</label>)}
        {!unlinkedDocs.length && <div className="text-gray-500 text-sm">No unlinked documents.</div>}
      </div>
      <button disabled={!selectedDocIds.length} onClick={associateDocs} className="bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm">Associate</button>
    </section>
  </div>;
}
