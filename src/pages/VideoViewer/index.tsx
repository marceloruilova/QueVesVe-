import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';

import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { getUserVideos, FeedItem } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import Feed from '../Home/Feed';

type VideoViewerRouteProp = RouteProp<RootStackParamList, 'VideoViewer'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const VideoViewer: React.FC = () => {
  const { accessToken } = useAuth();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<VideoViewerRouteProp>();
  const isFocused = useIsFocused();
  const { userId, startIndex } = route.params;

  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(startIndex);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      setLoading(true);
      getUserVideos(userId, accessToken)
        .then(setVideos)
        .catch(() => setVideos([]))
        .finally(() => setLoading(false));
    }, [userId, accessToken]),
  );

  let content;
  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  } else if (videos.length === 0) {
    content = (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Este video ya no está disponible.</Text>
      </View>
    );
  } else {
    content = (
      <PagerView
        onPageSelected={e => setActive(e.nativeEvent.position)}
        orientation="vertical"
        style={{ flex: 1 }}
        initialPage={startIndex}
        testID="video-viewer-pager"
      >
        {videos.map((item, index) => (
          <View key={item.id}>
            <Feed
              item={item}
              play={isFocused && index === active}
              mountVideo={Math.abs(index - active) <= 1}
            />
          </View>
        ))}
      </PagerView>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        testID="video-viewer-back"
      >
        <AntDesign name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#aaa', fontSize: 15 },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 12,
    zIndex: 20,
    padding: 10,
  },
});

export default VideoViewer;
