import React from 'react';
import { fireEvent, render, act, waitFor } from '@testing-library/react-native';

const mockGetFeed = jest.fn();
const mockGetFollowingFeed = jest.fn();
const mockIsFocused = jest.fn();

jest.mock('../services/api', () => ({
  getFeed: (...args: unknown[]) => mockGetFeed(...args),
  getFollowingFeed: (...args: unknown[]) => mockGetFollowingFeed(...args),
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

let latestOnPageSelected: ((e: { nativeEvent: { position: number } }) => void) | undefined;
const mockSetPageWithoutAnimation = jest.fn();
jest.mock('react-native-pager-view', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return ReactActual.forwardRef((props: any, ref: any) => {
    latestOnPageSelected = props.onPageSelected;
    ReactActual.useImperativeHandle(ref, () => ({
      setPageWithoutAnimation: mockSetPageWithoutAnimation,
    }));
    return <View>{props.children}</View>;
  });
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

const page = (results: unknown[], next: string | null = null) => ({
  count: results.length,
  next,
  previous: null,
  results,
});

// Regresión: al cambiar de tab (Discover/Inbox/Me/Record) o abrir cualquier
// pantalla encima, el tab Home seguía montado y el video activo del feed
// seguía reproduciéndose (con audio) en segundo plano, porque `play` sólo
// dependía del índice activo del pager y nunca del foco de la screen.
describe('Home — pausa el video activo al perder el foco (cambio de tab)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeed.mockResolvedValue(page(feedItems));
    mockGetFollowingFeed.mockResolvedValue(page([]));
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
    mockGetFeed.mockResolvedValue(page(feedItems));
    mockGetFollowingFeed.mockResolvedValue(page([]));
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

// Regresión: el tab "Siguiendo" siempre mostraba "Seguí a alguien para ver su
// contenido" aunque el usuario ya siguiera gente y esa gente tuviera videos,
// porque el feed de siguiendo estaba hardcodeado como un array vacío en vez
// de pedirse al backend.
describe('Home — tab Siguiendo muestra los videos de las personas seguidas', () => {
  const followingItems = [
    {
      id: 2,
      user_id: 5,
      username: 'amigo',
      profile_picture: null,
      description: '',
      tags: '',
      music: '',
      likes: 0,
      comments: 0,
      liked_by_user: false,
      is_following: true,
      uri: 'https://example.com/b.mp4',
      thumbnail_url: null,
      views_count: 0,
      category: '',
      source_type: 'ugc' as const,
      author_name: 'amigo',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeed.mockResolvedValue(page(feedItems));
    mockGetFollowingFeed.mockResolvedValue(page(followingItems));
    mockIsFocused.mockReturnValue(true);
  });

  it('pide y muestra los videos de las personas seguidas al ir al tab Siguiendo', async () => {
    const { findByTestId, getByText } = await render(<Home />);
    await findByTestId('feed-1');

    await fireEvent.press(getByText('Siguiendo'));

    expect(mockGetFollowingFeed).toHaveBeenCalledWith('token-123', 1);
    await findByTestId('feed-2');
  });
});

// Nuevo: scroll infinito real. PagerView no expone onEndReached, así que
// Home dispara el pedido de la próxima página desde onPageSelected cuando
// la posición actual se acerca al final de la lista cargada.
describe('Home — pide la página siguiente al acercarse al final del feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
    mockGetFollowingFeed.mockResolvedValue(page([]));
  });

  it('pide y agrega la página siguiente cuando el usuario se acerca al final', async () => {
    mockGetFeed.mockResolvedValueOnce(page(feedItems, 'https://api/videos/?page=2'));
    const secondPageItem = { ...feedItems[0], id: 3 };
    mockGetFeed.mockResolvedValueOnce(page([secondPageItem], null));

    const { findByTestId } = await render(<Home />);
    await findByTestId('feed-1');

    await act(async () => {
      latestOnPageSelected?.({ nativeEvent: { position: 0 } });
    });

    await waitFor(() => expect(mockGetFeed).toHaveBeenCalledWith('token-123', undefined, 2));
    await findByTestId('feed-3');
  });
});

// Nuevo: tocar "Para vos" estando ya activo debe refrescar el feed y volver
// al inicio del pager, en vez de no hacer nada (comportamiento anterior).
describe('Home — tocar la pestaña activa refresca el feed y vuelve al inicio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
    mockGetFollowingFeed.mockResolvedValue(page([]));
    mockGetFeed.mockResolvedValue(page(feedItems));
  });

  it('vuelve a pedir la página 1 y resetea el pager a la posición 0', async () => {
    const { findByTestId, getByText } = await render(<Home />);
    await findByTestId('feed-1');

    expect(mockGetFeed).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByText('Para vos'));

    await waitFor(() => expect(mockGetFeed).toHaveBeenCalledTimes(2));
    expect(mockSetPageWithoutAnimation).toHaveBeenCalledWith(0);
  });
});

// Nuevo: cuando el mismo video aparece más de una vez en la lista (wraparound
// del backend, o reciclado client-side de "Siguiendo"), las keys de React
// deben seguir siendo únicas.
describe('Home — soporta videos repetidos en el feed sin romper por keys duplicadas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockIsFocused.mockReturnValue(true);
    mockGetFollowingFeed.mockResolvedValue(page([]));
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renderiza el mismo video dos veces cuando el backend recicla contenido', async () => {
    mockGetFeed.mockResolvedValueOnce(page(feedItems, 'https://api/videos/?page=2'));
    mockGetFeed.mockResolvedValueOnce(page(feedItems, null)); // wraparound: mismo id de nuevo

    const { findByTestId, findAllByTestId } = await render(<Home />);
    await findByTestId('feed-1');

    await act(async () => {
      latestOnPageSelected?.({ nativeEvent: { position: 0 } });
    });

    const repeated = await findAllByTestId('feed-1');
    expect(repeated).toHaveLength(2);

    const keyWarnings = (console.error as jest.Mock).mock.calls.filter(call =>
      String(call[0]).toLowerCase().includes('key'),
    );
    expect(keyWarnings).toHaveLength(0);
  });
});
