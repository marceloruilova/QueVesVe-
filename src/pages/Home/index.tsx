import React, { useState, useCallback, useRef } from 'react';
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

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      getFeed(accessToken, selectedCategory ?? undefined)
        .then(setFeedItems)
        .catch(() => setFeedItems([]));
    }, [accessToken, selectedCategory]),
  );

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
            <View key={item.id}>
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
