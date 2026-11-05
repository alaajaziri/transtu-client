import { call } from './http';
import { ENDPOINTS, PAYLOAD } from '../config/endpoints';
import { normalizeUser, unwrapObject } from '../utils/normalize';

export const userService = {
  async get() {
    const res = await call(ENDPOINTS.users.profile);
    return normalizeUser(unwrapObject(res, ['user', 'client', 'profile', 'data']));
  },
  async update(values) {
    const res = await call(ENDPOINTS.users.updateProfile, { body: PAYLOAD.updateProfile(values) });
    const obj = res && typeof res === 'object' ? unwrapObject(res, ['user', 'client', 'profile', 'data']) : null;
    return obj && (obj.name || obj.email || obj.nom) ? normalizeUser(obj) : null;
  },
  async changePassword(values) {
    await call(ENDPOINTS.users.changePassword, { body: PAYLOAD.changePassword(values) });
  },
};
