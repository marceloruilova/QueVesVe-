import React, { useState, useRef, useEffect } from 'react';
import { Image, Animated, Easing, TouchableOpacity, Pressable, Share } from 'react-native';

import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { toggleLike, toggleSave, recordView, recordShare, recordWatch } from '../../../services/api';
import { RootStackParamList } from '../../../types/navigation';
import CommentsModal from './CommentsModal';
import EditVideoModal from './EditVideoModal';
import ReportModal from '../../../components/ReportModal';
import MoreOptionsModal from '../../../components/MoreOptionsModal';
import musicFly from '../../../assets/lottie-animations/music-fly.json';

import {
  Container,
  Details,
  Actions,
  User,
  Tags,
  Music,
  MusicBox,
  BoxAction,
  TextAction,
} from './styles';

interface Item {
  id: number;
  user_id: number;
  username: string;
  profile_picture: string | null;
  description?: string;
  tags: string;
  music: string;
  likes: number;
  comments: number;
  liked_by_user: boolean;
  saves?: number;
  saved_by_user?: boolean;
  category?: string;
  uri: string | null;
  priority_level?: string | null;
  priority_score?: number | null;
  priority_factors?: string[] | null;
  priority_recommendations?: string[] | null;
}

interface Props {
  play: boolean;
  mountVideo: boolean;
  item: Item;
}

