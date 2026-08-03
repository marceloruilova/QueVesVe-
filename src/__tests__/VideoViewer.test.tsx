import React from 'react';
import { render } from '@testing-library/react-native';

const mockGetUserVideos = jest.fn();
let mockRouteParams: Record<string, unknown> = { userId: 5, startIndex: 1 };

jest.mock('../services/api', () => ({
  getUserVideos: (...args: unknown[]) => mockGetUserVideos(...args),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 }, accessToken: 'token-123' }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    useNavigation: () => ({ goBack: jest.fn() }),
    useRoute: () => ({ params: mockRouteParams }),
    useIsFocused: () => true,
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return cleanup;
      }, []);
    },
  };
});

jest.mock('react-native-pager-view', () => {
  const { View } = require('react-native');
  return ({ children, initialPage }: { children: React.ReactNode; initialPage?: number }) => (
    <View testID="video-viewer-pager" initialPage={initialPage}>
      {children}
    </View>
  );
});

// Reemplazo simple del ítem del feed: expone `item` y `play` como props
// legibles por el test, sin renderizar expo-av/lottie/etc.
jest.mock('../pages/Home/Feed', () => {
  const { View } = require('react-native');
  return ({ item, play }: { item: { id: number }; play: boolean }) => (
    <View testID={`viewer-feed-${item.id}`} play={play} />
  );
});

jest.mock('@expo/vector-icons', () => ({
  AntDesign: () => null,
}));

import VideoViewer from '../pages/VideoViewer';

const videos = [
  { id: 100, user_id: 5, username: 'creator', uri: 'https://example.com/a.mp4' },
  { id: 200, user_id: 5, username: 'creator', uri: 'https://example.com/b.mp4' },
  { id: 300, user_id: 5, username: 'creator', uri: 'https://example.com/c.mp4' },
];

// Regresión: tocar un video publicado en la grilla del perfil no llevaba a
// ningún lado. VideoViewer debe cargar los videos de ese usuario y arrancar
// reproduciendo justo el que se tocó (startIndex), no siempre el primero.
describe('VideoViewer — reproduce el video tocado desde el perfil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { userId: 5, startIndex: 1 };
    mockGetUserVideos.mockResolvedValue(videos);
  });

  it('arranca en el índice del video que se tocó en la grilla', async () => {
    const { findByTestId } = await render(<VideoViewer />);

    const pager = await findByTestId('video-viewer-pager');
    expect(pager.props.initialPage).toBe(1);

    const activeVideo = await findByTestId('viewer-feed-200');
    expect(activeVideo.props.play).toBe(true);

    const inactiveVideo = await findByTestId('viewer-feed-100');
    expect(inactiveVideo.props.play).toBe(false);
  });

  it('pide los videos del usuario dueño del perfil', async () => {
    await render(<VideoViewer />);

    expect(mockGetUserVideos).toHaveBeenCalledWith(5, 'token-123');
  });
});

// Regresión: los resultados de Discover (búsqueda de videos, tab Top) son de
// creadores distintos, así que no se puede usar el modo perfil (pediría los
// videos de un solo userId). VideoViewer también acepta la lista ya armada.
describe('VideoViewer — lista de videos ya armada (búsqueda/top en Discover)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { videos, startIndex: 2 };
  });

  it('usa la lista recibida sin pedir videos por userId', async () => {
    const { findByTestId } = await render(<VideoViewer />);

    await findByTestId('viewer-feed-300');
    expect(mockGetUserVideos).not.toHaveBeenCalled();
  });

  it('arranca en el índice indicado de la lista', async () => {
    const { findByTestId } = await render(<VideoViewer />);

    const pager = await findByTestId('video-viewer-pager');
    expect(pager.props.initialPage).toBe(2);

    const activeVideo = await findByTestId('viewer-feed-300');
    expect(activeVideo.props.play).toBe(true);
  });
});
