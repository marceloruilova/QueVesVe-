import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, ConversationItem } from '../../services/api';
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

type RootStackParams = {
  Conversation: { conversationId: number; otherUsername: string; otherUserId: number };
};

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
  const navigation = useNavigation<StackNavigationProp<RootStackParams>>();
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

  return (
    <Container>
      <Header>
        <Title>Mensajes</Title>
        <Feather style={{ position: 'absolute', right: 16, top: 10 }} name="edit" size={22} color="#1a1a1a" />
      </Header>

      <FlatList
        data={conversations}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyText>No tenés conversaciones aún.</EmptyText>}
      />
    </Container>
  );
};

export default Inbox;
