import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { api, DEFAULT_SETTINGS } from './lib/supabase';
import type { AppSettings } from './types/database';

// Composants publics
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/public/Home';
import { FeedbackPage } from './pages/public/FeedbackPage';
import { QuestionPage } from './pages/public/QuestionPage';
import { ConditionsPage } from './pages/public/ConditionsPage';

// Composants admin
import { AdminLogin } from './pages/admin/Login';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { FeedbackList } from './pages/admin/FeedbackList';
import { QuestionsList } from './pages/admin/QuestionsList';
import { AdminStatistics } from './pages/admin/Statistics';
import { AdminsList } from './pages/admin/AdminsList';
import { SettingsPage } from './pages/admin/SettingsPage';

// Layout pour la partie publique (Header + Footer)
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-grain min-h-screen flex flex-col justify-between selection:bg-[#ffe3e5] selection:text-[#b8000f] text-[#1f1612]">
      <Header />
      <main className="flex-1 flex flex-col justify-center">{children}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes Publiques (sans inscription) */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />
          <Route
            path="/feedback"
            element={
              <PublicLayout>
                <FeedbackPage />
              </PublicLayout>
            }
          />
          <Route
            path="/question"
            element={
              <PublicLayout>
                <QuestionPage />
              </PublicLayout>
            }
          />
          <Route
            path="/conditions"
            element={
              <PublicLayout>
                <ConditionsPage />
              </PublicLayout>
            }
          />

          {/* Authentification Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Routes Protégées du Dashboard Admin */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <FeedbackList />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <QuestionsList />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminStatistics />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Routes Réservées au Super Admin */}
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminLayout>
                  <AdminsList />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminLayout>
                  <SettingsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
