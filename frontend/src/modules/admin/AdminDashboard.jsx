import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, authHeader } from '../auth/AuthContext.jsx';

function PromptRow({ p, onEdit, onDelete, onRotate }) {
  const rotated = p.apiKeyUpdatedAt ? new Date(p.apiKeyUpdatedAt) : null;
  return <tr className="border-b align-top">
    <td className="py-2 px-2 font-mono text-sm">{p.name}</td>
    <td className="py-2 px-2">{p.model || <span className="text-gray-400">(none)</span>}</td>
    <td className="py-2 px-2 truncate max-w-xs" title={p.systemPrompt}>{p.systemPrompt || <span className="text-gray-400">(empty)</span>}</td>
    <td className="py-2 px-2 font-mono text-xs">
      {p.maskedKey ? <div>{p.maskedKey}</div> : <span className="text-gray-400">—</span>}
      {rotated && <div className="text-[10px] text-gray-500 mt-1">rotated {rotated.toLocaleString()}</div>}
    </td>
    <td className="py-2 px-2 space-x-2 whitespace-nowrap">
      <button onClick={()=>onEdit(p)} className="text-blue-600 text-sm">Edit</button>
      <button onClick={()=>onRotate(p)} className="text-amber-600 text-sm">Rotate Key</button>
      <button onClick={()=>onDelete(p)} className="text-red-600 text-sm">Delete</button>
    </td>
  </tr>;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', model: '', systemPrompt: '', apiKey: '' });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get('/admin/prompts', { headers: authHeader(token) });
      setPrompts(res.data);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []); // eslint-disable-line

  function openNew() {
    setForm({ name: '', model: '', systemPrompt: '', apiKey: '' });
    setEditing(false);
    setModalOpen(true);
  }
  function openEdit(p) {
    setForm({ name: p.name, model: p.model || '', systemPrompt: p.systemPrompt || '', apiKey: '' });
    setEditing(true);
    setModalOpen(true);
  }
  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await axios.put(`/admin/prompts/${encodeURIComponent(form.name)}`, form, { headers: authHeader(token) });
      } else {
        await axios.post('/admin/prompts', form, { headers: authHeader(token) });
      }
      setModalOpen(false);
      await load();
    } catch (e) { setError(e.response?.data?.error || 'Save failed'); }
  }
  async function remove(p) {
    if (!window.confirm(`Delete prompt config '${p.name}'?`)) return;
    await axios.delete(`/admin/prompts/${encodeURIComponent(p.name)}`, { headers: authHeader(token) });
    load();
  }

  async function rotateKey(p) {
    const newKey = window.prompt(`Enter new API key for '${p.name}' (leave empty to cancel)`);
    if (!newKey) return; // cancel
    try {
      await axios.put(`/admin/prompts/${encodeURIComponent(p.name)}`, { name: p.name, model: p.model, systemPrompt: p.systemPrompt, apiKey: newKey }, { headers: authHeader(token) });
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Rotation failed');
    }
  }

  return <div className="p-6 space-y-6">
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="space-x-2">
        <button onClick={openNew} className="bg-green-600 text-white px-4 py-2 rounded">New Prompt</button>
      </div>
    </header>
    <section className="bg-white shadow rounded overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">Model</th>
            <th className="py-2 px-2">System Prompt</th>
            <th className="py-2 px-2">API Key?</th>
            <th className="py-2 px-2" />
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td className="py-4 px-2" colSpan={5}>Loading...</td></tr> :
            prompts.length ? prompts.map(p => <PromptRow key={p.id} p={p} onEdit={openEdit} onDelete={remove} onRotate={rotateKey} />) :
              <tr><td className="py-4 px-2 text-gray-500" colSpan={5}>No prompt configs yet.</td></tr>}
        </tbody>
      </table>
    </section>

    {modalOpen && <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded shadow p-6 w-full max-w-lg space-y-4">
        <h2 className="text-xl font-semibold">{editing ? 'Edit Prompt' : 'New Prompt'}</h2>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Name</label>
          <input required disabled={editing} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border rounded w-full p-2" placeholder="claimQuestions" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Model</label>
          <input value={form.model} onChange={e=>setForm({...form,model:e.target.value})} className="border rounded w-full p-2" placeholder="gpt-4o" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">System Prompt</label>
          <textarea rows={4} value={form.systemPrompt} onChange={e=>setForm({...form,systemPrompt:e.target.value})} className="border rounded w-full p-2" placeholder="You are an assistant ..." />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">API Key {editing && '(leave blank to keep existing)'}</label>
          {editing && prompts.find(p=>p.name===form.name)?.maskedKey && <div className="text-xs text-gray-500 mb-1">Current: <span className="font-mono">{prompts.find(p=>p.name===form.name)?.maskedKey}</span></div>}
          <input value={form.apiKey} onChange={e=>setForm({...form,apiKey:e.target.value})} className="border rounded w-full p-2" placeholder="sk-..." />
          {editing && <p className="text-[11px] text-gray-500">Enter a new key to rotate it; leaving blank preserves existing encrypted key.</p>}
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      </form>
    </div>}
  </div>;
}
