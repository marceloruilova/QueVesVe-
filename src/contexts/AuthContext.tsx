import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { loginUser, registerUser, getUserProfile, decodeJWT, socialAuth, refreshAccessToken, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Renovamos el access token un poco antes de que expire para que ninguna
// pantalla llegue a usarlo vencido (evita 401 en /videos/ y demás endpoints).
const REFRESH_BUFFER_MS = 60_000;

function getExpiryMs(token: string): number {
  const decoded = decodeJWT(token);
  const exp = decoded.exp as number;
  return exp * 1000;
}

// Los tokens JWT viajan a SecureStore (Keychain/Keystore, cifrado en reposo);
// AsyncStorage no cifra, así que no es apto para credenciales de sesión.
async function storeSession(access: string, refresh: string, userId: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync('accessToken', access),
    SecureStore.setItemAsync('refreshToken', refresh),
    AsyncStorage.setItem('userId', userId),
  ]);
}

async function clearStoredSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken'),
    SecureStore.deleteItemAsync('refreshToken'),
    AsyncStorage.removeItem('userId'),
  ]);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const scheduleRefresh = (token: string) => {
    clearRefreshTimer();
    const delay = Math.max(getExpiryMs(token) - Date.now() - REFRESH_BUFFER_MS, 0);
    refreshTimerRef.current = setTimeout(() => {
      doRefresh();
    }, delay);
  };

  const doRefresh = async (): Promise<string | null> => {
    const rt = refreshTokenRef.current ?? (await SecureStore.getItemAsync('refreshToken'));
    if (!rt) return null;
    try {
      const { access } = await refreshAccessToken(rt);
      setAccessToken(access);
      await SecureStore.setItemAsync('accessToken', access);
      scheduleRefresh(access);
      return access;
    } catch {
      await logout();
      return null;
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      // Los timers de JS se pausan en background; al volver a foreground
      // revalidamos por si el access token ya venció mientras tanto.
      if (state === 'active' && accessToken) {
        if (Date.now() >= getExpiryMs(accessToken) - REFRESH_BUFFER_MS) {
          doRefresh();
        }
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const userId = await AsyncStorage.getItem('userId');
        if (!token || !userId) return;

        refreshTokenRef.current = refreshToken;
        let validToken = token;
        if (Date.now() >= getExpiryMs(token) - REFRESH_BUFFER_MS) {
          const refreshed = await doRefresh();
          if (!refreshed) return;
          validToken = refreshed;
        } else {
          scheduleRefresh(token);
        }

        const profile = await getUserProfile(Number(userId), validToken);
        setAccessToken(validToken);
        setUser(profile);
      } catch {
        await clearStoredSession();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
    return () => clearRefreshTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    const data = await loginUser(username, password);
    const decoded = decodeJWT(data.access);
    const userId = decoded.user_id;
    const profile = await getUserProfile(userId, data.access);
    refreshTokenRef.current = data.refresh;
    setAccessToken(data.access);
    setUser(profile);
    scheduleRefresh(data.access);
    await storeSession(data.access, data.refresh, String(userId));
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await registerUser(username, email, password);
    refreshTokenRef.current = data.refresh;
    setAccessToken(data.access);
    setUser(data.user);
    scheduleRefresh(data.access);
    await storeSession(data.access, data.refresh, String(data.user.id));
  };

  const socialLoginFn = async (provider: 'google' | 'facebook', token: string) => {
    const data = await socialAuth(provider, token);
    refreshTokenRef.current = data.refresh;
    setAccessToken(data.access);
    setUser(data.user);
    scheduleRefresh(data.access);
    await storeSession(data.access, data.refresh, String(data.user.id));
  };

  const logout = async () => {
    clearRefreshTimer();
    refreshTokenRef.current = null;
    setUser(null);
    setAccessToken(null);
    await clearStoredSession();
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, socialLogin: socialLoginFn, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
