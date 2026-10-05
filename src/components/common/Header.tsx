import React from 'react';
import { Link } from 'react-router-dom';
import type { AppSettings } from '../../types/database';

interface HeaderProps {
  settings?: AppSettings;
}

export const Header: React.FC<HeaderProps> = ({ settings }) => {
  const currentLogo = settings?.logo_url || '/logo.png';

  return (
    <header className="w-full px-5 sm:px-8 pt-4 sm:pt-6 pb-2 flex items-center justify-between z-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 group"
        aria-label="Chef Sébastien - Retour à l'accueil"
      >
        <img
          src={currentLogo}
          alt="Logo Chef Sébastien"
          className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          onError={(e) => {
            // Fallback si l'image locale met du temps
            e.currentTarget.src =
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCTepPCbVif_mm-e-MZGvcP_tCFPc9wRoGA-Z2KV6FW34jYUEhVCux4Hb1YCZwf69m0iSe4E-hSkRWcqbGKBmnN61qi2S-Lzi4eYbDxuSbNYkYE_r3AKj-cR9psTiIMLq7HSvmwOkUD7c5wcbH8mxntPmW5LI9hGv_kcJY0EmMR49TzU6kVfPciRAOZp0ifdTNnYm-aYsGSKcO3ezybMLa6iCcfxmvhbtIp5eC1IOwzynBqA7bSEkXyDdUJsRuPcBs4Oww';
          }}
        />
      </Link>

      {/* Petit détail artisanal d'atelier discret : tampon Delmas 54 animé */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#d9ccb6] bg-[#faf4ea]/90 shadow-xs select-none pointer-events-none opacity-90 animate-stamp">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff0316] animate-pulse"></span>
        <span className="font-mono-custom text-[10.5px] uppercase tracking-wider text-[#6b5b51]">
          Delmas 54 · Haïti
        </span>
      </div>
    </header>
  );
};
