import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Mail,
  ShieldAlert,
  Edit2,
  X,
} from 'lucide-react';
import { api } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Profile, UserRole, UserStatus } from '../../types/database';

export const AdminsList: React.FC = () => {
  const { profile: currentProfile } = useAuth();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal d'ajout
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('admin');
  const [addCanReply, setAddCanReply] = useState(true);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Modal de modification
  const [editingAdmin, setEditingAdmin] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('admin');
  const [editCanReply, setEditCanReply] = useState(false);
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadAdmins = async () => {
    try {
      const list = await api.getAdminsList();
      setAdmins(list);
    } catch (err) {
      console.error('Erreur chargement admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Créer un administrateur via l'Edge Function ou l'API Supabase
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!addFullName.trim() || !addEmail.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Veuillez renseigner le nom complet et l’adresse email.' });
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await api.createAdmin({
        full_name: addFullName.trim(),
        email: addEmail.trim(),
        role: addRole,
        can_reply: addRole === 'super_admin' ? true : addCanReply,
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Administrateur créé avec succès ! Une invitation a été préparée pour ${addEmail}.`,
        });
        setShowAddModal(false);
        setAddFullName('');
        setAddEmail('');
        setAddRole('admin');
        setAddCanReply(true);
        loadAdmins();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Erreur lors de la création de l’administrateur.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur inconnue.' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Ouvrir modal de modification
  const openEditModal = (admin: Profile) => {
    setEditingAdmin(admin);
    setEditFullName(admin.full_name);
    setEditRole(admin.role);
    setEditCanReply(admin.can_reply);
    setEditStatus(admin.status);
  };

  // Mettre à jour l'admin
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setFeedbackMsg(null);

    // Sécurité : le Super Admin principal ne peut pas se désactiver lui-même
    if (editingAdmin.id === currentProfile?.id && editStatus === 'inactive') {
      setFeedbackMsg({
        type: 'error',
        text: 'Vous ne pouvez pas désactiver votre propre compte Super Admin actif.',
      });
      return;
    }

    setSubmittingEdit(true);
    try {
      const ok = await api.updateAdmin(editingAdmin.id, {
        full_name: editFullName.trim(),
        role: editRole,
        can_reply: editRole === 'super_admin' ? true : editCanReply,
        status: editStatus,
      });

      if (ok) {
        setFeedbackMsg({ type: 'success', text: `Profil de ${editFullName} mis à jour avec succès.` });
        setEditingAdmin(null);
        loadAdmins();
      } else {
        setFeedbackMsg({ type: 'error', text: 'Impossible de mettre à jour le profil.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Basculer rapidement le statut Actif / Inactif
  const toggleStatus = async (admin: Profile) => {
    if (admin.id === currentProfile?.id) {
      setFeedbackMsg({ type: 'error', text: 'Action impossible sur votre propre compte connecté.' });
      return;
    }

    const newStatus: UserStatus = admin.status === 'active' ? 'inactive' : 'active';
    const ok = await api.updateAdmin(admin.id, { status: newStatus });
    if (ok) {
      setFeedbackMsg({
        type: 'success',
        text: `Statut de ${admin.full_name} passé à ${newStatus === 'active' ? 'Actif' : 'Inactif'}.`,
      });
      loadAdmins();
    }
  };

  // Basculer rapidement le droit de réponse
  const toggleCanReply = async (admin: Profile) => {
    if (admin.role === 'super_admin') return; // Toujours autorisé

    const ok = await api.updateAdmin(admin.id, { can_reply: !admin.can_reply });
    if (ok) {
      setFeedbackMsg({
        type: 'success',
        text: `Permission de réponse mise à jour pour ${admin.full_name}.`,
      });
      loadAdmins();
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>Super Admin Uniquement</span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Gestion des Administrateurs
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Gérez les accès de l'équipe et attribuez les permissions de réponse WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un Administrateur</span>
        </button>
      </div>

      {/* Message de notification */}
      {feedbackMsg && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-stone-400 hover:text-stone-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Liste des administrateurs (Cartes adaptées au mobile & Desktop) */}
      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">
          Chargement des profils...
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
          <p className="text-stone-700 font-medium">Aucun administrateur trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((adm) => {
            const isSuper = adm.role === 'super_admin';
            const isActive = adm.status === 'active';
            const isCurrent = adm.id === currentProfile?.id;

            return (
              <div
                key={adm.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs transition-all ${
                  !isActive ? 'opacity-65 bg-stone-50 border-stone-200' : 'border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Info principale */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSuper
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isSuper ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {adm.full_name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                            (Vous)
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuper
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {isSuper ? 'Super Admin' : 'Admin'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          {adm.email || 'Email non renseigné'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          Créé le{' '}
                          {new Date(adm.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Contrôle de permissions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Toggle Permission de réponse */}
                    <button
                      type="button"
                      disabled={isSuper}
                      onClick={() => toggleCanReply(adm)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSuper || adm.can_reply
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                      }`}
                      title={
                        isSuper
                          ? 'Le Super Admin dispose toujours du droit de réponse'
                          : 'Cliquer pour modifier la permission de réponse'
                      }
                    >
                      {isSuper || adm.can_reply ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Peut répondre WhatsApp</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-stone-400" />
                          <span>Lecture seule</span>
                        </>
                      )}
                    </button>

                    {/* Modifier profil */}
                    <button
                      type="button"
                      onClick={() => openEditModal(adm)}
                      className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200"
                      title="Modifier les informations"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Activer / Désactiver */}
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => toggleStatus(adm)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isActive
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ajouter un Administrateur */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Nouvel Administrateur
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="Ex: Jean-Luc François"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="jeanluc@chefsebastien.ht"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Une invitation d'activation par email sera transmise au collaborateur.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Rôle attribué
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="admin">Admin standard</option>
                  <option value="super_admin">Super Admin (accès total)</option>
                </select>
              </div>

              {addRole === 'admin' && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      Autoriser à répondre sur WhatsApp
                    </span>
                    <span className="block text-[11px] text-stone-500">
                      Permet d'utiliser le bouton [ Répondre ]
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={addCanReply}
                    onChange={(e) => setAddCanReply(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submittingAdd ? 'Enregistrement...' : 'Créer l’administrateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier Administrateur */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Modifier l'administrateur
              </h3>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Rôle
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="admin">Admin standard</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Statut du compte
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="active">Actif (Accès autorisé)</option>
                  <option value="inactive">Inactif (Accès révoqué)</option>
                </select>
              </div>

              {editRole === 'admin' && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      Permission de réponse WhatsApp
                    </span>
                    <span className="block text-[11px] text-stone-500">
                      {editCanReply ? 'Autorisé à répondre' : 'Consultation seule'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editCanReply}
                    onChange={(e) => setEditCanReply(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submittingEdit ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
