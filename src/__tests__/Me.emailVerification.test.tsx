import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockGetUserVideos = jest.fn();
const mockResendVerificationEmail = jest.fn();

jest.mock('../services/api', () => ({
  getUserVideos: (...args: unknown[]) => mockGetUserVideos(...args),
  resendVerificationEmail: (...args: unknown[]) => mockResendVerificationEmail(...args),
}));

let mockUser = {
  id: 7,
  username: 'me',
  email: 'me@test.com',
  email_verified: false,
  followers_count: 0,
  following_count: 0,
  bio: '',
};
const mockRefreshUser = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, accessToken: 'token-123', logout: jest.fn(), refreshUser: mockRefreshUser }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return cleanup;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    },
  };
});

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: () => null,
  AntDesign: () => null,
  FontAwesome: () => null,
  Feather: () => null,
  Ionicons: () => null,
}));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));

jest.spyOn(Alert, 'alert');

import Me from '../pages/Me';

// Cubre los 2 bugs encontrados en el flujo de verificación de email:
// 1) el banner quedaba visible tras verificar porque nadie refrescaba el user.
// 2) el Alert de reenvío era idéntico tanto si se reenviaba de verdad como si
//    el usuario ya estaba verificado.
describe('Me — banner de verificación de email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserVideos.mockResolvedValue([]);
    mockUser = {
      id: 7,
      username: 'me',
      email: 'me@test.com',
      email_verified: false,
      followers_count: 0,
      following_count: 0,
      bio: '',
    };
  });

  it('muestra el banner cuando email_verified es false', async () => {
    const { getByText } = await render(<Me />);
    expect(getByText('Verificación de cuenta pendiente')).toBeTruthy();
  });

  it('no muestra el banner cuando email_verified es true', async () => {
    mockUser = { ...mockUser, email_verified: true };
    const { queryByText } = await render(<Me />);
    expect(queryByText('Verificación de cuenta pendiente')).toBeNull();
  });

  it('al entrar en foco, llama a refreshUser() (fix del banner stale)', async () => {
    await render(<Me />);
    await waitFor(() => expect(mockRefreshUser).toHaveBeenCalledTimes(1));
  });

  it('reenvío real: muestra el Alert genérico de "Email enviado"', async () => {
    mockResendVerificationEmail.mockResolvedValueOnce({ detail: 'Email de verificación reenviado.' });
    const { getByText } = await render(<Me />);

    await fireEvent.press(getByText('Reenviar email de verificación'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Email enviado', 'Revisá tu bandeja de entrada.'),
    );
    // En un reenvío real no hace falta refrescar el user todavía (sigue sin verificar).
    expect(mockRefreshUser).toHaveBeenCalledTimes(1); // solo la llamada del useFocusEffect
  });

  it('ya estaba verificado: muestra un Alert distinto (no el genérico de éxito) y refresca el user', async () => {
    mockResendVerificationEmail.mockResolvedValueOnce({ detail: 'Tu email ya está verificado.' });
    const { getByText } = await render(<Me />);

    await fireEvent.press(getByText('Reenviar email de verificación'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Ya estás verificado', 'Tu email ya está verificado.'),
    );
    expect(Alert.alert).not.toHaveBeenCalledWith('Email enviado', expect.any(String));
    // Se llama 2 veces: una al entrar en foco, otra al detectar "ya verificado".
    await waitFor(() => expect(mockRefreshUser).toHaveBeenCalledTimes(2));
  });

  it('rate limit: muestra el Alert de error con el mensaje del backend', async () => {
    mockResendVerificationEmail.mockRejectedValueOnce(new Error('Esperá 250 segundos antes de reenviar.'));
    const { getByText } = await render(<Me />);

    await fireEvent.press(getByText('Reenviar email de verificación'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Esperá 250 segundos antes de reenviar.'),
    );
  });
});
