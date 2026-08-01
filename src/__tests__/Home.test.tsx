import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockGetFeed = jest.fn();
const mockIsFocused = jest.fn();

jest.mock('../services/api', () => ({
  getFeed: (...args: unknown[]) => mockGetFeed(...args),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-123' }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    // Sustituto simple: corre el callback al montar, como haría la screen al
    // ganar foco por primera vez. El refetch-on-focus real no es lo que este
    // test cubre.
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return cleanup;
      }, []);
    },
    useIsFocused: () => mockIsFocused(),
  };
});

jest.mock('react-native-pager-view', () => {
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

// Mock del ítem de feed: expone el prop `play` calculado por Home para que
// el test pueda verificar la lógica de foco sin renderizar expo-av/lottie/etc.
jest.mock('../pages/Home/Feed', () => {
  const { View } = require('react-native');
  return ({ item, play }: { item: { id: number }; play: boolean }) => (
    <View testID={`feed-${item.id}`} play={play} />
  );
});

import Home from '../pages/Home';

const feedItems = [
  {
    id: 1,
    user_id: 1,
    username: 'user1',
    profile_picture: null,
    description: '',
    tags: '',
    music: '',
    likes: 0,
    comments: 0,
    liked_by_user: false,
    uri: 'https://example.com/a.mp4',
    thumbnail_url: null,
    views_count: 0,
    category: '',
    source_type: 'ugc' as const,
    author_name: 'user1',
  },
];

// Regresión: al cambiar de tab (Discover/Inbox/Me/Record) o abrir cualquier
// pantalla encima, el tab Home seguía montado y el video activo del feed
// seguía reproduciéndose (con audio) en segundo plano, porque `play` sólo
// dependía del índice activo del pager y nunca del foco de la screen.
describe('Home — pausa el video activo al perder el foco (cambio de tab)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeed.mockResolvedValue({ results: feedItems, next: null, count: feedItems.length });
  });

  it('reproduce el video activo mientras la screen Home está enfocada', async () => {
    mockIsFocused.mockReturnValue(true);

    const { findByTestId } = await render(<Home />);
    const video = await findByTestId('feed-1');

    expect(video.props.play).toBe(true);
  });

  it('pausa el video activo cuando la screen Home pierde el foco', async () => {
    mockIsFocused.mockReturnValue(false);

    const { findByTestId } = await render(<Home />);
    const video = await findByTestId('feed-1');

    expect(video.props.play).toBe(false);
  });
});

// El botoncito de "-" permite ocultar los tabs (Siguiendo/Para vos) y las
// categorías (Todo/Naturaleza/Animales/...) para dejar la pantalla limpia,
// volviendo a mostrarlos al tocarlo de nuevo.
describe('Home — botón para ocultar/mostrar tabs y categorías', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeed.mockResolvedValue({ results: feedItems, next: null, count: feedItems.length });
    mockIsFocused.mockReturnValue(true);
  });

  it('muestra los tabs y las categorías por defecto', async () => {
    const { findByTestId, getByText } = await render(<Home />);
    await findByTestId('feed-1');

    expect(getByText('Siguiendo')).toBeTruthy();
    expect(getByText('Para vos')).toBeTruthy();
    expect(getByText('Todo')).toBeTruthy();
  });

  it('oculta los tabs y categorías al tocar el botón, y los vuelve a mostrar al tocarlo de nuevo', async () => {
    const { findByTestId, getByTestId, queryByText } = await render(<Home />);
    await findByTestId('feed-1');

    await fireEvent.press(getByTestId('toggle-ui-button'));

    expect(queryByText('Siguiendo')).toBeNull();
    expect(queryByText('Para vos')).toBeNull();
    expect(queryByText('Todo')).toBeNull();

    await fireEvent.press(getByTestId('toggle-ui-button'));

    expect(queryByText('Siguiendo')).toBeTruthy();
    expect(queryByText('Para vos')).toBeTruthy();
    expect(queryByText('Todo')).toBeTruthy();
  });
});
