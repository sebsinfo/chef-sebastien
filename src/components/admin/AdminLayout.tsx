import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Star,
  MessageCircle,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  ShieldCheck,
  Shield,
  Eye,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { profile, isSuperAdmin, canReply, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navLinks = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      superAdminOnly: false,
    },
    {
      to: '/admin/feedback',
      label: 'Avis Clients',
      icon: Star,
      superAdminOnly: false,
    },
    {
      to: '/admin/questions',
      label: 'Questions WhatsApp',
      icon: MessageCircle,
      superAdminOnly: false,
    },
    {
      to: '/admin/statistics',
      label: 'Statistiques',
      icon: BarChart3,
      superAdminOnly: false,
    },
    {
      to: '/admin/admins',
      label: 'Administrateurs',
      icon: Users,
      superAdminOnly: true,
    },
    {
      to: '/admin/settings',
      label: 'Paramètres',
      icon: Settings,
      superAdminOnly: true,
    },
  ];

  const visibleLinks = navLinks.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-200 border-r border-stone-800 flex-shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-amber-100 leading-tight">
                Chef Sébastien
              </h2>
              <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase">
                Port-au-Prince
              </span>
            </div>
          </div>
        </div>

        {/* Info profil de l'utilisateur connecté */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-stone-800/80 border border-stone-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white truncate max-w-[130px]">
              {profile?.full_name || 'Administrateur'}
            </span>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldCheck className="w-3 h-3" />
                <span>Super Admin</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-700 text-stone-300">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Droit de réponse :</span>
            {canReply ? (
              <span className="text-emerald-400 font-medium">Autorisé ✓</span>
            ) : (
              <span className="text-amber-400 font-medium">Lecture seule 👁️</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 py-2">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.label}</span>
                {item.superAdminOnly && (
                  <span className="ml-auto text-[9px] bg-stone-800 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                    SA
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bas de sidebar */}
        <div className="p-3 border-t border-stone-800 space-y-2">
          {/* Voir le site public */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voir le site public</span>
            </span>
          </a>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Header Mobile avec Burger Menu */}
      <div className="md:hidden bg-stone-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-stone-800 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-sm text-amber-100">
              Chef Sébastien
            </h1>
            <span className="text-[10px] text-stone-400">Dashboard</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-stone-800 text-stone-200 hover:text-white focus:outline-hidden"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div>
                <span className="text-sm font-bold text-white block">
                  {profile?.full_name || 'Administrateur'}
                </span>
                <span className="text-xs text-amber-400">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'} · {canReply ? 'Peut répondre' : 'Lecture seule'}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1 mb-6">
              {visibleLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-amber-600 text-white'
                        : 'text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-stone-800 flex flex-col gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir le site public</span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/60 text-red-300 border border-red-900/60 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Barre d'information */}
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-2 text-stone-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-400">Administrateur :</span>
            <span className="font-semibold text-white">
              {profile?.full_name || 'Chef Sébastien'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 font-mono text-[11px] font-bold border border-stone-700">
              {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span>Droit de réponse WhatsApp :</span>
            {canReply ? (
              <span className="text-emerald-400 font-semibold">Autorisé ✓</span>
            ) : (
              <span className="text-amber-400 font-medium">Lecture seule</span>
            )}
          </div>
        </div>

        {/* Corps de la page */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
