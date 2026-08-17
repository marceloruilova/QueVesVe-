import React, { useState, useCallback, useRef } from 'react';
import {
  View, PanResponder, Text as RNText, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { AntDesign } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { getFeed, getFollowingFeed, FeedItem, FeedPage } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Feed from './Feed';

import { Container, TopBar, HeaderRow, Header, Text, Tab, Separator, ToggleButton } from './styles';

const CATEGORY_PILLS: { key: string | null; label: string }[] = [
  { key: null, label: 'Todo' },
  { key: 'naturaleza', label: 'Naturaleza' },
  { key: 'animales', label: 'Animales' },
  { key: 'comida', label: 'Comida' },
  { key: 'autos', label: 'Autos' },
  { key: 'viajes', label: 'Viajes' },
  { key: 'tecnologia', label: 'Tecnología' },
  { key: 'deporte', label: 'Deporte' },
  { key: 'musica', label: 'Música' },
  { key: 'humor', label: 'Humor' },
  { key: 'educacion', label: 'Educación' },
];

// Cuántos items antes del final del pager se pide la próxima página --
// PagerView no expone onEndReached, así que se dispara desde onPageSelected.
const PREFETCH_THRESHOLD = 3;
// Techo de items acumulados en memoria por feed, para que una sesión de
// scroll muy larga (reciclando contenido indefinidamente) no crezca sin límite.
const MAX_BUFFERED_ITEMS = 500;

interface PaginatedFeedState {
  items: FeedItem[];
  page: number;
  next: string | null;
  loadingMore: boolean;
}

const emptyFeedState: PaginatedFeedState = { items: [], page: 1, next: null, loadingMore: false };

const Home: React.FC = () => {
  const { accessToken } = useAuth();
  const isFocused = useIsFocused();
  // tab: 1 = Following, 2 = For You
  const [tab, setTab] = useState(2);
  const [active, setActive] = useState(0);
  const [forYouState, setForYouState] = useState<PaginatedFeedState>(emptyFeedState);
  const [followingState, setFollowingState] = useState<PaginatedFeedState>(emptyFeedState);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uiVisible, setUiVisible] = useState(true);
  const pagerRef = useRef<PagerView>(null);

  const loadForYouFirstPage = useCallback(() => {
    if (!accessToken) return;
    getFeed(accessToken, selectedCategory ?? undefined, 1)
      .then((data: FeedPage) =>
        setForYouState({ items: data.results, page: 1, next: data.next, loadingMore: false }))
      .catch(() => setForYouState(emptyFeedState));
  }, [accessToken, selectedCategory]);

  const loadFollowingFirstPage = useCallback(() => {
    if (!accessToken) return;
    getFollowingFeed(accessToken, 1)
      .then((data: FeedPage) =>
        setFollowingState({ items: data.results, page: 1, next: data.next, loadingMore: false }))
      .catch(() => setFollowingState(emptyFeedState));
  }, [accessToken]);

  useFocusEffect(loadForYouFirstPage);
  useFocusEffect(loadFollowingFirstPage);

  const loadForYouNextPage = useCallback(() => {
    if (!accessToken) return;
    setForYouState(prev => {
      if (prev.loadingMore || prev.items.length >= MAX_BUFFERED_ITEMS) return prev;
      const nextPage = prev.page + 1;
      getFeed(accessToken, selectedCategory ?? undefined, nextPage)
        .then((data: FeedPage) =>
          setForYouState(cur => ({
            items: [...cur.items, ...data.results],
            page: nextPage,
            next: data.next,
            loadingMore: false,
          })))
        .catch(() => setForYouState(cur => ({ ...cur, loadingMore: false })));
      return { ...prev, loadingMore: true };
    });
  }, [accessToken, selectedCategory]);

  // "Siguiendo" no tiene wraparound en el backend (paginación estándar, no
  // pasa por el ranking de "Para Ti"): una vez agotadas las páginas reales
  // (next === null), se recicla mezclando lo ya cargado para que el usuario
  // pueda seguir deslizando en vez de quedar trabado.
  const loadFollowingNextPage = useCallback(() => {
    if (!accessToken) return;
    setFollowingState(prev => {
      if (prev.loadingMore || prev.items.length >= MAX_BUFFERED_ITEMS) return prev;
      if (prev.next) {
        const nextPage = prev.page + 1;
        getFollowingFeed(accessToken, nextPage)
          .then((data: FeedPage) =>
            setFollowingState(cur => ({
              items: [...cur.items, ...data.results],
              page: nextPage,
              next: data.next,
              loadingMore: false,
            })))
          .catch(() => setFollowingState(cur => ({ ...cur, loadingMore: false })));
        return { ...prev, loadingMore: true };
      }
      if (prev.items.length === 0) return prev;
      const shuffled = [...prev.items].sort(() => Math.random() - 0.5);
      return { ...prev, items: [...prev.items, ...shuffled] };
    });
  }, [accessToken]);

  const handleVideoDeleted = (videoId: number) => {
    setForYouState(prev => ({ ...prev, items: prev.items.filter(v => v.id !== videoId) }));
    setFollowingState(prev => ({ ...prev, items: prev.items.filter(v => v.id !== videoId) }));
  };

  const handleCategorySelect = (key: string | null) => {
    setSelectedCategory(key);
    setActive(0);
    pagerRef.current?.setPageWithoutAnimation(0);
  };

  const handleTabPress = useCallback((target: 1 | 2) => {
    setTab(target);
    setActive(0);
    pagerRef.current?.setPageWithoutAnimation(0);
    if (target === 2) loadForYouFirstPage();
    else loadFollowingFirstPage();
  }, [loadForYouFirstPage, loadFollowingFirstPage]);

  // Swipe horizontal sobre el header para cambiar tab
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -30) handleTabPress(2);
        if (g.dx > 30) handleTabPress(1);
      },
    }),
  ).current;

  const forYouFeed = forYouState.items;
  const followingFeed = followingState.items;

  const activeFeed = tab === 1 ? followingFeed : forYouFeed;
  const isEmpty = activeFeed.length === 0;

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const position = e.nativeEvent.position;
    setActive(position);
    if (activeFeed.length - position <= PREFETCH_THRESHOLD) {
      if (tab === 2) loadForYouNextPage();
      else loadFollowingNextPage();
    }
  };

  return (
    <Container>
      <TopBar>
        <SafeAreaView edges={['top']}>
          <HeaderRow>
            {uiVisible && (
              <Header {...panResponder.panHandlers}>
                <Tab onPress={() => handleTabPress(1)}>
                  <Text active={tab === 1}>Siguiendo</Text>
                </Tab>
                <Separator>|</Separator>
                <Tab onPress={() => handleTabPress(2)}>
                  <Text active={tab === 2}>Para vos</Text>
                </Tab>
              </Header>
            )}
            <ToggleButton
              onPress={() => setUiVisible(prev => !prev)}
              testID="toggle-ui-button"
            >
              <AntDesign name={uiVisible ? 'minus' : 'plus'} size={12} color="#fff" />
            </ToggleButton>
          </HeaderRow>

          {uiVisible && tab === 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={pillStyles.row}
              contentContainerStyle={pillStyles.rowContent}
            >
              {CATEGORY_PILLS.map(pill => (
                <TouchableOpacity
                  key={String(pill.key)}
                  style={[pillStyles.pill, selectedCategory === pill.key && pillStyles.pillActive]}
                  onPress={() => handleCategorySelect(pill.key)}
                >
                  <RNText style={[pillStyles.pillText, selectedCategory === pill.key && pillStyles.pillTextActive]}>
                    {pill.label}
                  </RNText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </TopBar>

      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <RNText style={{ color: '#fff', fontSize: 16, opacity: 0.6 }}>
            {tab === 1
              ? 'Seguí a alguien para ver su contenido'
              : 'No hay videos todavía'}
          </RNText>
        </View>
      ) : (
        <PagerView
          ref={pagerRef}
          onPageSelected={handlePageSelected}
          orientation="vertical"
          style={{ flex: 1 }}
          initialPage={0}
        >
          {activeFeed.map((item, index) => (
            <View key={`${item.id}-${index}`}>
              <Feed
                item={item}
                play={isFocused && index === active}
                mountVideo={Math.abs(index - active) <= 1}
                onDeleted={handleVideoDeleted}
              />
            </View>
          ))}
        </PagerView>
      )}
    </Container>
  );
};

const pillStyles = StyleSheet.create({
  row: {
    maxHeight: 40,
    flexGrow: 0,
    marginTop: 8,
  },
  rowContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  pillActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  pillText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default Home;