const Feed: React.FC<Props> = ({ play, mountVideo, item }) => {
  const { accessToken, user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [liked, setLiked] = useState(item.liked_by_user);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [saved, setSaved] = useState(!!item.saved_by_user);
  const [savesCount, setSavesCount] = useState(item.saves ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [paused, setPaused] = useState(false);
  const [description, setDescription] = useState(item.description ?? '');
  const [tags, setTags] = useState(item.tags);
  const [music, setMusic] = useState(item.music);

  const isOwner = !!user && user.id === item.user_id;

  const spinValue = useRef(new Animated.Value(0)).current;

  // Tracking de watch-time: posición máxima alcanzada (para completion rate /
  // detectar swipe rápido) y cantidad de loops (isLooping=true -> cada loop
  // completo cuenta como una reproducción repetida, señal de calidad).
  const maxPositionMillisRef = useRef(0);
  const lastPositionMillisRef = useRef(0);
  const loopCountRef = useRef(0);
  const durationMillisRef = useRef<number | null>(null);

  const flushWatch = () => {
    if (!accessToken || maxPositionMillisRef.current <= 0) return;
    const durationSeconds = durationMillisRef.current ? durationMillisRef.current / 1000 : null;
    const watchedSeconds =
      maxPositionMillisRef.current / 1000 + loopCountRef.current * (durationSeconds ?? 0);
    recordWatch(item.id, watchedSeconds, durationSeconds, accessToken);
    maxPositionMillisRef.current = 0;
    lastPositionMillisRef.current = 0;
    loopCountRef.current = 0;
  };

  const handlePlaybackStatusUpdate = (playbackStatus: { isLoaded: boolean; positionMillis?: number; durationMillis?: number }) => {
    if (!playbackStatus.isLoaded || playbackStatus.positionMillis === undefined) return;
    if (playbackStatus.durationMillis) {
      durationMillisRef.current = playbackStatus.durationMillis;
    }
    const position = playbackStatus.positionMillis;
    const duration = durationMillisRef.current ?? Infinity;
    // El video hace loop (isLooping): si la posición cae bruscamente después
    // de estar cerca del final, fue un loop completo, no un seek hacia atrás.
    if (position < lastPositionMillisRef.current - 1000 && lastPositionMillisRef.current > duration * 0.8) {
      loopCountRef.current += 1;
    }
    lastPositionMillisRef.current = position;
    maxPositionMillisRef.current = Math.max(maxPositionMillisRef.current, position);
  };

  useEffect(() => {
    if (play && accessToken) {
      recordView(item.id, accessToken);
    }
  }, [play]);

  // Al dejar de ser el video activo (scroll, cambio de tab, etc.) se resetea
  // el pausado manual para que la próxima vez que sea activo arranque reproduciendo,
  // y se envía la sesión de reproducción acumulada hasta acá.
  useEffect(() => {
    if (!play) {
      setPaused(false);
      flushWatch();
    }
    return () => {
      if (play) flushWatch();
    };
  }, [play]);

  const isPlaying = play && !paused;
  const handleTogglePause = () => setPaused(prev => !prev);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spinValue]);

  const rotateProp = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleShare = async () => {
    const result = await Share.share({ message: `Mirá este video en QueVesVe!& https://quevesve.app` });
    if (result.action === Share.sharedAction && accessToken) {
      recordShare(item.id, accessToken);
    }
  };

  const handleLike = async () => {
    if (!accessToken) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => prev + (nextLiked ? 1 : -1));
    try {
      const res = await toggleLike(item.id, liked, accessToken);
      setLikesCount(res.likes);
      setLiked(res.liked_by_user);
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    const nextSaved = !saved;
    setSaved(nextSaved);
    setSavesCount(prev => prev + (nextSaved ? 1 : -1));
    try {
      const res = await toggleSave(item.id, saved, accessToken);
      setSavesCount(res.saves);
      setSaved(res.saved_by_user);
    } catch {
      setSaved(saved);
      setSavesCount(savesCount);
    }
  };

  return (
    <>
      <LinearGradient
        colors={['rgba(0,0,0,.3)', 'transparent']}
        pointerEvents="none"
        testID="feed-gradient-top"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '70%',
        }}
      />
      <Container>
        {item.uri && mountVideo ? (
          <Pressable
            onPress={handleTogglePause}
            style={{ width: '100%', height: '100%' }}
            testID="feed-video-pressable"
          >
            <Video
              source={{ uri: item.uri }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying}
              isLooping
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              style={{
                width: '100%',
                height: '100%',
              }}
              testID="feed-video"
            />
          </Pressable>
        ) : null}
      </Container>
      <Details>
        <TouchableOpacity
          onPress={() => {
            if (item.user_id) {
              navigation.navigate('UserProfile', { userId: item.user_id });
            }
          }}
        >
          <User>{item.username}</User>
        </TouchableOpacity>
        <Tags>{tags}</Tags>
        <MusicBox>
          <FontAwesome name="music" size={15} color="#f5f5f5" />
          <Music>{music}</Music>
        </MusicBox>
      </Details>
      <Actions>
        <BoxAction onPress={handleLike}>
          <AntDesign
            name="heart"
            size={35}
            color={liked ? '#E5363A' : '#fff'}
          />
          <TextAction>{likesCount}</TextAction>
        </BoxAction>
        <BoxAction onPress={() => setShowComments(true)}>
          <FontAwesome
            name="commenting"
            size={35}
            color="#fff"
          />
          <TextAction>{item.comments}</TextAction>
        </BoxAction>
        <BoxAction onPress={handleSave}>
          <FontAwesome
            name={saved ? 'bookmark' : 'bookmark-o'}
            size={32}
            color={saved ? '#F5A623' : '#fff'}
          />
          <TextAction>{savesCount}</TextAction>
        </BoxAction>
        <BoxAction onPress={handleShare}>
          <FontAwesome
            name="whatsapp"
            size={35}
            color="#06d755"
          />
          <TextAction>Compartir</TextAction>
        </BoxAction>
        <BoxAction onPress={() => setShowReport(true)}>
          <FontAwesome
            name="flag"
            size={28}
            color="#fff"
          />
          <TextAction>Reportar</TextAction>
        </BoxAction>
        {!isOwner && (
          <BoxAction onPress={() => setShowMoreOptions(true)} testID="feed-more-options-action">
            <FontAwesome
              name="ellipsis-h"
              size={30}
              color="#fff"
            />
            <TextAction>Más</TextAction>
          </BoxAction>
        )}
        {isOwner && (
          <BoxAction onPress={() => setShowEdit(true)} testID="feed-edit-action">
            <FontAwesome
              name="pencil"
              size={30}
              color="#fff"
            />
            <TextAction>Editar</TextAction>
          </BoxAction>
        )}
        <BoxAction>
          <Animated.View
            style={{
              borderRadius: 50,
              borderWidth: 12,
              borderColor: '#292929',
              transform: [
                {
                  rotate: isPlaying ? rotateProp : '0deg',
                },
              ],
            }}
          >
            <Image
              style={{
                width: 35,
                height: 35,
                borderRadius: 25,
              }}
              source={
                item.profile_picture
                  ? { uri: item.profile_picture }
                  : require('../../../assets/leaf.png')
              }
            />
          </Animated.View>

          <LottieView
            source={musicFly}
            autoPlay={isPlaying}
            loop
            style={{ width: 150, position: 'absolute', bottom: 0, right: 0 }}
          />
        </BoxAction>
      </Actions>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,.4)']}
        pointerEvents="none"
        testID="feed-gradient-bottom"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '50%',
        }}
      />

      <CommentsModal
        videoId={item.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
      />
      <ReportModal
        videoId={item.id}
        visible={showReport}
        onClose={() => setShowReport(false)}
      />
      <MoreOptionsModal
        videoId={item.id}
        userId={item.user_id}
        username={item.username}
        category={item.category ?? ''}
        visible={showMoreOptions}
        onClose={() => setShowMoreOptions(false)}
      />
      {isOwner && (
        <EditVideoModal
          videoId={item.id}
          visible={showEdit}
          initialDescription={description}
          initialTags={tags}
          initialMusic={music}
          priorityLevel={item.priority_level}
          priorityScore={item.priority_score}
          priorityFactors={item.priority_factors}
          priorityRecommendations={item.priority_recommendations}
          onClose={() => setShowEdit(false)}
          onSaved={data => {
            setDescription(data.description);
            setTags(data.tags);
            setMusic(data.music);
          }}
        />
      )}
    </>
  );
};

export default Feed;
