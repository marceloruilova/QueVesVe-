import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockGetUserVideos = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../services/api', () => ({
  getUserVideos: (...args: unknown[]) => mockGetUserVideos(...args),
  resendVerificationEmail: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 7, username: 'me', email_verified: true, followers_count: 0, following_count: 0, bio: '' },
    accessToken: 'token-123',
    logout: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return cleanup;
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

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.0' },
}));

jest.mock('../pages/Me/EmailVerificationBanner', () => () => null);

import Me from '../pages/Me';

const videos = [
  { id: 100, thumbnail_url: null, uri: 'https://example.com/a.mp4' },
  { id: 200, thumbnail_url: 'https://example.com/thumb.jpg', uri: 'https://example.com/b.mp4' },
];

// Regresión: la misma falla que en UserProfile — tocar un video propio en el
// apartado "Yo" no hacía nada porque la celda era un View sin onPress.
describe('Me — ver un video propio desde la grilla', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserVideos.mockResolvedValue(videos);
  });

  it('navega a VideoViewer con el índice del video tocado', async () => {
    const { findAllByTestId } = await render(<Me />);
    const cells = await findAllByTestId('me-video-cell');
    expect(cells.length).toBe(2);

    await fireEvent.press(cells[1]);

    expect(mockNavigate).toHaveBeenCalledWith('VideoViewer', { userId: 7, startIndex: 1 });
  });
});
