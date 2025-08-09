import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './modules/auth/AuthContext.jsx';
import LoginPage from './modules/auth/LoginPage.jsx';
import RegisterPage from './modules/auth/RegisterPage.jsx';
import Dashboard from './modules/dashboard/Dashboard.jsx';
import DocumentsPage from './modules/documents/DocumentsPage.jsx';
import ClaimPage from './modules/claims/ClaimPage.jsx';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/claims/:id" element={<PrivateRoute><ClaimPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
