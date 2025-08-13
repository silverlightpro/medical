import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, authHeader } from '../auth/AuthContext.jsx';

export default function UsersAdmin() {
  const { token } = useAuth();
  const hdr = authHeader(token);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '', isAdmin: false, notes: '' });
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get('/admin/users', { headers: hdr });
      setUsers(res.data);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []); // eslint-disable-line

  function openNew() {
    setEditing(null);
    setForm({ email: '', firstName: '', lastName: '', password: '', isAdmin: false, notes: '' });
    setModalOpen(true);
  }
  function openEdit(u) {
    setEditing(u.id);
    setForm({ email: u.email, firstName: u.firstName, lastName: u.lastName, password: '', isAdmin: u.isAdmin, notes: u.notes || '' });
    setModalOpen(true);
  }
  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        const payload = { firstName: form.firstName, lastName: form.lastName, isAdmin: form.isAdmin, notes: form.notes };
        if (form.password) payload.password = form.password;
        await axios.patch(`/admin/users/${editing}`, payload, { headers: hdr });
      } else {
        await axios.post('/admin/users', form, { headers: hdr });
      }
      setModalOpen(false); load();
    } catch (e) { setError(e.response?.data?.error || 'Save failed'); }
  }
  async function remove(u) {
    if (!window.confirm('Delete user?')) return;
    await axios.delete(`/admin/users/${u.id}`, { headers: hdr });
    load();
  }

  return <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Users</h2>
      <button onClick={openNew} className="bg-green-600 text-white px-4 py-2 rounded text-sm">New User</button>
    </div>
    <div className="bg-white rounded shadow overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2">Email</th>
            <th className="text-left px-3 py-2">Admin</th>
            <th className="text-left px-3 py-2">Notes</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td className="px-3 py-4" colSpan={5}>Loading...</td></tr> : users.map(u=> <tr key={u.id} className="border-t">
            <td className="px-3 py-2">{u.firstName} {u.lastName}</td>
            <td className="px-3 py-2">{u.email}</td>
            <td className="px-3 py-2">{u.isAdmin ? 'Yes':'No'}</td>
            <td className="px-3 py-2 max-w-xs truncate" title={u.notes}>{u.notes}</td>
            <td className="px-3 py-2 space-x-2">
              <button onClick={()=>openEdit(u)} className="text-blue-600 text-xs">Edit</button>
              <button onClick={()=>remove(u)} className="text-red-600 text-xs">Delete</button>
            </td>
          </tr>)}
          {!loading && !users.length && <tr><td className="px-3 py-4 text-gray-500" colSpan={5}>No users.</td></tr>}
        </tbody>
      </table>
    </div>

    {modalOpen && <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded shadow p-6 w-full max-w-lg space-y-4">
        <h3 className="text-lg font-semibold">{editing ? 'Edit User' : 'New User'}</h3>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide">First Name</label>
            <input required value={form.firstName} onChange={e=>setForm(f=>({...f, firstName:e.target.value}))} className="border rounded w-full p-2" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide">Last Name</label>
            <input required value={form.lastName} onChange={e=>setForm(f=>({...f, lastName:e.target.value}))} className="border rounded w-full p-2" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs uppercase tracking-wide">Email</label>
            <input type="email" required disabled={!!editing} value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} className="border rounded w-full p-2" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs uppercase tracking-wide">Password {editing && <span className="text-gray-500">(leave blank to keep)</span>}</label>
            <input type="password" value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} className="border rounded w-full p-2" />
          </div>
          <div className="space-y-1 md:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.isAdmin} onChange={e=>setForm(f=>({...f, isAdmin:e.target.checked}))} /> <span className="text-sm">Admin</span>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs uppercase tracking-wide">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} className="border rounded w-full p-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button type="button" onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      </form>
    </div>}
  </div>;
}
