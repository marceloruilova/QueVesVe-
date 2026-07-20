import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockRecordView = jest.fn();
const mockToggleLike = jest.fn();
const mockUpdateVideo = jest.fn();

jest.mock('../services/api', () => ({
  recordView: (...args: unknown[]) => mockRecordView(...args),
  toggleLike: (...args: unknown[]) => mockToggleLike(...args),
  updateVideo: (...args: unknown[]) => mockUpdateVideo(...args),
}));

const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock del reproductor: expone `shouldPlay` como prop legible por los tests
// en vez de intentar simular reproducción real de video.
jest.mock('expo-av', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    Video: (props: { testID?: string; shouldPlay?: boolean }) => (
      <View testID={props.testID} shouldPlay={props.shouldPlay} />
    ),
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
    const { getByTestId } = await render(<Feed item={baseItem} play />);

    expect(getByTestId('feed-gradient-top').props.pointerEvents).toBe('none');
    expect(getByTestId('feed-gradient-bottom').props.pointerEvents).toBe('none');
  });

  it('reproduce el video cuando play=true y lo pausa al tocarlo (tap-to-pause)', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play />);

    expect(getByTestId('feed-video').props.shouldPlay).toBe(true);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);
  });

  it('vuelve a reproducir el video al tocarlo de nuevo', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play />);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(true);
  });

  it('nunca reproduce el video cuando play=false, sin importar el pausado manual', async () => {
    const { getByTestId } = await render(<Feed item={baseItem} play={false} />);

    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);
  });

  it('al dejar de ser el video activo (scroll/cambio de tab) y volver a serlo, arranca reproduciendo', async () => {
    const { getByTestId, rerender } = await render(<Feed item={baseItem} play />);

    await fireEvent.press(getByTestId('feed-video-pressable'));
    expect(getByTestId('feed-video').props.shouldPlay).toBe(false);

    await rerender(<Feed item={baseItem} play={false} />);
    await rerender(<Feed item={baseItem} play />);

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

  it('no muestra la acción de editar si el video no es del usuario logueado', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 999 } });

    const { queryByTestId } = await render(<Feed item={editableItem} play={false} />);

    expect(queryByTestId('feed-edit-action')).toBeNull();
  });

  it('muestra la acción de editar cuando el video es del usuario logueado', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });

    const { getByTestId } = await render(<Feed item={editableItem} play={false} />);

    expect(getByTestId('feed-edit-action')).toBeTruthy();
  });

  it('permite agregar descripción y música a un video propio publicado sin ellas', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'token-123', user: { id: 10 } });
    mockUpdateVideo.mockResolvedValue({
      description: 'Nueva descripción',
      tags: '#test',
      music: 'Nueva canción',
    });

    const { getByTestId, getByText } = await render(<Feed item={editableItem} play={false} />);

    await fireEvent.press(getByTestId('feed-edit-action'));
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
