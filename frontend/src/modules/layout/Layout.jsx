import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout({ children }) {
  const { logout, isAdmin } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(()=> localStorage.getItem('theme')==='dark');
  useEffect(()=> { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark?'dark':'light'); }, [dark]);
  const navLink = (to, label) => <Link to={to} onClick={()=>setOpen(false)} className={`px-2 py-1 rounded transition text-sm ${loc.pathname.startsWith(to)?'bg-brand-600 text-white':'text-gray-700 dark:text-neutral-200 hover:bg-brand-50 dark:hover:bg-neutral-700'}`}>{label}</Link>;
  return <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 flex flex-col">
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-600 text-white px-3 py-1 rounded">Skip to content</a>
    <header className="bg-white border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-gray-600" onClick={()=>setOpen(o=>!o)} aria-label="Toggle navigation">☰</button>
          <Link to="/" className="font-semibold text-blue-700">VA Claim Assistant</Link>
          <nav className="hidden md:flex items-center gap-2">
            {navLink('/documents','Documents')}
            {isAdmin && navLink('/admin','Admin')}
            {isAdmin && navLink('/admin/users','Users')}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setDark(d=>!d)} className="text-xs px-2 py-1 rounded border dark:border-neutral-600 dark:text-neutral-200">{dark?'Light':'Dark'}</button>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
        </div>
      </div>
      {open && <nav className="mt-3 flex flex-col gap-2 md:hidden">
        {navLink('/documents','Documents')}
        {isAdmin && navLink('/admin','Admin')}
        {isAdmin && navLink('/admin/users','Users')}
      </nav>}
    </header>
  <main id="main" className="flex-1 app-container w-full px-4 md:px-8 py-4">{children}</main>
    <footer className="text-center text-xs text-gray-500 py-4">© {new Date().getFullYear()} VA Claim Assistant</footer>
  </div>;
}
