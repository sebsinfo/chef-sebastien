/**
 * Utilitaires WhatsApp et normalisation téléphonique pour Haïti (+509)
 */

/**
 * Normalise un numéro pour Haïti ou format international.
 * Entrée ex: "3700 0000", "+509 3700-0000", "50937000000"
 * Sortie BDD standard: "+50937000000"
 */
export function normalizeHaitiPhone(input: string): { isValid: boolean; normalized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, normalized: '', error: 'Le numéro de téléphone est requis.' };
  }

  // Nettoyer tous les caractères non numériques sauf le '+'
  const cleaned = input.trim().replace(/[\s\-\.\(\)]/g, '');

  let digitsOnly = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // Si l'utilisateur a entré 8 chiffres (format local Haïti, ex: 37000000)
  if (/^\d{8}$/.test(digitsOnly)) {
    digitsOnly = `509${digitsOnly}`;
  }

  // Vérifier si commence par 509 et contient 11 chiffres au total (509 + 8 chiffres)
  if (/^509\d{8}$/.test(digitsOnly)) {
    return {
      isValid: true,
      normalized: `+${digitsOnly}`,
    };
  }

  // Format international générique si non-haïtien mais valide (10 à 15 chiffres)
  if (/^\d{10,15}$/.test(digitsOnly)) {
    return {
      isValid: true,
      normalized: `+${digitsOnly}`,
    };
  }

  return {
    isValid: false,
    normalized: '',
    error: 'Format invalide. Pour Haïti, veuillez entrer 8 chiffres après +509 (ex: 3700 0000).',
  };
}

/**
 * Convertit un numéro de téléphone pour l'URL wa.me (chiffres uniquement, sans '+')
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Extrait le prénom d'un nom complet
 */
export function extractFirstName(fullName: string): string {
  if (!fullName) return 'Client';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName.trim();
}

/**
 * Prépare le message de réponse WhatsApp en remplaçant les balises dynamiques
 */
export function buildReplyMessage(template: string, customerName: string): string {
  const firstName = extractFirstName(customerName);
  const safeTemplate = template || 'Bonjour {prénom}, merci pour votre message.';
  return safeTemplate
    .replace(/\{prénom\}/gi, firstName)
    .replace(/\{prenom\}/gi, firstName)
    .replace(/\{nom\}/gi, customerName.trim());
}

/**
 * Génère le lien direct WhatsApp wa.me
 */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phoneNumber);
  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Ouvre WhatsApp dans un nouvel onglet
 */
export function openWhatsApp(phoneNumber: string, message: string): Window | null {
  const url = generateWhatsAppLink(phoneNumber, message);
  return window.open(url, '_blank', 'noopener,noreferrer');
}
