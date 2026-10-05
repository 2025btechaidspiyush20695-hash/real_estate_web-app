import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getToken, setToken, clearToken } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      api
        .me()
        .then((d) => setUser(d.user))
        .catch(() => clearToken())
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  /** Store an already-obtained session (token + user) — used by the login page
   *  after captcha/2FA verification. */
  const applySession = useCallback((token, user) => {
    setToken(token);
    setUser(user);
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api.login(email, password);
    if (d.require2fa) {
      // Let the login page handle the 2FA step
      return d;
    }
    applySession(d.token, d.user);
    return d;
  }, [applySession]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, login, applySession, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
