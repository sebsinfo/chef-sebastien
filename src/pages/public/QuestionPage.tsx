import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/supabase';
import { normalizeHaitiPhone } from '../../lib/whatsapp';

export const QuestionPage: React.FC = () => {
  // 3 champs obligatoires
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [question, setQuestion] = useState('');

  // Protection anti-spam honeypot
  const [honeypot, setHoneypot] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MAX_QUESTION_CHARS = 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Détection bot via honeypot
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    // 2. Validation Nom
    if (!customerName.trim()) {
      setErrorMessage('Veuillez entrer votre nom.');
      return;
    }

    // 3. Validation Téléphone WhatsApp (Haïti +509 suivi de 8 chiffres)
    const phoneCheck = normalizeHaitiPhone(customerPhone);
    if (!phoneCheck.isValid) {
      setErrorMessage(
        phoneCheck.error ||
          'Numéro invalide. Veuillez entrer 8 chiffres après +509 (ex: 3700 0000).'
      );
      return;
    }

    // 4. Validation Question
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setErrorMessage('Veuillez écrire votre question.');
      return;
    }

    if (cleanQuestion.length > MAX_QUESTION_CHARS) {
      setErrorMessage(`Votre question ne doit pas dépasser ${MAX_QUESTION_CHARS} caractères.`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.submitQuestion({
        customer_name: customerName.trim(),
        customer_phone: phoneCheck.normalized,
        question: cleanQuestion,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(res.error || 'Erreur lors de l’envoi de votre question.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’envoyer votre question pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Écran de succès exact demandé
  if (submitted) {
    return (
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-5 py-8 text-center animate-in fade-in duration-200">
        <div className="bg-[#faf4ea] rounded-2xl p-6 sm:p-8 border border-[#1f1612] shadow-[4px_4px_0_#1f1612]">
          <div className="w-14 h-14 rounded-full bg-[#ffe3e5] text-[#b8000f] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-fraunces font-bold text-2xl sm:text-3xl text-[#1f1612] mb-3">
            Question transmise !
          </h2>

          <div className="bg-white/80 border border-[#d9ccb6] rounded-xl p-4 text-[#1f1612] text-sm leading-relaxed mb-6 font-normal">
            « Votre question a bien été reçue. Notre équipe vous répondra dans les meilleurs délais. »
          </div>

          <p className="font-mono-custom text-[12px] text-[#6b5b51] mb-6">
            Réponse directement sur WhatsApp au {customerPhone}.
          </p>

          <Link
            to="/"
            className="btn-tampon w-full h-12 bg-[#ff0316] text-[#faf4ea] rounded-[10px] flex items-center justify-center font-semibold text-base no-underline"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6">
      {/* Lien Retour */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-mono-custom text-[#6b5b51] hover:text-[#b8000f] mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour</span>
      </Link>

      <div className="bg-[#faf4ea] rounded-2xl p-6 sm:p-7 border border-[#1f1612] shadow-[4px_4px_0_#1f1612]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 font-mono-custom text-[10.5px] uppercase tracking-wider text-[#6b5b51] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff0316]"></span>
            <span>Relation Client · Delmas 54</span>
          </div>
          <h1 className="font-fraunces font-bold text-2xl sm:text-3xl text-[#1f1612]">
            Poser une question
          </h1>
          <p className="text-sm text-[#6b5b51] mt-1">
            Posez votre question, notre équipe vous répondra directement sur WhatsApp
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-[#ffe3e5] border border-[#ff0316]/40 text-[#b8000f] text-xs">
            <AlertCircle className="w-4 h-4 text-[#b8000f] flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot invisible */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="website_field"
              tabIndex={-1}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* 1. Votre nom (Obligatoire) */}
          <div>
            <label
              htmlFor="questionCustomerName"
              className="block font-mono-custom text-[11px] font-semibold text-[#6b5b51] uppercase tracking-wider mb-1.5"
            >
              1. Votre nom <span className="text-[#ff0316]">*</span>
            </label>
            <input
              type="text"
              id="questionCustomerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Ex: Stéphane Beaubrun"
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#d9ccb6] bg-white text-[#1f1612] text-sm focus:outline-hidden focus:border-[#ff0316] focus:ring-1 focus:ring-[#ff0316]"
            />
          </div>

          {/* 2. Votre numéro WhatsApp (Obligatoire) */}
          <div>
            <label
              htmlFor="questionCustomerPhone"
              className="block font-mono-custom text-[11px] font-semibold text-[#6b5b51] uppercase tracking-wider mb-1.5"
            >
              2. Votre numéro WhatsApp <span className="text-[#ff0316]">*</span>
            </label>

            <div className="flex rounded-[10px] border border-[#d9ccb6] bg-white overflow-hidden focus-within:border-[#ff0316] focus-within:ring-1 focus-within:ring-[#ff0316]">
              <span className="inline-flex items-center px-3.5 bg-[#faf4ea] text-[#1f1612] font-mono-custom text-xs border-r border-[#d9ccb6] select-none font-medium">
                🇭🇹 +509
              </span>
              <input
                type="tel"
                id="questionCustomerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                placeholder="3700 0000"
                className="flex-1 px-3.5 py-3 text-[#1f1612] text-sm focus:outline-hidden bg-white"
              />
            </div>
          </div>

          {/* 3. Votre question (Obligatoire, max 1000 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="questionBody"
                className="block font-mono-custom text-[11px] font-semibold text-[#6b5b51] uppercase tracking-wider"
              >
                3. Votre question <span className="text-[#ff0316]">*</span>
              </label>
              <span className="font-mono-custom text-[10.5px] text-[#6b5b51]">
                {question.length}/{MAX_QUESTION_CHARS}
              </span>
            </div>

            <textarea
              id="questionBody"
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              maxLength={MAX_QUESTION_CHARS}
              placeholder="Ex: Bonjour Chef Sébastien, proposez-vous des formules buffet pour un événement à Delmas 54 ?"
              className="w-full px-3.5 py-3 rounded-[10px] border border-[#d9ccb6] bg-white text-[#1f1612] text-sm focus:outline-hidden focus:border-[#ff0316] focus:ring-1 focus:ring-[#ff0316] resize-none"
            />
          </div>

          {/* Bouton d'envoi tampon */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-tampon w-full h-13 mt-3 bg-[#ff0316] text-[#faf4ea] rounded-[10px] flex items-center justify-center gap-2 font-semibold text-base transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>Transmission en cours...</span>
            ) : (
              <span>Envoyer ma question</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
