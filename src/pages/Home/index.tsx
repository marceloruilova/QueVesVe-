import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

import PagerView from 'react-native-pager-view';

import { getFeed, FeedItem } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import Feed from './Feed';

import { Container, Header, Text, Tab, Separator } from './styles';

const Home: React.FC = () => {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState(1);
  const [active, setActive] = useState(0);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    getFeed(accessToken)
      .then(setFeedItems)
      .catch(() => setFeedItems([]));
  }, [accessToken]);

  return (
    <Container>
      <Header>
        <Tab onPress={() => setTab(1)}>
          <Text active={tab === 1}>Following</Text>
        </Tab>
        <Separator>|</Separator>
        <Tab onPress={() => setTab(2)}>
          <Text active={tab === 2}>For You</Text>
        </Tab>
      </Header>
      <PagerView
        onPageSelected={e => {
          setActive(e.nativeEvent.position);
        }}
        orientation="vertical"
        style={{ flex: 1 }}
        initialPage={0}
      >
        {feedItems.map(item => (
          <View key={item.id}>
            <Feed item={item} play={Number(item.id) === active} />
          </View>
        ))}
      </PagerView>
    </Container>
  );
};

export default Home;
