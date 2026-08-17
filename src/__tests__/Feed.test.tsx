import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockRecordView = jest.fn();
const mockRecordWatch = jest.fn();
const mockToggleLike = jest.fn();
const mockUpdateVideo = jest.fn();
const mockFollowUser = jest.fn();
const mockUnfollowUser = jest.fn();
const mockDeleteVideo = jest.fn();

jest.mock('../services/api', () => ({
  recordView: (...args: unknown[]) => mockRecordView(...args),
  recordWatch: (...args: unknown[]) => mockRecordWatch(...args),
  toggleLike: (...args: unknown[]) => mockToggleLike(...args),
  updateVideo: (...args: unknown[]) => mockUpdateVideo(...args),
  followUser: (...args: unknown[]) => mockFollowUser(...args),
  unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
  deleteVideo: (...args: unknown[]) => mockDeleteVideo(...args),
}));

jest.spyOn(Alert, 'alert');

const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock del reproductor: expone `shouldPlay` como prop legible por los tests
// en vez de intentar simular reproducción real de video, y captura
// `onPlaybackStatusUpdate` para que los tests puedan simular progreso.
let latestStatusHandler: ((status: any) => void) | undefined;
jest.mock('expo-av', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    Video: (props: { testID?: string; shouldPlay?: boolean; onPlaybackStatusUpdate?: (s: any) => void }) => {
      latestStatusHandler = props.onPlaybackStatusUpdate;
      return <View testID={props.testID} shouldPlay={props.shouldPlay} />;
    },
    ResizeMode: { COVER: 'cover' },
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: (props: {
      children?: React.ReactNode;
      testID?: string;
      pointerEvents?: string;
    }) => (
      <View testID={props.testID} pointerEvents={props.pointerEvents}>
        {props.children}
      </View>
    ),
  };
});

jest.mock('lottie-react-native', () => {
  const { View } = require('react-native');
  return (props: { autoPlay?: boolean }) => <View testID="lottie" autoPlay={props.autoPlay} />;
});

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
  AntDesign: () => null,
}));

jest.mock('../pages/Home/Feed/CommentsModal', () => () => null);
jest.mock('../components/ReportModal', () => () => null);

import Feed from '../pages/Home/Feed';

const baseItem = {
  id: 1,
  user_id: 10,
  username: 'tester',
  profile_picture: null,
  tags: '#test',
  music: 'Song',
  likes: 3,
  comments: 1,
  liked_by_user: false,
  is_following: false,
  uri: 'https://example.com/video.mp4',
};

// Regresión: los videos del feed no se pausaban nunca. Faltaba tanto el
// tap-to-pause (tocar el video) como el respeto al prop `play` que ahora
// Home calcula en base al foco de la pantalla (ver Home.test.tsx).
describe('Feed — pausa/reanudación del video', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: null });
  });

  // Regresión: en el dispositivo real el tap-to-pause no funcionaba pese a que
  // este test suite pasaba, porque los overlays de LinearGradient (arriba y
  // abajo, para oscurecer y dar legibilidad al texto) cubren casi toda la
  // pantalla con position:absolute y, al no tener z-index/pointerEvents,
  // quedan por encima del Container del video (que tiene z-index: -1) e
  // interceptan el toque antes de que llegue al Pressable. fireEvent.press
  // apunta directo al testID y no reproduce ese problema de stacking/hit-testing,
  // por eso se verifica explícitamente que los overlays tengan pointerEvents="none".
  it('los overlays decorativos (gradientes) no bloquean el toque sobre el video', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play mountVideo />);

    expect(getByTestId('feed-gradient-top').props.pointerEvents).toBe('none');
    expect(getByTestId('feed-gradient-bottom').props.pointerEvents).toBe('none');
  });

  it('reproduce el video cuando play=true y lo pausa al tocarlo (tap-to-pause)', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play mountVideo />);

    expect(getByTestId('feed-video').props.shouldPlay).toBe(true);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);
  });

  it('vuelve a reproducir el video al tocarlo de nuevo', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play mountVideo />);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(true);
  });

  it('nunca reproduce el video cuando play=false, sin importar el pausado manual', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play={false} mountVideo />);

    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);
  });

  it('al dejar de ser el video activo (scroll/cambio de tab) y volver a serlo, arranca reproduciendo', async () => {
    const { getByTestId, rerender } = await render(<Feed item={baseItem} play mountVideo />);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);

    await rerender(<Feed item={baseItem} play={false} mountVideo />);
    await rerender(<Feed item={baseItem} play mountVideo />);

    expect(getByTestId('feed-video').props.shouldPlay).toBe(true);
  });
});

