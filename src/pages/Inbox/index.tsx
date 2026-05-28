import React, { useCallback, useRef, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, ConversationItem } from '../../services/api';
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

  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getConversations(accessToken);
      setConversations(data);
    } catch {
      // silently ignore polling errors
    }
  }, [accessToken]);

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
        <Feather style={{ position: 'absolute', right: 16, top: 10 }} name="edit" size={22} color="#1a1a1a" />
      </Header>

      {notAdult && (
        <View style={inboxStyles.banner}>
          <AntDesign name="exclamationcircleo" size={18} color="#D4891A" style={{ marginTop: 2 }} />
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
