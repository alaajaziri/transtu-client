/** Vrai quand l'app tourne dans l'iframe de l'aperçu iPhone. */
export const isEmbedded = () => {
  try { return window.self !== window.top; } catch { return true; }
};
