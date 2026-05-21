import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, Dimensions, Text as RNText } from 'react-native';

import PagerView from 'react-native-pager-view';
import { useFocusEffect } from '@react-navigation/native';

import { getFeed, FeedItem } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Feed from './Feed';

import { Container, Header, Text, Tab, Separator } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Home: React.FC = () => {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState(2); // 1=Following, 2=For You; inicia en For You
  const [active, setActive] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const horizontalRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      getFeed(accessToken)
        .then(setFeedItems)
        .catch(() => setFeedItems([]));
    }, [accessToken]),
  );

  const switchTab = (newTab: number) => {
    setTab(newTab);
    horizontalRef.current?.scrollTo({
      x: (newTab - 1) * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleHorizontalScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setTab(pageIndex + 1);
  };

  return (
    <Container>
      <Header>
        <Tab onPress={() => switchTab(1)}>
          <Text active={tab === 1}>Following</Text>
        </Tab>
        <Separator>|</Separator>
        <Tab onPress={() => switchTab(2)}>
          <Text active={tab === 2}>For You</Text>
        </Tab>
      </Header>

      <ScrollView
        ref={horizontalRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentOffset={{ x: SCREEN_WIDTH, y: 0 }}
      >
        {/* Following — vacío hasta que exista sistema de follows */}
        <View
          style={{
            width: SCREEN_WIDTH,
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <RNText style={{ color: '#fff', fontSize: 16, opacity: 0.6 }}>
            Seguí a alguien para ver su contenido
          </RNText>
        </View>

        {/* For You */}
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <PagerView
            onPageSelected={e => setActive(e.nativeEvent.position)}
            orientation="vertical"
            style={{ flex: 1 }}
            initialPage={0}
          >
            {feedItems.map((item, index) => (
              <View key={item.id}>
                <Feed item={item} play={tab === 2 && index === active} />
              </View>
            ))}
          </PagerView>
        </View>
      </ScrollView>
    </Container>
  );
};

export default Home;
