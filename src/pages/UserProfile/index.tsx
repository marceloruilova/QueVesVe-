import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';

import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import avatar from '../../assets/avatar.png';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile, getUserVideos, followUser, unfollowUser, FeedItem, User } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = SCREEN_WIDTH / 3 - 1;

const UserProfile: React.FC = () => {
  const { user: me, accessToken } = useAuth();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params;

  const [profile, setProfile] = useState<User | null>(null);
  const [videos, setVideos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const isOwnProfile = me?.id === userId;

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      setLoading(true);
      Promise.all([
        getUserProfile(userId, accessToken),
        getUserVideos(userId, accessToken),
      ])
        .then(([prof, vids]) => {
          setProfile(prof);
          setIsFollowing(prof.is_following);
          setFollowersCount(prof.followers_count);
          setVideos(vids);
        })
        .catch(() => Alert.alert('Error', 'No se pudo cargar el perfil.'))
        .finally(() => setLoading(false));
    }, [userId, accessToken]),
  );

  const handleFollow = async () => {
    if (!accessToken) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await unfollowUser(userId, accessToken);
        setIsFollowing(false);
        setFollowersCount(res.followers_count);
      } else {
        const res = await followUser(userId, accessToken);
        setIsFollowing(true);
        setFollowersCount(res.followers_count);
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el seguimiento.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se encontró el perfil.</Text>
      </View>
    );
  }

  const ProfileHeader = (
    <View style={styles.content}>
      <Image
        style={styles.avatar}
        source={profile.profile_picture ? { uri: profile.profile_picture } : avatar}
      />
      <Text style={styles.username}>@{profile.username}</Text>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statsColumn}>
          <Text style={styles.statsNumber}>{profile.following_count}</Text>
          <Text style={styles.statsLabel}>Siguiendo</Text>
        </View>
        <Text style={styles.separator}>|</Text>
        <View style={styles.statsColumn}>
          <Text style={styles.statsNumber}>{followersCount}</Text>
          <Text style={styles.statsLabel}>Seguidores</Text>
        </View>
        <Text style={styles.separator}>|</Text>
        <View style={styles.statsColumn}>
          <Text style={styles.statsNumber}>{videos.length}</Text>
          <Text style={styles.statsLabel}>Videos</Text>
        </View>
      </View>

      {/* Follow button or Edit profile */}
      {isOwnProfile ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Editar perfil</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? '#000' : '#fff'} />
          ) : (
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Bio */}
      {!!profile.bio && (
        <Text style={styles.bio}>{profile.bio}</Text>
      )}

      {/* Perfil profesional */}
      {!!profile.professional_title && (
        <View style={styles.professionalCard}>
          <View style={styles.professionalHeader}>
            <MaterialIcons name="work" size={18} color="#F5A623" />
            <Text style={styles.professionalTitle}>{profile.professional_title}</Text>
          </View>
          {!!profile.professional_institution && (
            <Text style={styles.professionalInstitution}>{profile.professional_institution}</Text>
          )}
          {profile.senescyt_verified && (
            <View style={styles.verifiedBadge}>
              <AntDesign name="checkcircle" size={14} color="#fff" />
              <Text style={styles.verifiedText}>
                Verificado SENESCYT — {profile.senescyt_verified_name}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con botón volver */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={videos}
        keyExtractor={item => String(item.id)}
        numColumns={3}
        ListHeaderComponent={ProfileHeader}
        columnWrapperStyle={{ gap: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        renderItem={({ item }) => (
          <View style={styles.videoCell}>
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Todavía no subió ningún video</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#888', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dadada',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  username: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  stats: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  statsColumn: { alignItems: 'center', paddingHorizontal: 16 },
  statsNumber: { fontSize: 18, fontWeight: 'bold' },
  statsLabel: { fontSize: 12, color: '#8f8f91' },
  separator: { color: '#000', opacity: 0.1, fontSize: 20 },
  editButton: {
    borderWidth: 1.5,
    borderColor: '#e6e6e6',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 32,
    marginVertical: 8,
  },
  editButtonText: { fontWeight: 'bold', fontSize: 14 },
  followButton: {
    backgroundColor: '#F5A623',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 40,
    marginVertical: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e6e6e6' },
  followButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  followingButtonText: { color: '#000' },
  bio: { fontSize: 14, color: '#444', textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },
  professionalCard: {
    marginTop: 12,
    backgroundColor: '#fdf8f0',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  professionalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  professionalTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginLeft: 6 },
  professionalInstitution: { fontSize: 13, color: '#666', marginTop: 4 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  videoCell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 1.4,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#aaa', fontSize: 14 },
});

export default UserProfile;
