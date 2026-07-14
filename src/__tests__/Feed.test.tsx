import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockRecordView = jest.fn();
const mockToggleLike = jest.fn();

jest.mock('../services/api', () => ({
  recordView: (...args: unknown[]) => mockRecordView(...args),
  toggleLike: (...args: unknown[]) => mockToggleLike(...args),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ accessToken: 'token-123' }),
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
  return { LinearGradient: (props: { children?: React.ReactNode }) => <View>{props.children}</View> };
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
