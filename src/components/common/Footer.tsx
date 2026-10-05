import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-4 relative z-10">
      <div className="max-w-xl mx-auto pt-3 border-ticket flex items-center justify-center gap-2 sm:gap-2.5 font-mono-custom text-[11.5px] sm:text-[12px] text-[#6b5b51]">
        <Link
          to="/conditions"
          className="text-[#6b5b51] hover:text-[#b8000f] transition-colors underline-offset-2 hover:underline"
        >
          Conditions d'utilisation
        </Link>
        <span className="text-[#d9ccb6]">·</span>
        <span>Chef Sébastien © 2026</span>
        <span className="text-[#d9ccb6]">·</span>

        {/* Cadenas discret vers /admin/login */}
        <Link
          to="/admin/login"
          className="inline-flex items-center justify-center w-10 h-10 -my-2 text-[#6b5b51] hover:text-[#b8000f] transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff0316]"
          aria-label="Accès administrateur"
          title="Administration"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </Link>
      </div>
    </footer>
  );
};