// Regresión: los videos publicados sin descripción/música no se podían editar
// luego, así que quedaban incompletos para siempre. Sólo quien subió el video
// debe ver la acción "Editar" y poder actualizar descripción/tags/música.
describe('Feed — edición de videos propios', () => {
  const editableItem = { ...baseItem, description: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no muestra el menú de opciones si el video no es del usuario logueado', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 999 } });

    const { queryByTestId } = await render(<Feed item={editableItem} play={false} mountVideo />);

    expect(queryByTestId('feed-options-action')).toBeNull();
  });

  it('muestra el menú de opciones cuando el video es del usuario logueado', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });

    const { getByTestId } = await render(<Feed item={editableItem} play={false} mountVideo />);

    expect(getByTestId('feed-options-action')).toBeTruthy();
  });

  it('permite agregar descripción y música a un video propio publicado sin ellas', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });
    mockUpdateVideo.mockResolvedValue({
      description: 'Nueva descripción',
      tags: '#test',
      music: 'Nueva canción',
    });

    const { getByTestId, getByText } = await render(<Feed item={editableItem} play={false} mountVideo />);

    await fireEvent.press(getByTestId('feed-options-action'));
    await fireEvent.press(getByTestId('feed-options-edit'));
    expect(getByTestId('edit-video-description')).toBeTruthy();

    await fireEvent.changeText(getByTestId('edit-video-description'), 'Nueva descripción');
    await fireEvent.changeText(getByTestId('edit-video-music'), 'Nueva canción');
    await fireEvent.press(getByTestId('edit-video-save'));

    expect(mockUpdateVideo).toHaveBeenCalledWith(
      1,
      { description: 'Nueva descripción', tags: '#test', music: 'Nueva canción' },
      'token-123',
    );
    // El texto de música que se muestra sobre el video debe reflejar el nuevo valor guardado.
    expect(getByText('Nueva canción')).toBeTruthy();
  });
});

// Nuevo: botón de seguir junto al nombre de usuario en el feed, con la misma
// lógica de seguir/dejar de seguir que ya existía en el perfil del usuario.
describe('Feed — botón de seguir junto al perfil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no muestra el botón de seguir en el video propio', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });

    const { queryByTestId } = await render(<Feed item={baseItem} play={false} mountVideo />);

    expect(queryByTestId('feed-follow-button')).toBeNull();
  });

  it('muestra "Seguir" y llama a followUser al presionarlo', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 999 } });
    mockFollowUser.mockResolvedValue({ followers_count: 1 });

    const { getByTestId, getByText } = await render(
      <Feed item={baseItem} play={false} mountVideo />,
    );

    expect(getByText('Seguir')).toBeTruthy();
    await fireEvent.press(getByTestId('feed-follow-button'));

    expect(mockFollowUser).toHaveBeenCalledWith(10, 'token-123');
    expect(getByText('Siguiendo')).toBeTruthy();
  });

  it('muestra "Siguiendo" y llama a unfollowUser al presionarlo cuando ya sigue al usuario', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 999 } });
    mockUnfollowUser.mockResolvedValue({ followers_count: 0 });

    const followingItem = { ...baseItem, is_following: true };
    const { getByTestId, getByText } = await render(
      <Feed item={followingItem} play={false} mountVideo />,
    );

    expect(getByText('Siguiendo')).toBeTruthy();
    await fireEvent.press(getByTestId('feed-follow-button'));

    expect(mockUnfollowUser).toHaveBeenCalledWith(10, 'token-123');
    expect(getByText('Seguir')).toBeTruthy();
  });
});

