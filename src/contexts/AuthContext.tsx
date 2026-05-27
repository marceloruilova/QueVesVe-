import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getUserProfile, decodeJWT, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = await AsyncStorage.getItem('userId');
        if (token && userId) {
          const profile = await getUserProfile(Number(userId), token);
          setAccessToken(token);
          setUser(profile);
        }
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await loginUser(username, password);
    const decoded = decodeJWT(data.access);
    const userId = decoded.user_id;
    const profile = await getUserProfile(userId, data.access);
    setAccessToken(data.access);
    setUser(profile);
    await AsyncStorage.setItem('accessToken', data.access);
    await AsyncStorage.setItem('refreshToken', data.refresh);
    await AsyncStorage.setItem('userId', String(userId));
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await registerUser(username, email, password);
    setAccessToken(data.access);
    setUser(data.user);
    await AsyncStorage.setItem('accessToken', data.access);
    await AsyncStorage.setItem('refreshToken', data.refresh);
    await AsyncStorage.setItem('userId', String(data.user.id));
  };

  const logout = async () => {
    setUser(null);
    setAccessToken(null);
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
