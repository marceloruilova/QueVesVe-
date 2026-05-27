import React, { useState, useRef, useEffect } from 'react';
import { Image, Animated, Easing, TouchableOpacity } from 'react-native';

import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { toggleLike } from '../../../services/api';
import { RootStackParamList } from '../../../types/navigation';
import CommentsModal from './CommentsModal';
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
  tags: string;
  music: string;
  likes: number;
  comments: number;
  liked_by_user: boolean;
  uri: string | null;
}

interface Props {
  play: boolean;
  item: Item;
}

const Feed: React.FC<Props> = ({ play, item }) => {
  const { accessToken } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [liked, setLiked] = useState(item.liked_by_user);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [showComments, setShowComments] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;

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
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '70%',
        }}
      />
      <Container>
        {item.uri ? (
          <Video
            source={{ uri: item.uri }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.COVER}
            shouldPlay={play}
            isLooping
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : null}
      </Container>
      <Details>
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.user_id })}>
          <User>{item.username}</User>
        </TouchableOpacity>
        <Tags>{item.tags}</Tags>
        <MusicBox>
          <FontAwesome name="music" size={15} color="#f5f5f5" />
          <Music>{item.music}</Music>
        </MusicBox>
      </Details>
      <Actions>
        <BoxAction onPress={handleLike}>
          <AntDesign
            style={{ alignSelf: 'center' }}
            name="heart"
            size={35}
            color={liked ? '#E5363A' : '#fff'}
          />
          <TextAction>{likesCount}</TextAction>
        </BoxAction>
        <BoxAction onPress={() => setShowComments(true)}>
          <FontAwesome
            style={{ alignSelf: 'center' }}
            name="commenting"
            size={35}
            color="#fff"
          />
          <TextAction>{item.comments}</TextAction>
        </BoxAction>
        <BoxAction>
          <FontAwesome
            style={{ alignSelf: 'center' }}
            name="whatsapp"
            size={35}
            color="#06d755"
          />
          <TextAction>Share</TextAction>
        </BoxAction>
        <BoxAction>
          <Animated.View
            style={{
              borderRadius: 50,
              borderWidth: 12,
              borderColor: '#292929',
              transform: [
                {
                  rotate: play ? rotateProp : '0deg',
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
            autoPlay={play}
            loop
            style={{ width: 150, position: 'absolute', bottom: 0, right: 0 }}
          />
        </BoxAction>
      </Actions>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,.4)']}
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
    </>
  );
};

export default Feed;
