import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockGetUserProfile = jest.fn();
const mockGetUserVideos = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../services/api', () => ({
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  getUserVideos: (...args: unknown[]) => mockGetUserVideos(...args),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  createOrGetConversation: jest.fn(),
  ChatBlockedError: class ChatBlockedError extends Error {},
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 }, accessToken: 'token-123' }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
    useRoute: () => ({ params: { userId: 5 } }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return cleanup;
      }, []);
    },
  };
});

jest.mock('@expo/vector-icons', () => ({
  AntDesign: () => null,
  FontAwesome: () => null,
  MaterialIcons: () => null,
}));

import UserProfile from '../pages/UserProfile';

const profile = {
  id: 5,
  username: 'creator',
  email: 'creator@example.com',
  bio: '',
  profile_picture: null,
  professional_title: '',
  professional_institution: '',
  senescyt_number: '',
  senescyt_verified: false,
  senescyt_verified_name: '',
  senescyt_verified_at: null,
  birth_date: null,
  is_adult: true,
  email_verified: true,
  followers_count: 0,
  following_count: 0,
  is_following: false,
};

const videos = [
  { id: 100, thumbnail_url: null, uri: 'https://example.com/a.mp4' },
  { id: 200, thumbnail_url: 'https://example.com/thumb.jpg', uri: 'https://example.com/b.mp4' },
];

// Regresión: al tocar un video publicado en la grilla del perfil no pasaba
// nada, porque las celdas no tenían onPress. Ahora deben navegar a la
// pantalla VideoViewer con el índice correcto dentro de los videos del perfil.
describe('UserProfile — ver un video publicado desde la grilla', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserProfile.mockResolvedValue(profile);
    mockGetUserVideos.mockResolvedValue(videos);
  });

  it('navega a VideoViewer con el índice del video tocado', async () => {
    const { findAllByTestId } = await render(<UserProfile />);
    const cells = await findAllByTestId('user-video-cell');
    expect(cells.length).toBe(2);

    await fireEvent.press(cells[1]);

    expect(mockNavigate).toHaveBeenCalledWith('VideoViewer', { userId: 5, startIndex: 1 });
  });
});
