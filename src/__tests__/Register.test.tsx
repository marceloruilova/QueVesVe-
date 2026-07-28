import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ register: (...args: unknown[]) => mockRegister(...args) }),
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

jest.spyOn(Alert, 'alert');

import Register from '../pages/Register';

const PASSWORD = 'Passw0rd1';

// Regresión: no existe ninguna pantalla de "verificá tu email" en la app — el
// único aviso de que hay que verificar el correo es este Alert tras registrarse.
describe('Register — flujo de creación de cuenta y verificación de email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra al usuario, muestra el aviso de verificación y no navega a ninguna pantalla', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await render(<Register />);

    await fireEvent.changeText(getByPlaceholderText('Usuario'), 'nuevo');
    await fireEvent.changeText(getByPlaceholderText('Email'), 'nuevo@test.com');
    await fireEvent.changeText(getByPlaceholderText('Contraseña'), PASSWORD);

    await fireEvent.press(getByText('Registrarse'));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith('nuevo', 'nuevo@test.com', PASSWORD));
    expect(Alert.alert).toHaveBeenCalledWith(
      '¡Cuenta creada!',
      expect.stringContaining('nuevo@test.com'),
    );
    // No existe pantalla de verificación de email en la app: tras registrarse
    // no debe haber ninguna navegación.
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('muestra un error si register() falla y no dispara el Alert de éxito', async () => {
    mockRegister.mockRejectedValue(new Error('El usuario ya existe.'));
    const { getByPlaceholderText, getByText, findByText } = await render(<Register />);

    await fireEvent.changeText(getByPlaceholderText('Usuario'), 'dup');
    await fireEvent.changeText(getByPlaceholderText('Email'), 'dup@test.com');
    await fireEvent.changeText(getByPlaceholderText('Contraseña'), PASSWORD);
    await fireEvent.press(getByText('Registrarse'));

    expect(await findByText('El usuario ya existe.')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalledWith('¡Cuenta creada!', expect.any(String));
  });

  it('no registra si la contraseña no cumple los requisitos de seguridad', async () => {
    const { getByPlaceholderText, getByText } = await render(<Register />);

    await fireEvent.changeText(getByPlaceholderText('Usuario'), 'nuevo');
    await fireEvent.changeText(getByPlaceholderText('Email'), 'nuevo@test.com');
    await fireEvent.changeText(getByPlaceholderText('Contraseña'), 'abc');
    await fireEvent.press(getByText('Registrarse'));

    expect(mockRegister).not.toHaveBeenCalled();
  });
});
