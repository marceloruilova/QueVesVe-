import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUploadVideo = jest.fn();
const mockGetUploadQuota = jest.fn();
const mockCompress = jest.fn();
const mockGetInfoAsync = jest.fn();

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));

jest.mock('react-native-compressor', () => ({
  Video: { compress: (...args: unknown[]) => mockCompress(...args) },
}));

jest.mock('../services/api', () => ({
  uploadVideo: (...args: unknown[]) => mockUploadVideo(...args),
  getUploadQuota: (...args: unknown[]) => mockGetUploadQuota(...args),
  UploadRejectedError: class UploadRejectedError extends Error {},
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-123' }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { videoUri: 'file:///tmp/original.mp4' } }),
}));

jest.mock('@expo/vector-icons', () => ({ AntDesign: () => null }));

jest.mock('expo-av', () => ({
  Video: () => null,
  ResizeMode: { COVER: 'cover' },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
}));

import UploadVideo from '../pages/Record/UploadVideo';

// Regresión: el pico de memoria de la compresión nativa (react-native-compressor)
// escala con la resolución de origen, no con la duración -- un clip grabado en alta
// resolución puede agotar memoria nativa (no capturable desde JS, mata la app entera)
// aunque sea corto. Por eso, para un archivo crudo por arriba del umbral de
// seguridad, el transcode local se salta directamente y se sube el original sin
// tocar react-native-compressor -- el servidor comprime del lado suyo.
describe('UploadVideo con un archivo crudo pesado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUploadQuota.mockResolvedValue({
      used_bytes: 0,
      limit_bytes: 1_000_000_000,
      remaining_bytes: 999_000_000,
    });
  });

  it('salta la compresión nativa y sube el original cuando el archivo crudo supera el umbral', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 90 * 1024 * 1024 });

    const { getByText } = await render(<UploadVideo />);

    await waitFor(() => expect(getByText('Publicar')).toBeTruthy());
    expect(mockCompress).not.toHaveBeenCalled();

    fireEvent.press(getByText('Publicar'));

    await waitFor(() => expect(mockUploadVideo).toHaveBeenCalled());
    expect(mockUploadVideo).toHaveBeenCalledWith(
      'file:///tmp/original.mp4',
      expect.any(String),
      expect.any(String),
      expect.any(String),
      'token-123',
      false,
    );
  });

  it('comprime normalmente cuando el archivo crudo está por debajo del umbral', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 10 * 1024 * 1024 });
    mockCompress.mockResolvedValue('file:///tmp/compressed.mp4');

    const { getByText } = await render(<UploadVideo />);

    await waitFor(() => expect(mockCompress).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByText('Publicar')).toBeTruthy());
  });
});
