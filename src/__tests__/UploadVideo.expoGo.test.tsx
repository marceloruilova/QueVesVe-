import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUploadVideo = jest.fn();
const mockGetUploadQuota = jest.fn();
const mockCompress = jest.fn();

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'expo' },
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

// Regresión: react-native-compressor no está linkeado en Expo Go y
// CompressorVideo.compress() tira "doesn't seem to be linked ... You are not
// using Expo Go", lo que tumbaba esta pantalla apenas se abría desde Expo Go.
// En Expo Go debe saltarse la compresión nativa y usar el video sin comprimir.
describe('UploadVideo en Expo Go (Constants.appOwnership === "expo")', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUploadQuota.mockResolvedValue({
      used_bytes: 0,
      limit_bytes: 1_000_000,
      remaining_bytes: 999_000,
    });
  });

  it('no llama al compresor nativo y sube el video sin comprimir', async () => {
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
});
