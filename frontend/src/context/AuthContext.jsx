import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api, { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [worker, setWorker] = useState(null);
  const [token, setToken] = useState(null);

  // Sync token to Axios defaults whenever it changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = useCallback(async (phone, password) => {
    const res = await apiLogin({ phone, password });
    const { token: newToken, worker: w } = res.data.data;
    setToken(newToken);
    setWorker(w);
    return w;
  }, []);

  const register = useCallback(async (name, phone, password) => {
    const res = await apiRegister({ name, phone, password });
    const { token: newToken, worker: w } = res.data.data;
    setToken(newToken);
    setWorker(w);
    return w;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setWorker(null);
  }, []);

  const refreshWorker = useCallback((updated) => {
    setWorker(prev => ({ ...prev, ...updated }));
  }, []);

  return (
    <AuthContext.Provider value={{ worker, token, login, register, logout, refreshWorker, isLoggedIn: !!worker }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
