import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const strength = useMemo(()=> {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['Very Weak','Weak','Fair','Good','Strong','Excellent'];
    return { score, label: labels[score] };
  }, [form.password]);
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

  return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-white dark:from-neutral-900 dark:to-neutral-900">
    <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
      <h1 className="text-2xl font-semibold text-center">Create Account</h1>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <input className="input" placeholder="First Name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} />
      <input className="input" placeholder="Last Name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} />
      <input className="input" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
      <div className="space-y-1">
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        {form.password && <div className="h-1 w-full bg-gray-200 dark:bg-neutral-700 rounded overflow-hidden">
          <div className={`h-full transition-all ${strength.score<=2?'bg-red-500':strength.score<=3?'bg-yellow-500':strength.score<=4?'bg-green-500':'bg-emerald-600'}`} style={{width: ((strength.score/5)*100)+'%'}} />
        </div>}
        {form.password && <div className="text-[10px] text-gray-500">Strength: {strength.label}</div>}
      </div>
      <button className="btn-primary w-full">Create Account</button>
      <p className="text-xs text-center">Have an account? <Link className="text-brand-600 hover:underline" to="/login">Login</Link></p>
    </form>
  </div>;
}
