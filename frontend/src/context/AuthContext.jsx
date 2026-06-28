import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { resolveImageUrl } from '../utils/imageUrl';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize avatar URLs — Cloudinary URLs are always full https://
  const normalizeUser = (userData) => {
    if (!userData) return userData;
    if (userData.avatar_url) {
      return { ...userData, avatar_url: resolveImageUrl(userData.avatar_url) };
    }
    return userData;
  };

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.user();
      setUser(normalizeUser(data));
    } catch (err) {
      // Only clear token on 401 Unauthorized — not on network errors (CORS, server down, etc.)
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(normalizeUser(data.user));
    window.dispatchEvent(new CustomEvent('auth:login'));
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('token', data.token);
    setUser(normalizeUser(data.user));
    window.dispatchEvent(new CustomEvent('auth:login'));
    return data;
  };

  // ── OTP: Send verification code ──────────────────────────────────
  const sendOtp = async ({ email, type, name, password, password_confirmation }) => {
    const { data } = await authAPI.sendOtp({ email, type, name, password, password_confirmation });
    return data;
  };

  // ── OTP: Verify code & complete auth ─────────────────────────────
  const verifyOtp = async ({ email, code, type }) => {
    const { data } = await authAPI.verifyOtp({ email, code, type });
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(normalizeUser(data.user));
      window.dispatchEvent(new CustomEvent('auth:login'));
    }
    return data;
  };

  // ── Google OAuth ────────────────────────────────────────────────
  const googleLogin = async () => {
    const { data } = await authAPI.googleRedirect();
    // Open Google login in a popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const popup = window.open(
      data.url,
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    return new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        // Security: only accept messages from our own origin
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'google-auth') {
          window.removeEventListener('message', handleMessage);
          if (event.data.token) {
            localStorage.setItem('token', event.data.token);
            setUser(normalizeUser(event.data.user));
            window.dispatchEvent(new CustomEvent('auth:login'));
            resolve(event.data);
          } else {
            reject(new Error(event.data.error || 'Google authentication failed.'));
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Login cancelled.'));
        }
      }, 500);
    });
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  const updateProfile = async (profileData) => {
    const { data } = await authAPI.updateProfile(profileData);
    setUser(normalizeUser(data));
    return data;
  };

  const uploadAvatar = async (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    const { data } = await authAPI.uploadAvatar(fd);
    const avatarUrl = resolveImageUrl(data.avatar_url);
    setUser(prev => ({ ...prev, avatar_url: avatarUrl }));
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, uploadAvatar, isAdmin: user?.is_admin, sendOtp, verifyOtp, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}