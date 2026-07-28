import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ MaterialIcons: () => null }));

import EmailVerificationBanner from '../pages/Me/EmailVerificationBanner';

describe('EmailVerificationBanner', () => {
  it('ofusca el email mostrado (2 primeros caracteres + ****@dominio)', async () => {
    const { getByText } = await render(
      <EmailVerificationBanner email="marcelo@gmail.com" loading={false} onResend={jest.fn()} />,
    );
    expect(getByText('ma****@gmail.com')).toBeTruthy();
  });

  it('ofusca emails con local-part de 1 solo carácter sin romper', async () => {
    const { getByText } = await render(
      <EmailVerificationBanner email="a@gmail.com" loading={false} onResend={jest.fn()} />,
    );
    expect(getByText('a****@gmail.com')).toBeTruthy();
  });

  it('llama a onResend al tocar el botón', async () => {
    const onResend = jest.fn();
    const { getByText } = await render(
      <EmailVerificationBanner email="a@b.com" loading={false} onResend={onResend} />,
    );
    await fireEvent.press(getByText('Reenviar email de verificación'));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it('mientras loading=true oculta el texto del botón y no llama a onResend al tocar', async () => {
    const onResend = jest.fn();
    const { queryByText, getByTestId } = await render(
      <EmailVerificationBanner email="a@b.com" loading onResend={onResend} />,
    );
    expect(queryByText('Reenviar email de verificación')).toBeNull();
    await fireEvent.press(getByTestId('resend-verification-button'));
    expect(onResend).not.toHaveBeenCalled();
  });
});
