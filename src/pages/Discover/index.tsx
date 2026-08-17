import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';

import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import {
  searchUsers,
  searchVideos,
  getTopVideos,
  followUser,
  unfollowUser,
  FeedItem,
  UserSearchItem,
} from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

import {
  Container,
  Header,
  Search,
  Input,
  TabBar,
  TabItem,
  TabText,
  EmptyState,
  EmptyText,
  UserCard,
  UserAvatar,
  UserInfo,
  UserName,
  UserMeta,
  FollowButton,
  FollowButtonText,
  VideoCard,
  VideoThumb,
  VideoInfo,
  VideoDesc,
  VideoMeta,
  PlaceholderContainer,
  PlaceholderText,
} from './styles';

const TABS = ['Panas', 'Videos', 'Live', 'Top'];
const SEARCHABLE_TABS = [0, 1];
const SEARCH_PLACEHOLDERS = [
  'Buscá a tus panas...',
  'Buscá videos...',
  'Los vivos estarán disponibles pronto',
  'Mostrando los más vistos',
];

const Discover: React.FC = () => {
  const { accessToken } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [topVideos, setTopVideos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  // styled-components' TextInput typings don't resolve a usable ref type here.
  const inputRef = useRef<{ focus: () => void }>(null);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      getTopVideos(accessToken)
        .then(setTopVideos)
        .catch(() => setTopVideos([]));
    }, [accessToken]),
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setUsers([]);
      setVideos([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(query, activeTab);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeTab]);

  const runSearch = async (q: string, tab: number) => {
    if (!accessToken || !q || q.length < 2) return;
    if (!SEARCHABLE_TABS.includes(tab)) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      if (tab === 0) {
        const res = await searchUsers(q, accessToken);
        if (requestIdRef.current === requestId) setUsers(res);
      } else if (tab === 1) {
        const res = await searchVideos(q, accessToken);
        if (requestIdRef.current === requestId) setVideos(res);
      }
    } catch {
      // silently ignore search errors
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (!SEARCHABLE_TABS.includes(index)) {
      setQuery('');
    }
  };

  const handleFollow = async (userId: number, isFollowing: boolean) => {
    if (!accessToken) return;
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, is_following: !isFollowing } : u)),
    );
    try {
      if (isFollowing) {
        await unfollowUser(userId, accessToken);
      } else {
        await followUser(userId, accessToken);
      }
    } catch {
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, is_following: isFollowing } : u)),
      );
    }
  };

  const renderUserItem = ({ item }: { item: UserSearchItem }) => (
    <UserCard
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      testID="discover-user-card"
    >
      <UserAvatar
        source={
          item.profile_picture
            ? { uri: item.profile_picture }
            : require('../../assets/leaf.png')
        }
      />
      <UserInfo>
        <UserName
          onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        >
          {item.username}
        </UserName>
        <UserMeta>{item.followers_count} seguidores</UserMeta>
      </UserInfo>
      <FollowButton
        following={item.is_following}
        onPress={() => handleFollow(item.id, item.is_following)}
      >
        <FollowButtonText following={item.is_following}>
          {item.is_following ? 'Siguiendo' : 'Seguir'}
        </FollowButtonText>
      </FollowButton>
    </UserCard>
  );

  const renderVideoItem = ({ item, index }: { item: FeedItem; index: number }) => (
    <VideoCard
      onPress={() => navigation.navigate('VideoViewer', { videos: activeVideos, startIndex: index })}
      testID="discover-video-card"
    >
      <VideoThumb
        source={
          item.thumbnail_url
            ? { uri: item.thumbnail_url }
            : require('../../assets/leaf.png')
        }
      />
      <VideoInfo>
        <VideoDesc numberOfLines={2}>
          {item.description || item.tags || 'Sin descripción'}
        </VideoDesc>
        <VideoMeta>{item.username}</VideoMeta>
        {activeTab === 3 && (
          <VideoMeta>#{index + 1} · {item.likes} likes</VideoMeta>
        )}
        {activeTab !== 3 && item.tags ? (
          <VideoMeta>{item.tags}</VideoMeta>
        ) : null}
      </VideoInfo>
    </VideoCard>
  );

  const showEmptyState = !query && SEARCHABLE_TABS.includes(activeTab);
  const activeVideos = activeTab === 3 ? topVideos : videos;

  return (
    <Container>
      <Header>
        <Search onPress={() => inputRef.current?.focus()}>
          <AntDesign
            style={{ paddingRight: 10 }}
            name="search"
            size={18}
            color="#838383"
          />
          <Input
            {...({ ref: inputRef } as object)}
            placeholder={SEARCH_PLACEHOLDERS[activeTab]}
            editable={SEARCHABLE_TABS.includes(activeTab)}
            value={query}
            returnKeyType="search"
            onChangeText={text => setQuery(text)}
          />
          {query.length > 0 && (
            <AntDesign
              name="close"
              size={16}
              color="#838383"
              onPress={() => setQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingLeft: 8 }}
            />
          )}
        </Search>
      </Header>

      <TabBar>
        {TABS.map((label, index) => (
          <TabItem
            key={label}
            active={activeTab === index}
            onPress={() => handleTabChange(index)}
          >
            <TabText active={activeTab === index}>{label}</TabText>
          </TabItem>
        ))}
      </TabBar>

      {loading && (
        <ActivityIndicator style={{ marginTop: 24 }} color="#F5A623" />
      )}

      {!loading && showEmptyState && (
        <EmptyState>
          <AntDesign name="search" size={64} color="#d0d0d0" />
          <EmptyText>{SEARCH_PLACEHOLDERS[activeTab]}</EmptyText>
        </EmptyState>
      )}

      {!loading && activeTab === 0 && query.length >= 2 && (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <PlaceholderContainer>
              <PlaceholderText>No se encontraron usuarios</PlaceholderText>
            </PlaceholderContainer>
          }
        />
      )}

      {!loading && activeTab === 1 && query.length >= 2 && (
        <FlatList
          data={videos}
          keyExtractor={item => String(item.id)}
          renderItem={renderVideoItem}
          ListEmptyComponent={
            <PlaceholderContainer>
              <PlaceholderText>No se encontraron videos</PlaceholderText>
            </PlaceholderContainer>
          }
        />
      )}

      {!loading && activeTab === 2 && (
        <PlaceholderContainer>
          <MaterialCommunityIcons name="broadcast" size={64} color="#d0d0d0" />
          <PlaceholderText>Próximamente{'\n'}No hay transmisiones en vivo</PlaceholderText>
        </PlaceholderContainer>
      )}

      {!loading && activeTab === 3 && (
        <FlatList
          data={activeVideos}
          keyExtractor={item => String(item.id)}
          renderItem={renderVideoItem}
          ListEmptyComponent={
            <PlaceholderContainer>
              <PlaceholderText>Aún no hay videos con visualizaciones</PlaceholderText>
            </PlaceholderContainer>
          }
        />
      )}
    </Container>
  );
};

export default Discover;
