import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal mot de passe oublié
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Veuillez saisir votre adresse email et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setErrorMessage(res.error || 'Identifiants incorrects ou accès refusé.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail);
      if (res.success) {
        setForgotSent(true);
      } else {
        setErrorMessage(res.error || 'Impossible d’envoyer le lien de réinitialisation.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de réinitialisation.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Brand En-tête */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4 group" aria-label="Chef Sébastien - Accueil">
            <img
              src="/logo.png"
              alt="Logo Chef Sébastien"
              className="h-16 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <h1 className="font-fraunces font-bold text-2xl sm:text-3xl text-[#faf4ea] tracking-tight">
            Chef Sébastien
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1 font-mono-custom text-xs text-[#d9ccb6] uppercase tracking-wider">
            <span>Espace Administration</span>
          </div>
        </div>

        {/* Carte de Connexion */}
        <div className="bg-[#291e18] border border-[#3d2e25] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-[#ffe3e5] border border-[#ff0316] text-[#b8000f] text-xs">
              <AlertCircle className="w-4 h-4 text-[#b8000f] flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="adminEmail"
                className="block font-mono-custom text-xs font-semibold text-[#d9ccb6] uppercase tracking-wider mb-1.5"
              >
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  id="adminEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="nom@chefsebastien.ht"
                  className="w-full pl-10 pr-3.5 py-3 rounded-[10px] bg-[#1f1612] border border-[#4a392e] text-[#faf4ea] placeholder-stone-500 text-sm focus:outline-hidden focus:border-[#ff0316] focus:ring-1 focus:ring-[#ff0316]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="adminPassword"
                  className="block font-mono-custom text-xs font-semibold text-[#d9ccb6] uppercase tracking-wider"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[#d9ccb6] hover:text-[#ff0316] transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  id="adminPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-3 rounded-[10px] bg-[#1f1612] border border-[#4a392e] text-[#faf4ea] placeholder-stone-500 text-sm focus:outline-hidden focus:border-[#ff0316] focus:ring-1 focus:ring-[#ff0316]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-[10px] bg-[#ff0316] hover:bg-[#b8000f] text-[#faf4ea] font-semibold text-base shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4 text-[#faf4ea]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Retour au site public */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors inline-flex items-center gap-1"
          >
            <span>← Retourner au site public</span>
          </Link>
        </div>
      </div>

      {/* Modal Mot de passe oublié */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-800 border border-stone-700 rounded-2xl max-w-sm w-full p-6 text-stone-100 shadow-2xl animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="font-serif font-bold text-lg text-amber-100 mb-1">
              Mot de passe oublié ?
            </h3>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Entrez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>

            {forgotSent ? (
              <div className="bg-emerald-950/80 border border-emerald-800 p-3 rounded-xl text-emerald-200 text-xs mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Lien de réinitialisation envoyé si l’adresse existe.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="nom@chefsebastien.ht"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs placeholder-stone-500 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    {forgotLoading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </div>
              </form>
            )}

            {forgotSent && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-stone-700 text-stone-200 text-xs"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
