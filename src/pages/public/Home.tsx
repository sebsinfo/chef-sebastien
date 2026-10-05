import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../lib/supabase';
import { generateWhatsAppLink } from '../../lib/whatsapp';
import type { AppSettings } from '../../types/database';

export const HomePage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err) {
        console.warn('Erreur chargement paramètres:', err);
      }
    }
    load();
  }, []);

  const whatsappAdvisorUrl = generateWhatsAppLink(
    settings.whatsapp_number || '50937000000',
    settings.support_message || 'Bonjour Chef Sébastien, j’aimerais échanger avec un conseiller.'
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 w-full max-w-xl mx-auto text-center relative z-10">
      {/* Détail artisanal mobile : tampon miniature animé */}
      <div className="sm:hidden mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#d9ccb6] bg-[#faf4ea] select-none opacity-90 animate-stamp-mobile shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff0316] animate-pulse"></span>
        <span className="font-mono-custom text-[9.5px] tracking-wider text-[#6b5b51] uppercase">
          Delmas 54
        </span>
      </div>

      {/* TITRE (H1) : « Votre avis passe en cuisine. » */}
      <div className="relative inline-block animate-enter">
        <h1 className="font-fraunces font-bold text-[#1f1612] text-[clamp(2.35rem,7.5vw,4.25rem)] leading-[1.06] tracking-[-0.02em] max-w-[18ch] mx-auto">
          Votre avis <br className="sm:hidden" />
          passe en{' '}
          <span className="relative inline-block text-[#1f1612]">
            cuisine.
            {/* Trait SVG irrégulier souligné à la main en rouge #ff0316 */}
            <svg
              className="absolute -bottom-1.5 left-0 w-full h-[9px] text-[#ff0316] pointer-events-none overflow-visible"
              viewBox="0 0 160 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 7.5C32 3.8 78 4.2 118 6.5C138 7.7 152 9.2 158 8.8"
                stroke="#ff0316"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </h1>
      </div>

      {/* DESCRIPTION : Hanken Grotesk 18px, Brun doux #6b5b51, max 34rem */}
      <p className="mt-4 sm:mt-5 text-[#6b5b51] text-[16px] sm:text-[18px] leading-[1.45] max-w-[34rem] mx-auto font-normal">
        Une note, une question ou un mot pour l'équipe&nbsp;: on lit tout, et on vous répond sur WhatsApp.
      </p>

      {/* 3 BOUTONS EMPILÉS : 28px d'espace après la description */}
      <div className="mt-7 flex flex-col items-center w-full max-w-[360px] sm:max-w-[340px] gap-3">
        {/* Bouton 1 : Donner mon avis */}
        <Link
          to="/feedback"
          className="btn-tampon w-full h-14 bg-[#ff0316] text-[#faf4ea] rounded-[10px] flex items-center justify-center gap-3 px-5 text-[18px] font-semibold tracking-[-0.01em] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f1612]"
        >
          {/* Icône étoile SVG uniforme 1.75px */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              fill="currentColor"
            />
          </svg>
          <span>Donner mon avis</span>
        </Link>

        {/* Bouton 2 : Poser une question */}
        <Link
          to="/question"
          className="btn-outline w-full h-14 bg-transparent text-[#1f1612] rounded-[10px] flex items-center justify-center gap-3 px-5 text-[17px] sm:text-[18px] font-medium tracking-[-0.01em] no-underline"
        >
          {/* Icône bulle de message SVG uniforme 1.75px */}
          <svg
            className="w-5 h-5 flex-shrink-0 text-[#1f1612]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Poser une question</span>
        </Link>

        {/* Bouton 3 : Parler à un conseiller (WhatsApp direct) */}
        <a
          href={whatsappAdvisorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline w-full h-14 bg-transparent text-[#1f1612] rounded-[10px] flex items-center justify-center gap-3 px-5 text-[17px] sm:text-[18px] font-medium tracking-[-0.01em] no-underline"
        >
          {/* Icône officielle WhatsApp précise et élégante */}
          <svg
            className="w-5 h-5 flex-shrink-0 text-[#1f1612]"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 1.67c2.2 0 4.26.86 5.82 2.42a8.16 8.16 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.38 0-2.74-.36-3.94-1.05l-.29-.17-3.11.82.83-3.03-.19-.31a8.196 8.196 0 0 1-1.2-4.51c.01-4.54 3.7-8.24 8.21-8.24zm-3.22 3.67c-.18 0-.48.07-.73.34-.24.28-.92.92-.92 2.23 0 1.31.95 2.58 1.09 2.76.13.18 1.87 2.87 4.53 4.02.63.27 1.12.43 1.51.55.64.2 1.22.17 1.68.1.52-.08 1.58-.65 1.8-1.27.22-.62.22-1.15.15-1.26-.06-.11-.22-.17-.48-.3-.26-.13-1.55-.77-1.79-.86-.24-.09-.42-.13-.6.14-.17.26-.69.88-.84 1.05-.16.18-.31.2-.57.07-.26-.13-1.1-.4-2.09-1.28-.77-.69-1.29-1.54-1.44-1.8-.16-.26-.02-.4.11-.53.12-.12.26-.31.39-.46.13-.15.17-.26.26-.44.09-.18.04-.33-.02-.46-.07-.13-.59-1.41-.81-1.93-.21-.51-.43-.44-.59-.45-.15-.01-.32-.01-.5-.01z" />
          </svg>
          <span>Parler à un conseiller</span>
        </a>
      </div>
    </div>
  );
};
