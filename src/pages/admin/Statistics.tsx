import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Star,
  MessageCircle,
  Award,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/supabase';
import type { Feedback, Question, ServiceItem } from '../../types/database';

export const AdminStatistics: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedService, setSelectedService] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [fb, q, svcs] = await Promise.all([
          api.getFeedbackList(),
          api.getQuestionsList(),
          api.getAllServices(),
        ]);
        setFeedback(fb);
        setQuestions(q);
        setServices(svcs);
      } catch (err) {
        console.error('Erreur chargement statistiques:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrer par période
  const now = new Date();
  const getPeriodStartDate = () => {
    if (period === '7d') return new Date(now.getTime() - 7 * 86400000);
    if (period === '30d') return new Date(now.getTime() - 30 * 86400000);
    if (period === '90d') return new Date(now.getTime() - 90 * 86400000);
    return new Date(0);
  };

  const periodStart = getPeriodStartDate();

  const filteredFeedback = feedback.filter((f) => {
    const d = new Date(f.created_at);
    if (d < periodStart) return false;
    if (selectedService !== 'all' && f.service_id !== selectedService) return false;
    return true;
  });

  const filteredQuestions = questions.filter((q) => {
    const d = new Date(q.created_at);
    return d >= periodStart;
  });

  // Indicateurs clés
  const totalFeedback = filteredFeedback.length;
  const averageRating =
    totalFeedback > 0
      ? (
          filteredFeedback.reduce((acc, curr) => acc + curr.rating, 0) /
          totalFeedback
        ).toFixed(2)
      : '0.00';

  const positiveFeedback = filteredFeedback.filter((f) => f.rating >= 4).length;
  const negativeFeedback = filteredFeedback.filter((f) => f.rating <= 2).length;
  const satisfactionRate =
    totalFeedback > 0
      ? Math.round((positiveFeedback / totalFeedback) * 100)
      : 100;

  const totalQuestions = filteredQuestions.length;
  const repliedQuestions = filteredQuestions.filter((q) => q.status === 'replied').length;
  const receivedQuestions = filteredQuestions.filter((q) => q.status === 'received').length;
  const responseRate =
    totalQuestions > 0
      ? Math.round((repliedQuestions / totalQuestions) * 100)
      : 100;

  // Répartition des notes (1 à 5 étoiles) en pourcentages
  const ratingDistribution = [1, 2, 3, 4, 5].map((star) => {
    const count = filteredFeedback.filter((f) => f.rating === star).length;
    const percentage = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;
    return {
      star: `${star} ⭐`,
      count,
      percentage,
    };
  });

  // Évolution chronologique par date (groupement par jour)
  const timelineMap: Record<string, { date: string; avis: number; noteMoyenne: number; totalStars: number }> = {};
  filteredFeedback.forEach((f) => {
    const dateKey = new Date(f.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });
    if (!timelineMap[dateKey]) {
      timelineMap[dateKey] = { date: dateKey, avis: 0, noteMoyenne: 0, totalStars: 0 };
    }
    timelineMap[dateKey].avis += 1;
    timelineMap[dateKey].totalStars += f.rating;
  });

  const timelineData = Object.values(timelineMap).map((item) => ({
    date: item.date,
    avis: item.avis,
    note: Number((item.totalStars / item.avis).toFixed(1)),
  }));

  // Répartition par service
  const serviceStatsMap: Record<string, { name: string; count: number; noteMoyenne: number; totalStars: number }> = {};
  services.forEach((s) => {
    serviceStatsMap[s.id] = { name: s.name, count: 0, noteMoyenne: 0, totalStars: 0 };
  });

  filteredFeedback.forEach((f) => {
    if (f.service_id && serviceStatsMap[f.service_id]) {
      serviceStatsMap[f.service_id].count += 1;
      serviceStatsMap[f.service_id].totalStars += f.rating;
    }
  });

  const serviceChartData = Object.values(serviceStatsMap)
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.name.length > 18 ? s.name.slice(0, 18) + '...' : s.name,
      avis: s.count,
      moyenne: Number((s.totalStars / s.count).toFixed(1)),
    }));

  const COLORS = ['#e11d48', '#f97316', '#eab308', '#10b981', '#059669'];

  return (
    <div className="space-y-6">
      {/* En-tête & Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Statistiques & Performance
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Analyses détaillées de la satisfaction et de la réactivité client
          </p>
        </div>

        {/* Filtres Période et Service */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-stone-300 text-stone-700 shadow-xs focus:ring-2 focus:ring-amber-500"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="all">Tout l'historique</option>
          </select>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-stone-300 text-stone-700 shadow-xs focus:ring-2 focus:ring-amber-500"
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

      {/* Cartes Métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Moyenne Générale */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Note Moyenne</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-amber-900">{averageRating}</span>
            <span className="text-xs text-stone-400">/ 5</span>
          </div>
          <span className="block text-[11px] text-stone-500 mt-1">
            Sur {totalFeedback} avis collectés
          </span>
        </div>

        {/* Taux de Satisfaction */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Satisfaction</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-emerald-700">
              {satisfactionRate}%
            </span>
          </div>
          <span className="block text-[11px] text-stone-500 mt-1">
            {positiveFeedback} avis positifs (4-5 ⭐)
          </span>
        </div>

        {/* Questions WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Questions</span>
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-stone-900">{totalQuestions}</span>
          </div>
          <span className="block text-[11px] text-stone-500 mt-1">
            {repliedQuestions} répondues · {receivedQuestions} reçues
          </span>
        </div>

        {/* Taux de Réponse */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Taux de Réponse</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-stone-900">{responseRate}%</span>
          </div>
          <span className="block text-[11px] text-stone-500 mt-1">
            Traitement direct WhatsApp
          </span>
        </div>
      </div>

      {/* Graphiques Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1 : Répartition des notes (1 à 5 étoiles) */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col">
          <h2 className="font-serif font-bold text-base text-stone-900 mb-1">
            Répartition des notes
          </h2>
          <p className="text-xs text-stone-400 mb-4">
            Pourcentage des avis attribués par niveau d'étoiles
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f1" />
                <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="star" type="category" tick={{ fontSize: 11 }} width={55} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload.count} avis)`,
                    'Part',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" fill="#b45309" radius={[0, 8, 8, 0]}>
                  {ratingDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Satisfaction par Service */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col">
          <h2 className="font-serif font-bold text-base text-stone-900 mb-1">
            Volume & Avis par Service
          </h2>
          <p className="text-xs text-stone-400 mb-4">
            Nombre d'avis et évaluation moyenne par prestation
          </p>

          <div className="h-64 w-full">
            {serviceChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Pas assez de données pour les services sélectionnés
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceChartData} margin={{ top: 10, right: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} stroke="#b45309" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="avis" fill="#d97706" name="Nombre d'avis" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Graphique 3 : Évolution temporelle (Line Chart) */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <h2 className="font-serif font-bold text-base text-stone-900 mb-1">
          Évolution chronologique des avis
        </h2>
        <p className="text-xs text-stone-400 mb-4">
          Fluctuation des avis reçus au cours de la période sélectionnée
        </p>

        <div className="h-64 w-full">
          {timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Aucun avis dans la période sélectionnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="avis"
                  stroke="#78350f"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#d97706' }}
                  activeDot={{ r: 6 }}
                  name="Nombre d'avis"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
