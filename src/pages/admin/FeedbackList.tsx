import React, { useEffect, useState } from 'react';
import {
  Star,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Phone,
  Calendar,
  MessageSquare,
  Clock,
  Sparkles,
  Image as ImageIcon,
  X,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/supabase';
import { StarRating } from '../../components/common/StarRating';
import { formatPhoneForWhatsApp } from '../../lib/whatsapp';
import type { Feedback, FeedbackStatus, ServiceItem } from '../../types/database';

export const FeedbackList: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
  const [deletingFeedback, setDeletingFeedback] = useState(false);

  const loadData = async () => {
    try {
      const [fb, svcs] = await Promise.all([
        api.getFeedbackList(),
        api.getAllServices(),
      ]);
      setFeedbackList(fb);
      setServices(svcs);
    } catch (err) {
      console.error('Erreur chargement avis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    await api.updateFeedbackStatus(feedbackId, newStatus);
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
    );
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    setDeletingFeedback(true);
    try {
      const ok = await api.deleteFeedback(feedbackToDelete.id);
      if (ok) {
        setFeedbackList((prev) => prev.filter((f) => f.id !== feedbackToDelete.id));
        setFeedbackToDelete(null);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de l’avis:', err);
    } finally {
      setDeletingFeedback(false);
    }
  };

  // Filtrage
  const filteredList = feedbackList.filter((fb) => {
    // Filtre statut
    if (statusFilter !== 'all' && fb.status !== statusFilter) return false;
    // Filtre note
    if (ratingFilter !== 'all' && fb.rating !== parseInt(ratingFilter, 10)) return false;
    // Filtre service
    if (serviceFilter !== 'all' && fb.service_id !== serviceFilter) return false;
    // Recherche par texte ou nom
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchComment = fb.comment.toLowerCase().includes(query);
      const matchName = fb.customer_name?.toLowerCase().includes(query);
      const matchPhone = fb.customer_phone?.toLowerCase().includes(query);
      if (!matchComment && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const getRatingBadge = (rating: number) => {
    if (rating <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Attention ⚠️</span>
        </span>
      );
    }
    if (rating === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Normal
        </span>
      );
    }
    if (rating === 4) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Positif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
        <Sparkles className="w-3 h-3" />
        <span>Très positif</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Avis Clients
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Suivi des retours d'expérience, classifications et traitement
          </p>
        </div>
        <div className="text-xs font-semibold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200 self-start sm:self-auto">
          {filteredList.length} avis affiché{filteredList.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Barre de Filtres */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-xs font-bold text-stone-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-amber-700" />
          <span>Filtres de recherche</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche texte */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher mot, nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filtre Statut */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente (Pending)</option>
              <option value="reviewed">Consulté (Reviewed)</option>
              <option value="resolved">Résolu (Resolved)</option>
              <option value="archived">Archivé (Archived)</option>
            </select>
          </div>

          {/* Filtre Note */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes les notes (1 à 5)</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 étoiles)</option>
              <option value="4">⭐⭐⭐⭐ (4 étoiles)</option>
              <option value="3">⭐⭐⭐ (3 étoiles)</option>
              <option value="2">⭐⭐ (2 étoiles - Attention)</option>
              <option value="1">⭐ (1 étoile - Attention)</option>
            </select>
          </div>

          {/* Filtre Service */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous les services</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Avis (Cartes empilées Mobile-First) */}
      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Chargement des avis...</div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
          <p className="text-stone-700 font-medium">Aucun avis ne correspond à vos filtres.</p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setRatingFilter('all');
              setServiceFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-amber-800 hover:underline font-semibold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((fb) => (
            <div
              key={fb.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${
                fb.rating <= 2
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-stone-200 hover:border-amber-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < fb.rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  {getRatingBadge(fb.rating)}
                  <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md">
                    {fb.service_name || 'Service'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(fb.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Commentaire Client */}
              <div className="my-3.5 text-stone-800 text-sm leading-relaxed bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/80 font-sans">
                « {fb.comment} »
              </div>

              {/* Photo justificative si présente */}
              {fb.image_url && (
                <div className="mb-3.5 flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <img
                    src={fb.image_url}
                    alt="Justificatif avis client"
                    onClick={() => setSelectedImage(fb.image_url || null)}
                    className="w-14 h-14 rounded-lg object-cover border border-amber-300 shadow-xs cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                      <span>Photo justificative jointe par le client</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(fb.image_url || null)}
                      className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold underline mt-0.5"
                    >
                      Agrandir la photo
                    </button>
                  </div>
                </div>
              )}

              {/* Client & Traitement */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <span className="font-semibold text-stone-900">
                    {fb.customer_name || 'Client anonyme'}
                  </span>
                  {fb.customer_phone && (
                    <a
                      href={`https://wa.me/${formatPhoneForWhatsApp(fb.customer_phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{fb.customer_phone}</span>
                    </a>
                  )}
                </div>

                {/* Sélecteur de statut modifiable */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-stone-400 font-medium">Statut :</span>
                  <select
                    value={fb.status}
                    onChange={(e) =>
                      handleStatusChange(fb.id, e.target.value as FeedbackStatus)
                    }
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-hidden focus:ring-1 ${
                      fb.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : fb.status === 'reviewed'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : fb.status === 'archived'
                        ? 'bg-stone-100 text-stone-600 border-stone-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="pending">En attente (Pending)</option>
                    <option value="reviewed">Consulté (Reviewed)</option>
                    <option value="resolved">Résolu (Resolved)</option>
                    <option value="archived">Archivé (Archived)</option>
                  </select>

                  {/* Bouton Supprimer Avis */}
                  <button
                    type="button"
                    onClick={() => setFeedbackToDelete(fb)}
                    title="Supprimer définitivement cet avis"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors ml-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Confirmation de Suppression d'un Avis */}
      {feedbackToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setFeedbackToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                  Supprimer cet avis ?
                </h3>
                <p className="text-xs text-stone-500">
                  Cette action est définitive et irréversible.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1 mb-5">
              <div className="font-bold text-stone-900">
                {feedbackToDelete.customer_name || 'Client anonyme'} ({feedbackToDelete.rating} ⭐)
              </div>
              <p className="italic text-stone-600 line-clamp-3">
                « {feedbackToDelete.comment} »
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFeedbackToDelete(null)}
                disabled={deletingFeedback}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteFeedback}
                disabled={deletingFeedback}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingFeedback ? 'Suppression...' : 'Supprimer définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Photo Justificative */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-stone-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Justificatif de l'avis client
                </h3>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-stone-100 max-h-[70vh] flex items-center justify-center border border-stone-200">
              <img
                src={selectedImage}
                alt="Justificatif complet"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
