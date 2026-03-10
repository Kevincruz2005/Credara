import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [worker, setWorker] = useState(() => {
    try {
      const saved = sessionStorage.getItem('credara_worker');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = useCallback(async (phone, password) => {
    const res = await apiLogin({ phone, password });
    const { token, worker: w } = res.data.data;
    sessionStorage.setItem('credara_token', token);
    sessionStorage.setItem('credara_worker', JSON.stringify(w));
    setWorker(w);
    return w;
  }, []);

  const register = useCallback(async (name, phone, password) => {
    const res = await apiRegister({ name, phone, password });
    const { token, worker: w } = res.data.data;
    sessionStorage.setItem('credara_token', token);
    sessionStorage.setItem('credara_worker', JSON.stringify(w));
    setWorker(w);
    return w;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('credara_token');
    sessionStorage.removeItem('credara_worker');
    setWorker(null);
  }, []);

  const refreshWorker = useCallback((updated) => {
    const merged = { ...worker, ...updated };
    sessionStorage.setItem('credara_worker', JSON.stringify(merged));
    setWorker(merged);
  }, [worker]);

  return (
    <AuthContext.Provider value={{ worker, login, register, logout, refreshWorker, isLoggedIn: !!worker }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
