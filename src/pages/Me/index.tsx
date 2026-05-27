import React, { useState, useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  View,
  Text,
  Dimensions,
} from 'react-native';

import { MaterialIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import avatar from '../../assets/avatar.png';
import { useAuth } from '../../contexts/AuthContext';
import { getUserVideos, FeedItem } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

import {
  Container,
  Title,
  Header,
  Avatar,
  Username,
  Content,
  Stats,
  Separator,
  StatsText,
  StatsColumn,
  StatsNumber,
  ProfileColumn,
  ProfileEdit,
  ProfileText,
  Bookmark,
} from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = SCREEN_WIDTH / 3 - 1;

const Me: React.FC = () => {
  const { user, accessToken, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [videos, setVideos] = useState<FeedItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken || !user) return;
      getUserVideos(user.id, accessToken)
        .then(setVideos)
        .catch(() => setVideos([]));
    }, [accessToken, user]),
  );

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const ProfileHeader = (
    <Content>
      <Avatar source={avatar} />
      <Username>@{user?.username ?? ''}</Username>
      <Stats>
        <StatsColumn>
          <StatsNumber>{user?.following_count ?? 0}</StatsNumber>
          <StatsText>Siguiendo</StatsText>
        </StatsColumn>
        <Separator>|</Separator>
        <StatsColumn>
          <StatsNumber>{user?.followers_count ?? 0}</StatsNumber>
          <StatsText>Seguidores</StatsText>
        </StatsColumn>
        <Separator>|</Separator>
        <StatsColumn>
          <StatsNumber>{videos.length}</StatsNumber>
          <StatsText>Videos</StatsText>
        </StatsColumn>
      </Stats>
      <ProfileColumn>
        <ProfileEdit onPress={() => navigation.navigate('EditProfile')}>
          <ProfileText>Edit profile</ProfileText>
        </ProfileEdit>
        <Bookmark name="bookmark" size={24} color="black" />
      </ProfileColumn>
      <StatsText>{user?.bio || 'Tap to add bio'}</StatsText>
    </Content>
  );

  return (
    <Container>
      <Header>
        <AntDesign
          style={{ position: 'absolute', left: 10, top: 10 }}
          name="adduser"
          size={24}
          color="black"
        />
        <Title>{user?.username ?? ''}</Title>
        <MaterialIcons name="arrow-drop-down" size={24} color="black" />
        <TouchableOpacity
          style={{ position: 'absolute', right: 13, top: 12 }}
          onPress={handleLogout}
        >
          <FontAwesome name="ellipsis-v" size={24} color="black" />
        </TouchableOpacity>
      </Header>

      <FlatList
        data={videos}
        keyExtractor={item => String(item.id)}
        numColumns={3}
        ListHeaderComponent={ProfileHeader}
        columnWrapperStyle={{ gap: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE * 1.4,
              backgroundColor: '#1a1a1a',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <FontAwesome name="play" size={24} color="rgba(255,255,255,0.5)" />
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#aaa', fontSize: 14 }}>
              Todavía no subiste ningún video
            </Text>
          </View>
        }
      />
    </Container>
  );
};

export default Me;
