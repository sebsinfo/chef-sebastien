import React from 'react';
import { Link } from 'react-router-dom';

export const ConditionsPage: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-[40rem] mx-auto px-5 sm:px-6 py-6 sm:py-10">
      {/* En-tête de document */}
      <div className="mb-8 pb-5 border-b border-[#d9ccb6]">
        <div className="inline-flex items-center gap-1.5 font-mono-custom text-[11px] text-[#6b5b51] uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0316]"></span>
          <span>Atelier Delmas 54 · Registre Juridique</span>
        </div>
        <h1 className="font-fraunces font-bold text-[#1f1612] text-3xl sm:text-4xl tracking-[-0.02em] leading-tight">
          Conditions d'utilisation
        </h1>
        <p className="font-mono-custom text-[13px] text-[#6b5b51] mt-2">
          Dernière mise à jour : 4 octobre 2026
        </p>
      </div>

      {/* Texte complet des 10 articles */}
      <div className="space-y-6 text-[#1f1612] text-[17px] leading-[1.7]">
        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">1.</span>
            <span>Objet du site</span>
          </h2>
          <p className="text-[#1f1612]">
            Ce site, édité par Chef Sébastien (Delmas 54, Port-au-Prince, Haïti), permet de donner un avis, de poser une question et de contacter un conseiller. Il ne permet ni de commander, ni de payer, ni de réserver.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">2.</span>
            <span>Accès libre</span>
          </h2>
          <p className="text-[#1f1612]">
            Aucun compte n'est nécessaire pour les clients. L'espace d'administration est réservé aux personnes autorisées par Chef Sébastien.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">3.</span>
            <span>Donner un avis</span>
          </h2>
          <p className="text-[#1f1612]">
            Votre avis doit décrire une expérience réelle vécue chez Chef Sébastien. Il ne doit contenir ni insultes, ni propos discriminatoires, ni menaces, ni informations personnelles sur d'autres personnes, ni publicité. Vos avis sont lus par l'équipe pour améliorer nos services ; ils ne sont pas publiés sur le site.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">4.</span>
            <span>Poser une question</span>
          </h2>
          <p className="text-[#1f1612]">
            Indiquez votre nom, un numéro WhatsApp valide (le vôtre) et votre question. Nous vous répondons directement sur WhatsApp, dans les meilleurs délais, sans garantie de délai précis.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">5.</span>
            <span>WhatsApp</span>
          </h2>
          <p className="text-[#1f1612]">
            WhatsApp est un service tiers, soumis à ses propres conditions et à sa propre politique de confidentialité. Le bouton « Parler à un conseiller » ouvre WhatsApp avec un message prérempli : rien n'est envoyé tant que vous n'appuyez pas sur « Envoyer ».
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">6.</span>
            <span>Vos données</span>
          </h2>
          <p className="text-[#1f1612]">
            Nous enregistrons uniquement ce que vous saisissez dans les formulaires (note, service, commentaire, nom, numéro, question) et la date d'envoi. Votre numéro sert uniquement à vous répondre. Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité. Elles sont accessibles seulement aux administrateurs autorisés, et conservées [24 mois]. Pour consulter, corriger ou supprimer vos données, écrivez à{' '}
            <a href="mailto:contact@chefsebastienht.com" className="text-[#b8000f] underline underline-offset-2">
              contact@chefsebastienht.com
            </a>.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">7.</span>
            <span>Comportements interdits</span>
          </h2>
          <p className="text-[#1f1612]">
            Il est interdit d'envoyer des messages en masse, du contenu illégal, de faux avis, ou de tenter de pirater le site. Nous pouvons ignorer ou supprimer tout message contraire à ces règles.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">8.</span>
            <span>Responsabilité</span>
          </h2>
          <p className="text-[#1f1612]">
            Le site peut être interrompu pour maintenance ou en cas de problème technique. Chef Sébastien ne peut être tenu responsable d'une indisponibilité temporaire du site ou de WhatsApp.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">9.</span>
            <span>Propriété intellectuelle</span>
          </h2>
          <p className="text-[#1f1612]">
            Le nom, le logo, les textes et le design appartiennent à Chef Sébastien. Toute reproduction sans autorisation est interdite.
          </p>
        </div>

        <div>
          <h2 className="font-fraunces font-bold text-lg sm:text-xl text-[#1f1612] mb-1.5 flex items-baseline gap-2">
            <span className="font-mono-custom text-sm text-[#b8000f] font-medium">10.</span>
            <span>Modifications et contact</span>
          </h2>
          <p className="text-[#1f1612]">
            Nous pouvons modifier ces conditions ; la date de mise à jour figure en haut. Questions :{' '}
            <a href="mailto:contact@chefsebastienht.com" className="text-[#b8000f] underline underline-offset-2">
              contact@chefsebastienht.com
            </a>{' '}
            ou WhatsApp via le bouton « Parler à un conseiller ».
          </p>
        </div>
      </div>

      {/* Lien retour à l'accueil */}
      <div className="mt-10 pt-6 border-ticket flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#1f1612] hover:text-[#b8000f] font-medium font-fraunces text-lg transition-colors underline-offset-4 hover:underline"
        >
          <span>←</span>
          <span>Retour à l'accueil</span>
        </Link>
      </div>
    </div>
  );
};
