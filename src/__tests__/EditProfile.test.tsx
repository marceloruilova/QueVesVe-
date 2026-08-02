import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRequestSenescytCaptcha = jest.fn();
const mockVerifySenescyt = jest.fn();
const mockUpdateUserProfile = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../services/api', () => ({
  requestSenescytCaptcha: (...args: unknown[]) => mockRequestSenescytCaptcha(...args),
  verifySenescyt: (...args: unknown[]) => mockVerifySenescyt(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 7, username: 'creator', bio: '', professional_title: '', senescyt_verified: false },
    accessToken: 'token-123',
    updateUser: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('@expo/vector-icons', () => ({
  AntDesign: () => null,
  MaterialIcons: () => null,
}));

jest.spyOn(Alert, 'alert');

import EditProfile from '../pages/EditProfile';

// Regresión: el portal de SENESCYT migró de dominio y ahora exige resolver
// un captcha para buscar (ya no alcanza con cédula + número de registro).
// Este flujo de 2 pasos (pedir captcha -> confirmar con la respuesta) es
// nuevo y no tenía ninguna cobertura.
describe('EditProfile — verificación SENESCYT con captcha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pide el código y muestra la imagen del captcha', async () => {
    mockRequestSenescytCaptcha.mockResolvedValue({
      challengeToken: 'tok-1',
      captchaImageBase64: 'ZmFrZWpwZWc=',
    });
    const { getByText, getByPlaceholderText, findByText } = await render(<EditProfile />);

    await fireEvent.press(getByText('Perfil profesional'));
    await fireEvent.changeText(getByPlaceholderText('Ej: 1712345678'), '1712345678');
    await fireEvent.press(getByText('Obtener código de verificación'));

    await waitFor(() => expect(mockRequestSenescytCaptcha).toHaveBeenCalledWith(7, 'token-123'));
    expect(await findByText('Código de la imagen')).toBeTruthy();
    expect(await findByText('Confirmar')).toBeTruthy();
  });

  it('confirma con el código escrito y muestra el banner de verificado', async () => {
    mockRequestSenescytCaptcha.mockResolvedValue({
      challengeToken: 'tok-1',
      captchaImageBase64: 'ZmFrZWpwZWc=',
    });
    mockVerifySenescyt.mockResolvedValue({
      detail: 'ok',
      verified_name: 'JUAN PEREZ',
      title: 'INGENIERO EN SISTEMAS',
      institution: 'UNIVERSIDAD CENTRAL',
    });
    const { getByText, getByPlaceholderText, findByText } = await render(<EditProfile />);

    await fireEvent.press(getByText('Perfil profesional'));
    await fireEvent.changeText(getByPlaceholderText('Ej: 1712345678'), '1712345678');
    await fireEvent.press(getByText('Obtener código de verificación'));
    await findByText('Confirmar');

    await fireEvent.changeText(getByPlaceholderText('Escribí el código'), '10z3');
    await fireEvent.press(getByText('Confirmar'));

    await waitFor(() =>
      expect(mockVerifySenescyt).toHaveBeenCalledWith(7, '1712345678', '10z3', 'tok-1', 'token-123'),
    );
    expect(await findByText('Verificado — JUAN PEREZ')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      '¡Verificado!',
      expect.stringContaining('JUAN PEREZ'),
    );
  });

  it('si falla la verificación, avisa y pide un código nuevo (el token ya se consumió)', async () => {
    mockRequestSenescytCaptcha.mockResolvedValue({
      challengeToken: 'tok-1',
      captchaImageBase64: 'ZmFrZWpwZWc=',
    });
    mockVerifySenescyt.mockRejectedValue(new Error('El código no coincide, intentá de nuevo.'));
    const { getByText, getByPlaceholderText, findByText, queryByText } = await render(<EditProfile />);

    await fireEvent.press(getByText('Perfil profesional'));
    await fireEvent.changeText(getByPlaceholderText('Ej: 1712345678'), '1712345678');
    await fireEvent.press(getByText('Obtener código de verificación'));
    await findByText('Confirmar');

    await fireEvent.changeText(getByPlaceholderText('Escribí el código'), 'mal');
    await fireEvent.press(getByText('Confirmar'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Verificación fallida', 'El código no coincide, intentá de nuevo.'),
    );
    // El captcha se limpia: hay que volver a pedir uno nuevo, no queda el botón "Confirmar" activo.
    expect(queryByText('Confirmar')).toBeNull();
    expect(await findByText('Obtener código de verificación')).toBeTruthy();
  });
});
