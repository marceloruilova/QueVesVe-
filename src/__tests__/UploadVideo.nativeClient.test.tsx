import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUploadVideo = jest.fn();
const mockGetUploadQuota = jest.fn();
const mockCompress = jest.fn();

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: null },
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
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1000 }),
}));

import UploadVideo from '../pages/Record/UploadVideo';

// Contraparte de UploadVideo.expoGo.test.tsx: fuera de Expo Go (dev client
// nativo o build de producción, appOwnership !== 'expo') la compresión real
// debe seguir llamándose como siempre -- el fallback de Expo Go no debe
// desactivar la compresión nativa en un build real.
describe('UploadVideo fuera de Expo Go (dev client / producción)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUploadQuota.mockResolvedValue({
      used_bytes: 0,
      limit_bytes: 1_000_000,
      remaining_bytes: 999_000,
    });
    mockCompress.mockResolvedValue('file:///tmp/compressed.mp4');
  });

  it('llama al compresor nativo real y sube el resultado comprimido', async () => {
    const { getByText } = await render(<UploadVideo />);

    await waitFor(() => expect(mockCompress).toHaveBeenCalledTimes(1));
    expect(mockCompress).toHaveBeenCalledWith(
      'file:///tmp/original.mp4',
      { compressionMethod: 'auto' },
      expect.any(Function),
    );

    await waitFor(() => expect(getByText('Publicar')).toBeTruthy());
    fireEvent.press(getByText('Publicar'));

    await waitFor(() => expect(mockUploadVideo).toHaveBeenCalled());
    expect(mockUploadVideo).toHaveBeenCalledWith(
      'file:///tmp/compressed.mp4',
      expect.any(String),
      expect.any(String),
      expect.any(String),
      'token-123',
      true,
    );
  });
});
