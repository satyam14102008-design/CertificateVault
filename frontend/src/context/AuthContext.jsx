import { useCallback, useEffect, useMemo, useState } from 'react';
import { setAuthTokenProvider, setUnauthorizedHandler } from '../services/api';
import * as authService from '../services/authService';
import { AuthContext } from './contexts';
import { useToast } from '../hooks/useToast';

export function AuthProvider({ children }) {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setAuthTokenProvider(() => authService.getStoredToken());
  }, []);

  const logout = useCallback((reasonMessage = '') => {
    authService.clearStoredToken();
    setToken(null);
    setUser(null);
    if (reasonMessage) {
      toast.info('Session ended', reasonMessage);
    }
  }, [toast]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout('Session expired. Please log in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let active = true;
    const stored = authService.getStoredToken();
    if (!stored) {
      setInitializing(false);
      return undefined;
    }

    authService
      .getMe()
      .then((owner) => {
        if (!active) return;
        setUser(owner);
        setToken(stored);
      })
      .catch(() => {
        if (!active) return;
        authService.clearStoredToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    authService.setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      initializing,
      login,
      logout,
    }),
    [user, token, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
