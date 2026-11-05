const T = 'transtu_token';
const U = 'transtu_user';
export const getToken = () => { try { return localStorage.getItem(T); } catch { return null; } };
export const setToken = (v) => { try { v ? localStorage.setItem(T, v) : localStorage.removeItem(T); } catch { /* ignore */ } };
export const getStoredUser = () => { try { return JSON.parse(localStorage.getItem(U) || 'null'); } catch { return null; } };
export const setStoredUser = (u) => { try { u ? localStorage.setItem(U, JSON.stringify(u)) : localStorage.removeItem(U); } catch { /* ignore */ } };
export const STORAGE_KEYS = { T, U };
