import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList, View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  getConversations, ConversationItem,
  searchUsers, createOrGetConversation, UserSearchItem, ChatBlockedError,
} from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import {
  Container,
  Header,
  Title,
  EmptyText,
  ConversationRow,
  Avatar,
  AvatarPlaceholder,
  AvatarInitial,
  ConversationInfo,
  ConversationUsername,
  LastMessageText,
  ConversationMeta,
  TimeText,
  UnreadBadge,
  UnreadBadgeText,
} from './styles';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

const Inbox: React.FC = () => {
  const { accessToken, user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newChatLoadingId, setNewChatLoadingId] = useState<number | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getConversations(accessToken);
      setConversations(data);
    } catch {
      // silently ignore polling errors
    }
  }, [accessToken]);

  useEffect(() => {
    if (!showNewChat || !accessToken) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchUsers(searchQuery, accessToken);
        setSearchResults(results);
      } catch {
        // ignore search errors
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, showNewChat, accessToken]);

  const closeNewChat = () => {
    setShowNewChat(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleNewChatSelect = async (targetUser: UserSearchItem) => {
    if (!accessToken || newChatLoadingId !== null) return;
    setNewChatLoadingId(targetUser.id);
    try {
      const conversation = await createOrGetConversation(targetUser.id, accessToken);
      closeNewChat();
      navigation.navigate('Conversation', {
        conversationId: conversation.id,
        otherUsername: targetUser.username,
        otherUserId: targetUser.id,
      });
    } catch (err) {
      if (err instanceof ChatBlockedError) {
        Alert.alert('Chat no disponible', err.message);
      } else {
        Alert.alert('Error', 'No se pudo abrir la conversación. Intentá de nuevo.');
      }
    } finally {
      setNewChatLoadingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      pollingRef.current = setInterval(fetchConversations, 5000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [fetchConversations]),
  );

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const other = item.other_participant;
    if (!other) return null;
    const hasUnread = item.unread_count > 0;

    return (
      <ConversationRow
        onPress={() =>
          navigation.navigate('Conversation', {
            conversationId: item.id,
            otherUsername: other.username,
            otherUserId: other.id,
          })
        }
      >
        {other.profile_picture ? (
          <Avatar source={{ uri: other.profile_picture }} />
        ) : (
          <AvatarPlaceholder>
            <AvatarInitial>{other.username[0].toUpperCase()}</AvatarInitial>
          </AvatarPlaceholder>
        )}

        <ConversationInfo>
          <ConversationUsername>{other.username}</ConversationUsername>
          <LastMessageText unread={hasUnread} numberOfLines={1}>
            {item.last_message
              ? (item.last_message.sender_id === user?.id ? 'Vos: ' : '') + item.last_message.text
              : 'Sin mensajes'}
          </LastMessageText>
        </ConversationInfo>

        <ConversationMeta>
          {item.last_message && <TimeText>{formatTime(item.last_message.created_at)}</TimeText>}
          {hasUnread && (
            <UnreadBadge>
              <UnreadBadgeText>{item.unread_count > 99 ? '99+' : item.unread_count}</UnreadBadgeText>
            </UnreadBadge>
          )}
        </ConversationMeta>
      </ConversationRow>
    );
  };

  const notAdult = !user?.is_adult;

  return (
    <Container>
      <Header>
        <Title>Mensajes</Title>
        <TouchableOpacity
          style={{ position: 'absolute', right: 16, top: 10, padding: 4 }}
          onPress={() => setShowNewChat(true)}
        >
          <Feather name="edit" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </Header>

      <Modal visible={showNewChat} animationType="slide" onRequestClose={closeNewChat}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={newChatStyles.header}>
            <TouchableOpacity onPress={closeNewChat} style={{ padding: 4 }}>
              <Feather name="x" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text style={newChatStyles.title}>Nuevo mensaje</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={newChatStyles.searchRow}>
            <Feather name="search" size={16} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput
              style={newChatStyles.searchInput}
              placeholder="Buscar usuario..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={16} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>

          {searchLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color="#F5A623" />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={newChatStyles.userRow}
                  onPress={() => handleNewChatSelect(item)}
                  disabled={newChatLoadingId !== null}
                >
                  {item.profile_picture ? (
                    <Image source={{ uri: item.profile_picture }} style={newChatStyles.avatar} />
                  ) : (
                    <View style={[newChatStyles.avatar, newChatStyles.avatarPlaceholder]}>
                      <Text style={newChatStyles.avatarInitial}>{item.username[0].toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={newChatStyles.username}>{item.username}</Text>
                  {newChatLoadingId === item.id ? (
                    <ActivityIndicator size="small" color="#F5A623" />
                  ) : (
                    <Feather name="chevron-right" size={18} color="#ccc" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.trim() ? (
                  <Text style={newChatStyles.empty}>No se encontraron usuarios.</Text>
                ) : (
                  <Text style={newChatStyles.empty}>Escribí un nombre para buscar.</Text>
                )
              }
            />
          )}
        </SafeAreaView>
      </Modal>

      {notAdult && (
        <View style={inboxStyles.banner}>
          <AntDesign name="warning" size={18} color="#D4891A" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={inboxStyles.bannerTitle}>Para usar el chat necesitás:</Text>
            <Text style={inboxStyles.bannerItem}>• Agregar tu fecha de nacimiento en tu perfil</Text>
            <Text style={inboxStyles.bannerItem}>• Tener 18 años o más</Text>
            <Text style={inboxStyles.bannerItem}>• Seguir mutuamente a tus contactos</Text>
            <TouchableOpacity
              style={inboxStyles.bannerButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={inboxStyles.bannerButtonText}>Actualizar mi perfil →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyText>No tenés conversaciones aún.</EmptyText>}
      />
    </Container>
  );
};

const newChatStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dadada',
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarInitial: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  username: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 14 },
});

const inboxStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff8ee',
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
    margin: 12,
    borderRadius: 8,
    padding: 12,
  },
  bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  bannerItem: { fontSize: 13, color: '#555', lineHeight: 20 },
  bannerButton: {
    marginTop: 10,
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bannerButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default Inbox;
