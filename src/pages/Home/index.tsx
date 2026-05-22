import React, { useState, useCallback, useRef } from 'react';
import { View, PanResponder, Text as RNText } from 'react-native';

import PagerView from 'react-native-pager-view';
import { useFocusEffect } from '@react-navigation/native';

import { getFeed, FeedItem } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Feed from './Feed';

import { Container, Header, Text, Tab, Separator } from './styles';

const Home: React.FC = () => {
  const { accessToken } = useAuth();
  // tab: 1 = Following, 2 = For You
  const [tab, setTab] = useState(2);
  const [active, setActive] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      getFeed(accessToken)
        .then(setFeedItems)
        .catch(() => setFeedItems([]));
    }, [accessToken]),
  );

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
      <Header {...panResponder.panHandlers}>
        <Tab onPress={() => { setTab(1); setActive(0); }}>
          <Text active={tab === 1}>Following</Text>
        </Tab>
        <Separator>|</Separator>
        <Tab onPress={() => { setTab(2); setActive(0); }}>
          <Text active={tab === 2}>For You</Text>
        </Tab>
      </Header>

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
              <Feed item={item} play={index === active} />
            </View>
          ))}
        </PagerView>
      )}
    </Container>
  );
};

export default Home;
