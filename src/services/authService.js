import { call, ApiError } from './http';
import { ENDPOINTS, PAYLOAD } from '../config/endpoints';
import { pick, unwrapObject, normalizeUser } from '../utils/normalize';

const readSession = (res) => ({
  token: pick(res, ['token', 'accessToken', 'access_token', 'jwt', 'data.token', 'data.accessToken']) ?? null,
  user: (() => {
    const u = pick(res, ['user', 'client', 'profile', 'data.user', 'data.client']);
    return u ? normalizeUser(u) : null;
  })(),
});

export const authService = {
  async login(values) {
    const res = await call(ENDPOINTS.auth.login, { body: PAYLOAD.login(values), auth: false });
    const s = readSession(res);
    if (!s.token) throw new ApiError('Le serveur a répondu sans jeton JWT. Vérifiez la réponse de la route de connexion.', 200, res);
    return s;
  },
  async register(values) {
    const res = await call(ENDPOINTS.auth.register, { body: PAYLOAD.register(values), auth: false });
    return readSession(res); // token peut être null : le backend ne connecte pas forcément à l'inscription
  },
  async me() {
    const res = await call(ENDPOINTS.auth.me);
    return normalizeUser(unwrapObject(res, ['user', 'client', 'profile', 'data']));
  },
};
