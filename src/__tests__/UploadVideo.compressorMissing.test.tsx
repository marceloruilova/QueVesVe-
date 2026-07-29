import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockUploadVideo = jest.fn();
const mockGetUploadQuota = jest.fn();

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
}));

// Simula un dev client cuyo binario nativo quedó desactualizado respecto al
// react-native-compressor del package.json: el propio `require()` truena al
// construir su NativeEventEmitter, igual que describe el comentario en
// UploadVideo/index.tsx ("doesn't seem to be linked... You are not using
// Expo Go"). executionEnvironment !== 'storeClient' acá, así que la
// heurística de Expo Go sola no lo cubre -- tiene que ser el try/catch
// alrededor del require.
jest.mock('react-native-compressor', () => {
  throw new Error("react-native-compressor doesn't seem to be linked. Make sure: \n\n - You are not using Expo Go");
});

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

// Regresión: fuera de Expo Go, si el dev client no tiene realmente linkeado
// react-native-compressor (binario desactualizado respecto al package.json),
// el require() del módulo nativo puede tronar por sí solo antes de que
// cualquier try/catch del componente llegue a correr, tumbando la pantalla
// de subida entera sin dejar ni cargar la descripción. El fallback debe
// tratar esto igual que en Expo Go: usar la compresión sin cambios y dejar
// que el servidor comprima.
describe('UploadVideo cuando react-native-compressor no está realmente linkeado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUploadQuota.mockResolvedValue({
      used_bytes: 0,
      limit_bytes: 1_000_000,
      remaining_bytes: 999_000,
    });
  });

  it('no crashea y deja usar la pantalla igual (fallback sin compresión)', async () => {
    const { getByText, getByPlaceholderText } = await render(<UploadVideo />);

    await waitFor(() => expect(getByText('Publicar')).toBeTruthy());
    expect(getByPlaceholderText('Contá de qué se trata...')).toBeTruthy();
  });
});
