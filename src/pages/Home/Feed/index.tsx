import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  Pressable,
  Share,
  ActivityIndicator,
  Modal,
  View,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';

import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { toggleLike, recordView, followUser, unfollowUser, deleteVideo } from '../../../services/api';
import { RootStackParamList } from '../../../types/navigation';
import CommentsModal from './CommentsModal';
import EditVideoModal from './EditVideoModal';
import ReportModal from '../../../components/ReportModal';
import musicFly from '../../../assets/lottie-animations/music-fly.json';

import {
  Container,
  Details,
  Actions,
  User,
  UserRow,
  FollowButton,
  FollowButtonText,
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
  is_following: boolean;
  uri: string | null;
}

interface Props {
  play: boolean;
  mountVideo: boolean;
  item: Item;
  onDeleted?: (videoId: number) => void;
}

const Feed: React.FC<Props> = ({ play, mountVideo, item, onDeleted }) => {
  const { accessToken, user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [liked, setLiked] = useState(item.liked_by_user);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [isFollowing, setIsFollowing] = useState(item.is_following);
  const [followLoading, setFollowLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [description, setDescription] = useState(item.description ?? '');
  const [tags, setTags] = useState(item.tags);
  const [music, setMusic] = useState(item.music);

  const isOwner = !!user && user.id === item.user_id;

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (play && accessToken) {
      recordView(item.id, accessToken);
    }
  }, [play]);

  // Al dejar de ser el video activo (scroll, cambio de tab, etc.) se resetea
  // el pausado manual para que la próxima vez que sea activo arranque reproduciendo.
  useEffect(() => {
    if (!play) {
      setPaused(false);
    }
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
    await Share.share({ message: `Mirá este video en QueVesVe!& https://quevesve.app` });
  };

  const handleFollow = async () => {
    if (!accessToken) return;
    const nextFollowing = !isFollowing;
    setFollowLoading(true);
    try {
      if (nextFollowing) {
        await followUser(item.user_id, accessToken);
      } else {
        await unfollowUser(item.user_id, accessToken);
      }
      setIsFollowing(nextFollowing);
    } catch {
      // sin cambios ante error
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDelete = () => {
    setShowOptions(false);
    Alert.alert(
      'Eliminar video',
      '¿Seguro que querés eliminar este video? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!accessToken) return;
            setDeleting(true);
            try {
              await deleteVideo(item.id, accessToken);
              onDeleted?.(item.id);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el video. Intentá de nuevo.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
        <UserRow>
          <TouchableOpacity
            onPress={() => {
              if (item.user_id) {
                navigation.navigate('UserProfile', { userId: item.user_id });
              }
            }}
          >
            <User>{item.username}</User>
          </TouchableOpacity>
          {!isOwner && (
            <FollowButton
              following={isFollowing}
              onPress={handleFollow}
              disabled={followLoading}
              testID="feed-follow-button"
            >
              {followLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FollowButtonText>{isFollowing ? 'Siguiendo' : 'Seguir'}</FollowButtonText>
              )}
            </FollowButton>
          )}
        </UserRow>
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
        {isOwner && (
          <BoxAction onPress={() => setShowOptions(true)} testID="feed-options-action">
            <FontAwesome
              name="ellipsis-h"
              size={30}
              color="#fff"
            />
            <TextAction>Opciones</TextAction>
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
      {isOwner && (
        <EditVideoModal
          videoId={item.id}
          visible={showEdit}
          initialDescription={description}
          initialTags={tags}
          initialMusic={music}
          onClose={() => setShowEdit(false)}
          onSaved={data => {
            setDescription(data.description);
            setTags(data.tags);
            setMusic(data.music);
          }}
        />
      )}
      {isOwner && (
        <Modal
          visible={showOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOptions(false)}
        >
          <Pressable style={optionsStyles.overlay} onPress={() => setShowOptions(false)}>
            <View style={optionsStyles.sheet}>
              <TouchableOpacity
                style={optionsStyles.option}
                testID="feed-options-edit"
                onPress={() => {
                  setShowOptions(false);
                  setShowEdit(true);
                }}
              >
                <FontAwesome name="pencil" size={20} color="#1a1a1a" />
                <Text style={optionsStyles.optionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={optionsStyles.option}
                testID="feed-options-delete"
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#E5363A" />
                ) : (
                  <FontAwesome name="trash" size={20} color="#E5363A" />
                )}
                <Text style={[optionsStyles.optionText, optionsStyles.deleteText]}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[optionsStyles.option, optionsStyles.cancelOption]}
                onPress={() => setShowOptions(false)}
              >
                <Text style={optionsStyles.optionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

const optionsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  deleteText: {
    color: '#E5363A',
  },
  cancelOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
});

export default Feed;
