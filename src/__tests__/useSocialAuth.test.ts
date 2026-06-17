import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));
jest.mock('expo-auth-session/providers/facebook', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ socialLogin: jest.fn() }),
}));

import { useSocialAuth } from '../hooks/useSocialAuth';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';

describe('useSocialAuth — SOCIAL_AUTH_ENABLED = false', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  afterEach(() => alertSpy.mockClear());

  it('no crashea al inicializar sin client IDs configurados', async () => {
    await expect(renderHook(() => useSocialAuth())).resolves.toBeDefined();
  });

  it('handleGoogle muestra Alert "Próximamente" en vez de iniciar OAuth', async () => {
    const { result } = await renderHook(() => useSocialAuth());
    await act(async () => { result.current.handleGoogle(); });
    expect(alertSpy).toHaveBeenCalledWith('Próximamente', expect.any(String));
  });

  it('handleFacebook muestra Alert "Próximamente" en vez de iniciar OAuth', async () => {
    const { result } = await renderHook(() => useSocialAuth());
    await act(async () => { result.current.handleFacebook(); });
    expect(alertSpy).toHaveBeenCalledWith('Próximamente', expect.any(String));
  });

  it('Google.useAuthRequest recibe placeholder "disabled" cuando no hay client IDs', async () => {
    await renderHook(() => useSocialAuth());
    expect((Google.useAuthRequest as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'disabled', androidClientId: 'disabled' }),
    );
  });

  it('Facebook.useAuthRequest recibe placeholder "disabled" cuando no hay client IDs', async () => {
    await renderHook(() => useSocialAuth());
    expect((Facebook.useAuthRequest as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'disabled' }),
    );
  });

  it('socialLoading inicia en false', async () => {
    const { result } = await renderHook(() => useSocialAuth());
    expect(result.current.socialLoading).toBe(false);
  });

  it('socialError inicia vacío', async () => {
    const { result } = await renderHook(() => useSocialAuth());
    expect(result.current.socialError).toBe('');
  });
});
