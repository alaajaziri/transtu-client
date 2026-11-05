export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
// Tunisie : 8 chiffres, indicatif +216 facultatif (même règle que le client)
export const isPhone = (v) => /^(\+?216)?[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}$/.test(String(v || '').trim());
export const normEmail = (v) => String(v || '').trim().toLowerCase();
export const normPhone = (v) => {
  const d = String(v || '').replace(/\D/g, '');
  return d ? d.slice(-8) : '';
};
/** Texte sans accents, minuscules (recherche de villes). */
export const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