// Nuevo: menú de tres puntos en videos propios con opción de eliminar.
describe('Feed — menú de opciones y eliminar video propio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no muestra el menú de opciones en videos ajenos', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 999 } });

    const { queryByTestId } = await render(<Feed item={baseItem} play={false} mountVideo />);

    expect(queryByTestId('feed-options-action')).toBeNull();
  });

  it('abre el menú y muestra las opciones Editar y Eliminar en un video propio', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });

    const { getByTestId } = await render(<Feed item={baseItem} play={false} mountVideo />);

    await fireEvent.press(getByTestId('feed-options-action'));

    expect(getByTestId('feed-options-edit')).toBeTruthy();
    expect(getByTestId('feed-options-delete')).toBeTruthy();
  });

  it('pide confirmación y elimina el video al confirmar, notificando a onDeleted', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });
    mockDeleteVideo.mockResolvedValue(undefined);
    const onDeleted = jest.fn();

    const { getByTestId } = await render(
      <Feed item={baseItem} play={false} mountVideo onDeleted={onDeleted} />,
    );

    await fireEvent.press(getByTestId('feed-options-action'));
    await fireEvent.press(getByTestId('feed-options-delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar video',
      expect.any(String),
      expect.any(Array),
    );

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = buttons.find((b: { text: string }) => b.text === 'Eliminar');
    await act(async () => {
      await confirmButton.onPress();
    });

    expect(mockDeleteVideo).toHaveBeenCalledWith(1, 'token-123');
    expect(onDeleted).toHaveBeenCalledWith(1);
  });

  it('no elimina nada si se cancela la confirmación', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });
    const onDeleted = jest.fn();

    const { getByTestId } = await render(
      <Feed item={baseItem} play={false} mountVideo onDeleted={onDeleted} />,
    );

    await fireEvent.press(getByTestId('feed-options-action'));
    await fireEvent.press(getByTestId('feed-options-delete'));

    expect(mockDeleteVideo).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

// Nuevo: registro de watch-time. Alimenta VideoWatch en el backend, base del
// ranking fresco/visto-y-gustó/deslizado-rápido al reciclar contenido.
describe('Feed — registro de watch time', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: null });
    latestStatusHandler = undefined;
  });

  it('registra watch time cuando el video deja de estar activo', async () => {
    const { rerender } = await render(<Feed item={baseItem} play mountVideo />);

    latestStatusHandler?.({
      isLoaded: true,
      positionMillis: 4000,
      durationMillis: 20000,
    });

    await rerender(<Feed item={baseItem} play={false} mountVideo />);

    expect(mockRecordWatch).toHaveBeenCalledWith(1, 4, 20, 'token-123');
  });

  it('registra watch time al desmontarse el componente', async () => {
    const { unmount } = await render(<Feed item={baseItem} play mountVideo />);

    latestStatusHandler?.({
      isLoaded: true,
      positionMillis: 2500,
      durationMillis: 15000,
    });

    await act(async () => {
      unmount();
      await Promise.resolve();
    });

    expect(mockRecordWatch).toHaveBeenCalledWith(1, 2.5, 15, 'token-123');
  });

  it('no registra watch time si nunca hubo progreso de reproducción', async () => {
    const { rerender } = await render(<Feed item={baseItem} play mountVideo />);

    await rerender(<Feed item={baseItem} play={false} mountVideo />);

    expect(mockRecordWatch).not.toHaveBeenCalled();
  });
});
