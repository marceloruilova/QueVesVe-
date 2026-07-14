import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockLoginUser = jest.fn();
const mockRegisterUser = jest.fn();
const mockSocialAuth = jest.fn();
const mockGetUserProfile = jest.fn();
const mockRefreshAccessToken = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('al restaurar sesión con un access token ya vencido, lo renueva antes de usarlo (evita 401)', async () => {
    const expiredToken = makeToken(-120);
    const refreshToken = 'refresh-abc';
    const freshToken = makeToken(1800);

    await AsyncStorage.setItem('accessToken', expiredToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
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
    await AsyncStorage.setItem('accessToken', makeToken(-120));
    await AsyncStorage.setItem('refreshToken', 'refresh-invalido');
    await AsyncStorage.setItem('userId', '1');

    mockRefreshAccessToken.mockRejectedValue(new Error('No se pudo renovar la sesión.'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.accessToken).toBeNull();
    expect(mockGetUserProfile).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('accessToken')).toBeNull();
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
});
