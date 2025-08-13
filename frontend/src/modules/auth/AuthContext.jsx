import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
// Dynamically derive API base: prefer VITE_API_URL; else use current origin + /api (works with forwarded ports / deployed)
if (!axios.defaults.baseURL) {
  const envUrl = import.meta.env.VITE_API_URL;
  axios.defaults.baseURL = envUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:4000/api');
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setToken(stored);
    const storedAdmin = localStorage.getItem('isAdmin');
    if (storedAdmin) setIsAdmin(storedAdmin === 'true');
  }, []);

  const login = (tok, adminFlag) => { setToken(tok); localStorage.setItem('token', tok); setIsAdmin(!!adminFlag); localStorage.setItem('isAdmin', !!adminFlag); };
  const logout = () => { setToken(null); setIsAdmin(false); localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); };

  return <AuthContext.Provider value={{ token, isAdmin, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }

export function authHeader(token) { return { Authorization: `Bearer ${token}` }; }
