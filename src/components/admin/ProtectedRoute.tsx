import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false,
}) => {
  const { user, profile, loading, isSuperAdmin, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-stone-400 font-mono tracking-wider">
            Vérification des accès...
          </span>
        </div>
      </div>
    );
  }

  // Si pas connecté ou profil inactif
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Si page réservée au Super Admin
  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-stone-200">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">
            Accès Réservé au Super Admin
          </h2>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            Cette section (gestion des administrateurs ou paramètres avancés) nécessite les privilèges de direction Super Admin.
          </p>
          <a
            href="/admin/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
          >
            Retour au Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
