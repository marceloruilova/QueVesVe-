import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text, StyleSheet, StatusBar } from 'react-native';

import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { getUserVideos, getVideo, FeedItem } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import Feed from '../Home/Feed';

type VideoViewerRouteProp = RouteProp<RootStackParamList, 'VideoViewer'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const VideoViewer: React.FC = () => {
  const { accessToken } = useAuth();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<VideoViewerRouteProp>();
  const isFocused = useIsFocused();
  const userId = 'userId' in route.params ? route.params.userId : undefined;
  const initialVideos = 'videos' in route.params ? route.params.videos : undefined;
  const videoId = 'videoId' in route.params ? route.params.videoId : undefined;
  const startIndex = 'startIndex' in route.params ? route.params.startIndex : 0;

  const [videos, setVideos] = useState<FeedItem[]>(initialVideos ?? []);
  const [loading, setLoading] = useState(initialVideos === undefined);
  const [active, setActive] = useState(startIndex);

  useFocusEffect(
    useCallback(() => {
      // Modo perfil: se pasa el userId y acá se piden sus videos. Modo lista
      // (búsqueda de videos, top de vistos, etc.): la lista ya viene armada
      // en los params porque son videos de distintos usuarios, no de uno solo.
      // Modo link compartido: se pasa un único videoId (deep link) y acá se
      // pide ese video puntual, sin importar quién sea el dueño.
      if (videoId !== undefined) {
        setLoading(true);
        getVideo(videoId, accessToken ?? undefined)
          .then(video => setVideos([video]))
          .catch(() => setVideos([]))
          .finally(() => setLoading(false));
        return;
      }
      if (userId === undefined) return;
      if (!accessToken) return;
      setLoading(true);
      getUserVideos(userId, accessToken)
        .then(setVideos)
        .catch(() => setVideos([]))
        .finally(() => setLoading(false));
    }, [userId, videoId, accessToken]),
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
    top: StatusBar.currentHeight || 44,
    left: 12,
    zIndex: 20,
    padding: 10,
  },
});

export default VideoViewer;
