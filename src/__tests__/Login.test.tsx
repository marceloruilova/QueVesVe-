import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: (...args: unknown[]) => mockLogin(...args) }),
}));

jest.mock('../hooks/useSocialAuth', () => ({
  useSocialAuth: () => ({
    handleGoogle: jest.fn(),
    handleFacebook: jest.fn(),
    socialLoading: false,
    socialError: '',
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));

import Login from '../pages/Login';

// Regresión: en algunos Android (temas de fábrica muy personalizados) el
// texto tipeado o el placeholder podían verse invisibles por no declarar un
// color explícito. Además faltaba el ojito para ver la contraseña en texto
// plano en lugar de asteriscos.
describe('Login — inputs y ojito de contraseña', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('llama a login con usuario y contraseña al enviar el formulario', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await render(<Login />);

    await fireEvent.changeText(getByPlaceholderText('Usuario o email'), 'user1');
    await fireEvent.changeText(getByPlaceholderText('Contraseña'), 'Passw0rd1');
    await fireEvent.press(getByText('Ingresar'));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('user1', 'Passw0rd1'));
  });

  it('la contraseña arranca oculta (secureTextEntry) y el ojito la muestra en texto plano', async () => {
    const { getByPlaceholderText, getByTestId } = await render(<Login />);

    const passwordInput = getByPlaceholderText('Contraseña');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    await fireEvent.press(getByTestId('login-password-toggle'));
    expect(passwordInput.props.secureTextEntry).toBe(false);

    await fireEvent.press(getByTestId('login-password-toggle'));
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});
