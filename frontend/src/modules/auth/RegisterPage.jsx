import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      await axios.post('/auth/register', form);
      nav('/login');
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    }
  }

  return <div className="min-h-screen flex items-center justify-center p-4">
    <form onSubmit={submit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Register</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <input className="border w-full p-2 rounded" placeholder="First Name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} />
      <input className="border w-full p-2 rounded" placeholder="Last Name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} />
      <input className="border w-full p-2 rounded" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <input className="border w-full p-2 rounded" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Create Account</button>
      <p className="text-sm">Have an account? <Link className="text-blue-600" to="/login">Login</Link></p>
    </form>
  </div>;
}
