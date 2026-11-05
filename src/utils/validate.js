export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
// Tunisie : 8 chiffres, indicatif +216 facultatif
export const isPhone = (v) => /^(\+?216)?[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}$/.test(String(v || '').trim());

export function validateRegister(v) {
  const e = {};
  if (String(v.name || '').trim().length < 2) e.name = 'Entrez votre nom complet.';
  if (!isEmail(v.email)) e.email = 'Adresse e-mail invalide.';
  if (!isPhone(v.phone)) e.phone = 'Numéro invalide (8 chiffres, ex. 22 123 456).';
  if (String(v.password || '').length < 6) e.password = 'Au moins 6 caractères.';
  if (v.password !== v.confirm) e.confirm = 'Les mots de passe ne correspondent pas.';
  return e;
}
export function validateLogin(v) {
  const e = {};
  if (!isEmail(v.email)) e.email = 'Adresse e-mail invalide.';
  if (!v.password) e.password = 'Entrez votre mot de passe.';
  return e;
}
