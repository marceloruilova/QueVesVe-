import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';

import { AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import avatar from '../../assets/avatar.png';
import { useAuth } from '../../contexts/AuthContext';
import { getFollowList, UserSearchItem } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

type FollowListRouteProp = RouteProp<RootStackParamList, 'FollowList'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const FollowList: React.FC = () => {
  const { accessToken } = useAuth();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<FollowListRouteProp>();
  const { userId, type, title } = route.params;

  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      setLoading(true);
      getFollowList(userId, type, accessToken)
        .then(setUsers)
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    }, [userId, type, accessToken]),
  );

  const renderItem = ({ item }: { item: UserSearchItem }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Image
        style={styles.avatar}
        source={item.profile_picture ? { uri: item.profile_picture } : avatar}
      />
      <View style={styles.info}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.meta}>{item.followers_count} seguidores</Text>
      </View>
      <AntDesign name="right" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F5A623" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {type === 'followers' ? 'Aún no tenés seguidores.' : 'Todavía no seguís a nadie.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dadada',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#aaa', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  info: { flex: 1, marginLeft: 12 },
  username: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  meta: { fontSize: 12, color: '#8f8f91', marginTop: 2 },
  separator: { height: 0.5, backgroundColor: '#e6e6e6', marginLeft: 76 },
});

export default FollowList;
