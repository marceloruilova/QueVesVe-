import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const mockLoginUser = jest.fn();
const mockRegisterUser = jest.fn();
const mockSocialAuth = jest.fn();
const mockGetUserProfile = jest.fn();
const mockRefreshAccessToken = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-secure-store no trae mock de jest; simulamos su API con un Map en memoria.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __clear: () => store.clear(),
  };
});

jest.mock('../services/api', () => ({
  loginUser: (...args: unknown[]) => mockLoginUser(...args),
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
  socialAuth: (...args: unknown[]) => mockSocialAuth(...args),
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  refreshAccessToken: (...args: unknown[]) => mockRefreshAccessToken(...args),
  decodeJWT: (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()),
}));

import { AuthProvider, useAuth } from '../contexts/AuthContext';

function makeToken(expSecondsFromNow: number, userId = 1) {
  const payload = { user_id: userId, exp: Math.floor(Date.now() / 1000) + expSecondsFromNow };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `header.${b64}.sig`;
}

// Regresión: el access token de simplejwt expira (5 min por default) y hasta
// ahora el refresh token se guardaba pero nunca se usaba, así que cualquier
// pantalla que reusara el token vencido (feed, upload de video, etc.) recibía
// 401 "Unauthorized: /videos/" del backend sin ningún reintento.
describe('AuthContext — renovación automática de access token', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (SecureStore as unknown as { __clear: () => void }).__clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('al restaurar sesión con un access token ya vencido, lo renueva antes de usarlo (evita 401)', async () => {
    const expiredToken = makeToken(-120);
    const refreshToken = 'refresh-abc';
    const freshToken = makeToken(1800);

    await SecureStore.setItemAsync('accessToken', expiredToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await AsyncStorage.setItem('userId', '1');

    mockRefreshAccessToken.mockResolvedValue({ access: freshToken });
    mockGetUserProfile.mockResolvedValue({ id: 1, username: 'debugtest' });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRefreshAccessToken).toHaveBeenCalledWith(refreshToken);
    // La llamada al perfil (y por extensión, cualquier llamada autenticada
    // posterior) debe hacerse con el token renovado, nunca con el vencido.
    expect(mockGetUserProfile).toHaveBeenCalledWith(1, freshToken);
    expect(result.current.accessToken).toBe(freshToken);
  });

  it('si el refresh token también es inválido, cierra la sesión en vez de dejar un token vencido', async () => {
    await SecureStore.setItemAsync('accessToken', makeToken(-120));
    await SecureStore.setItemAsync('refreshToken', 'refresh-invalido');
    await AsyncStorage.setItem('userId', '1');

    mockRefreshAccessToken.mockRejectedValue(new Error('No se pudo renovar la sesión.'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.accessToken).toBeNull();
    expect(mockGetUserProfile).not.toHaveBeenCalled();
    expect(await SecureStore.getItemAsync('accessToken')).toBeNull();
  });

  it('renueva el access token proactivamente antes de que expire, sin esperar un 401', async () => {
    jest.useFakeTimers();

    mockLoginUser.mockResolvedValue({ access: makeToken(300), refresh: 'refresh-1' });
    mockGetUserProfile.mockResolvedValue({ id: 1, username: 'debugtest' });
    mockRefreshAccessToken.mockResolvedValue({ access: makeToken(300) });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('debugtest', 'DebugPass123!');
    });

    expect(mockRefreshAccessToken).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(300_000 - 60_000 + 1_000);
      await Promise.resolve();
    });

    expect(mockRefreshAccessToken).toHaveBeenCalledWith('refresh-1');
  });

  // Regresión: el banner de "verificá tu email" quedaba visible después de que
  // el usuario confirmara el link en el navegador, porque nada volvía a pedir
  // el perfil. refreshUser() es lo que las pantallas usan para corregir eso.
  it('refreshUser() vuelve a pedir el perfil y actualiza el estado del usuario', async () => {
    mockLoginUser.mockResolvedValue({ access: makeToken(300), refresh: 'refresh-1' });
    mockGetUserProfile.mockResolvedValue({ id: 1, username: 'debugtest', email_verified: false });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('debugtest', 'DebugPass123!');
    });

    expect(result.current.user?.email_verified).toBe(false);

    mockGetUserProfile.mockResolvedValue({ id: 1, username: 'debugtest', email_verified: true });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(mockGetUserProfile).toHaveBeenLastCalledWith(1, expect.any(String));
    expect(result.current.user?.email_verified).toBe(true);
  });
});
