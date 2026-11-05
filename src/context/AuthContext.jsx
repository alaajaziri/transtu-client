import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { getStoredUser, getToken, setStoredUser, setToken, STORAGE_KEYS } from '../utils/storage';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [token, setTok] = useState(getToken());
  const [user, setUsr] = useState(getStoredUser());
  const [booting, setBooting] = useState(!!getToken() && !getStoredUser());

  const persist = useCallback((t, u) => {
    setToken(t); setStoredUser(u); setTok(t); setUsr(u);
  }, []);
  const logout = useCallback(() => persist(null, null), [persist]);
  // Synchronise avec le localStorage (utile entre l'écran principal et l'aperçu iPhone)
  const sync = useCallback(() => { setTok(getToken()); setUsr(getStoredUser()); }, []);

  useEffect(() => {
    if (token && !user) {
      authService.me()
        .then((u) => persist(token, u))
        .catch((e) => { if (e.status === 401) logout(); })
        .finally(() => setBooting(false));
    } else setBooting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e) => { if (!e.key || [STORAGE_KEYS.T, STORAGE_KEYS.U].includes(e.key)) sync(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('transtu:unauthorized', logout);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('transtu:unauthorized', logout);
    };
  }, [sync, logout]);

  const login = useCallback(async (creds) => {
    const { token: t, user: u } = await authService.login(creds);
    setToken(t);
    let usr = u;
    if (!usr) { try { usr = await authService.me(); } catch { /* profil indisponible */ } }
    persist(t, usr || null);
    return usr;
  }, [persist]);

  const register = useCallback(async (values) => {
    const { token: t, user: u } = await authService.register(values);
    if (t) { persist(t, u || null); return { loggedIn: true }; }
    return { loggedIn: false };
  }, [persist]);

  const updateUser = useCallback((u) => { setStoredUser(u); setUsr(u); }, []);

  const value = useMemo(() => ({
    token, user, booting, isAuthenticated: !!token, login, register, logout, updateUser, sync,
  }), [token, user, booting, login, register, logout, updateUser, sync]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
