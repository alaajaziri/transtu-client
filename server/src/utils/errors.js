export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
export const badRequest = (m, extra) => new HttpError(400, m, extra);
export const unauthorized = (m = 'Authentification requise.') => new HttpError(401, m);
export const forbidden = (m = 'Accès refusé.') => new HttpError(403, m);
export const notFound = (m = 'Introuvable.') => new HttpError(404, m);
export const conflict = (m) => new HttpError(409, m);

/** Enveloppe les handlers async (Express 4 ne capte pas les rejets). */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...err.extra });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON invalide.' });
  console.error(err);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
}
