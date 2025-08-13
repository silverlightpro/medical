import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './modules/auth/AuthContext.jsx';
import { ToastProvider, useToast } from './modules/ui/ToastProvider.jsx';
import axios from 'axios';
import AdminDashboard from './modules/admin/AdminDashboard.jsx';
import UsersAdmin from './modules/admin/UsersAdmin.jsx';
import Layout from './modules/layout/Layout.jsx';
import LoginPage from './modules/auth/LoginPage.jsx';
import RegisterPage from './modules/auth/RegisterPage.jsx';
import Dashboard from './modules/dashboard/Dashboard.jsx';
import DocumentsPage from './modules/documents/DocumentsPage.jsx';
import ClaimPage from './modules/claims/ClaimPage.jsx';
import ClaimWizard from './modules/claims/wizard/ClaimWizard.jsx';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, isAdmin } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const toast = useToast();
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(r => r, err => {
      if (err.response) {
        const msg = err.response.data?.error || `Error ${err.response.status}`;
        toast?.push(msg, { type: 'error' });
      } else {
        toast?.push('Network error', { type: 'error' });
      }
      return Promise.reject(err);
    });
    return () => axios.interceptors.response.eject(resInterceptor);
  }, [toast]);
  return <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/documents" element={<PrivateRoute><Layout><DocumentsPage /></Layout></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Layout><UsersAdmin /></Layout></AdminRoute>} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/claims/:id" element={<PrivateRoute><Layout><ClaimPage /></Layout></PrivateRoute>} />
      <Route path="/claims/:id/wizard/:step" element={<PrivateRoute><Layout><ClaimWizard /></Layout></PrivateRoute>} />
    </Routes>
  </BrowserRouter>;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
