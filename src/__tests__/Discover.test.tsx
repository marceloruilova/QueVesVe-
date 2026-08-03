import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockSearchUsers = jest.fn();
const mockSearchVideos = jest.fn();
const mockGetTopVideos = jest.fn();
const mockFollowUser = jest.fn();
const mockUnfollowUser = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../services/api', () => ({
  searchUsers: (...args: unknown[]) => mockSearchUsers(...args),
  searchVideos: (...args: unknown[]) => mockSearchVideos(...args),
  getTopVideos: (...args: unknown[]) => mockGetTopVideos(...args),
  followUser: (...args: unknown[]) => mockFollowUser(...args),
  unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-123' }),
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
  AntDesign: () => null,
  MaterialCommunityIcons: () => null,
}));

import Discover from '../pages/Discover';

const userResults = [
  { id: 7, username: 'panafamosa', profile_picture: null, followers_count: 12, is_following: false },
];

const videoResults = [
  {
    id: 42,
    user_id: 9,
    username: 'creador1',
    profile_picture: null,
    description: 'Un video',
    tags: '',
    music: '',
    likes: 3,
    comments: 0,
    liked_by_user: false,
    is_following: false,
    uri: 'https://example.com/a.mp4',
    thumbnail_url: null,
    views_count: 10,
    category: '',
    source_type: 'ugc' as const,
    author_name: 'creador1',
  },
];

// Regresión: en el buscador (Panas) tocar un usuario o un video de los
// resultados (o del tab Top) no llevaba a ningún lado -- las tarjetas no
// tenían ningún onPress.
describe('Discover — tocar resultados navega al perfil o al video', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTopVideos.mockResolvedValue([]);
  });

  it('navega al perfil al tocar un usuario en los resultados de búsqueda', async () => {
    mockSearchUsers.mockResolvedValue(userResults);
    const { getByPlaceholderText, findByTestId } = await render(<Discover />);

    await fireEvent.changeText(getByPlaceholderText('Buscá a tus panas...'), 'pana');

    const card = await findByTestId('discover-user-card');
    await fireEvent.press(card);

    expect(mockNavigate).toHaveBeenCalledWith('UserProfile', { userId: 7 });
  });

  it('navega al video al tocar un resultado de búsqueda de videos', async () => {
    mockSearchVideos.mockResolvedValue(videoResults);
    const { getByPlaceholderText, getByText, findByTestId } = await render(<Discover />);

    await fireEvent.press(getByText('Videos'));
    await fireEvent.changeText(getByPlaceholderText('Buscá videos...'), 'baile');

    const card = await findByTestId('discover-video-card');
    await fireEvent.press(card);

    expect(mockNavigate).toHaveBeenCalledWith('VideoViewer', { videos: videoResults, startIndex: 0 });
  });

  it('navega al video al tocar un resultado del tab Top', async () => {
    mockGetTopVideos.mockResolvedValue(videoResults);
    const { getByText, findByTestId } = await render(<Discover />);

    await waitFor(() => expect(mockGetTopVideos).toHaveBeenCalled());
    await fireEvent.press(getByText('Top'));

    const card = await findByTestId('discover-video-card');
    await fireEvent.press(card);

    expect(mockNavigate).toHaveBeenCalledWith('VideoViewer', { videos: videoResults, startIndex: 0 });
  });
});
