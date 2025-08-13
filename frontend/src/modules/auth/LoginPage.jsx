import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
  const res = await axios.post('/auth/login', form);
  login(res.data.token, res.data.isAdmin);
      nav('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    }
  }

  return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-900 dark:to-neutral-900">
    <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold text-center">Sign In</h1>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="space-y-1">
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      </div>
      <div className="space-y-1">
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      </div>
      <button className="btn-primary w-full">Sign In</button>
      <p className="text-xs text-center">No account? <Link className="text-brand-600 hover:underline" to="/register">Register</Link></p>
    </form>
  </div>;
}
