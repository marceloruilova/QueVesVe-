import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, PanResponder, Text as RNText, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { AntDesign } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { getFeed, FeedItem } from '../../services/api';
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

const Home: React.FC = () => {
  const { accessToken } = useAuth();
  const isFocused = useIsFocused();
  // tab: 1 = Following, 2 = For You
  const [tab, setTab] = useState(2);
  const [active, setActive] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uiVisible, setUiVisible] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const loadingMoreRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      setPage(1);
      getFeed(accessToken, selectedCategory ?? undefined, 1)
        .then(data => {
          setFeedItems(data.results);
          setHasNext(!!data.next);
        })
        .catch(() => {
          setFeedItems([]);
          setHasNext(false);
        });
    }, [accessToken, selectedCategory]),
  );

  // Scroll infinito: el backend nunca "termina" el feed "Para vos" (recicla
  // contenido en vez de cortar en seco, ver videos/views.py), así que acá
  // alcanza con pedir la próxima página cuando el usuario se acerca al final
  // de lo ya cargado en vez de mostrar una pantalla vacía.
  useEffect(() => {
    if (!accessToken || !hasNext || loadingMoreRef.current) return;
    if (feedItems.length === 0 || feedItems.length - active > 3) return;

    loadingMoreRef.current = true;
    const nextPage = page + 1;
    getFeed(accessToken, selectedCategory ?? undefined, nextPage)
      .then(data => {
        setFeedItems(prev => [...prev, ...data.results]);
        setHasNext(!!data.next);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false;
      });
  }, [accessToken, active, feedItems.length, hasNext, page, selectedCategory]);

  const handleCategorySelect = (key: string | null) => {
    setSelectedCategory(key);
    setActive(0);
  };

  // Swipe horizontal sobre el header para cambiar tab
  // setTab y setActive son estables (useState), seguros de capturar en useRef
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -30) { setTab(2); setActive(0); }
        if (g.dx > 30)  { setTab(1); setActive(0); }
      },
    }),
  ).current;

  const forYouFeed = feedItems;
  const followingFeed: FeedItem[] = [];

  const activeFeed = tab === 1 ? followingFeed : forYouFeed;
  const isEmpty = activeFeed.length === 0;

  return (
    <Container>
      <TopBar>
        <SafeAreaView edges={['top']}>
          <HeaderRow>
            {uiVisible && (
              <Header {...panResponder.panHandlers}>
                <Tab onPress={() => { setTab(1); setActive(0); }}>
                  <Text active={tab === 1}>Siguiendo</Text>
                </Tab>
                <Separator>|</Separator>
                <Tab onPress={() => { setTab(2); setActive(0); }}>
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

          {uiVisible && (
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
          onPageSelected={e => setActive(e.nativeEvent.position)}
          orientation="vertical"
          style={{ flex: 1 }}
          initialPage={0}
        >
          {activeFeed.map((item, index) => (
            // El feed "Para vos" recicla contenido cuando se acaba lo fresco
            // (ver videos/views.py), así que el mismo item.id puede repetirse
            // en la lista -- la key tiene que incluir la posición.
            <View key={`${item.id}-${index}`}>
              <Feed
                item={item}
                play={isFocused && index === active}
                mountVideo={Math.abs(index - active) <= 1}
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
