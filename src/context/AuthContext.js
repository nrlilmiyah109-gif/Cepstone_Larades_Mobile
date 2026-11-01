import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  initServerUrl,
  getAuthToken,
  getSavedUser,
  setAuthSession,
  clearAuthSession,
  apiFetch,
} from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        await initServerUrl();
        const savedToken = await getAuthToken();
        const savedUser = await getSavedUser();

        if (savedToken && savedUser) {
          if (savedUser.role === 'warga') {
            setToken(savedToken);
            setUser(savedUser);
          } else {
            await clearAuthSession();
          }
        }
      } catch (e) {
        console.warn('Gagal memuat sesi auth:', e);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  async function login(username, password) {
    const res = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const authToken = res.access_token || res.token;
    const userData = res.user;

    if (!authToken || !userData) {
      throw new Error('Format data login server tidak valid.');
    }

    if (userData.role !== 'warga') {
      throw new Error('Akses Ditolak: Aplikasi mobile LARADES dikhususkan untuk Warga Desa. Akun Petugas dan Kepala Desa silakan gunakan portal Web LARADES.');
    }

    await setAuthSession(authToken, userData);
    setToken(authToken);
    setUser(userData);
    return userData;
  }

  async function logout() {
    try {
      await apiFetch('/logout', { method: 'POST' }).catch(() => null);
    } finally {
      await clearAuthSession();
      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        loading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
