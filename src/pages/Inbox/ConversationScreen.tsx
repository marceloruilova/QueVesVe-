import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getMessages, sendMessage, markConversationRead, ChatBlockedError, MessageItem } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import {
  ChatContainer,
  ChatHeader,
  ChatHeaderTitle,
  BackButton,
  MessageBubble,
  MessageText,
  MessageTime,
  InputRow,
  MessageInput,
  SendButton,
} from './styles';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const OWN_AGE_CODES = ['age_missing', 'underage'];

const ConversationScreen: React.FC = () => {
  const { accessToken, user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Conversation'>>();
  const { conversationId, otherUsername } = route.params;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [blockedReason, setBlockedReason] = useState<{ message: string; code: string } | null>(null);
  const listRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getMessages(conversationId, accessToken);
      setMessages(data);
    } catch {
      // silently ignore polling errors
    }
  }, [accessToken, conversationId]);

  useEffect(() => {
    fetchMessages();
    if (accessToken) markConversationRead(conversationId, accessToken);

    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages, accessToken, conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !accessToken || sending) return;
    setSending(true);
    setInputText('');
    try {
      const newMsg = await sendMessage(conversationId, text, accessToken);
      setBlockedReason(null);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      setInputText(text);
      if (err instanceof ChatBlockedError) {
        setBlockedReason({ message: err.message, code: err.reason });
      } else {
        Alert.alert(
          'Error al enviar',
          err instanceof Error ? err.message : 'No se pudo enviar el mensaje. Intentá de nuevo.',
        );
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: MessageItem }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <MessageBubble isMine={isMine}>
        <MessageText isMine={isMine}>{item.text}</MessageText>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <MessageTime isMine={isMine}>{formatTime(item.created_at)}</MessageTime>
          {isMine && (
            <Feather
              name={item.is_read ? 'check-circle' : 'check'}
              size={11}
              color="rgba(255,255,255,0.65)"
            />
          )}
        </View>
        {isMine && item.is_read && (
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', textAlign: 'right' }}>
            Visto
          </Text>
        )}
      </MessageBubble>
    );
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <BackButton onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#1a1a1a" />
        </BackButton>
        <ChatHeaderTitle>{otherUsername}</ChatHeaderTitle>
      </ChatHeader>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        {blockedReason ? (
          <View style={blockedStyles.banner}>
            <AntDesign name="lock" size={18} color="#E5363A" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={blockedStyles.bannerTitle}>Chat no disponible</Text>
              <Text style={blockedStyles.bannerMessage}>{blockedReason.message}</Text>
              {OWN_AGE_CODES.includes(blockedReason.code) && (
                <TouchableOpacity
                  style={blockedStyles.bannerButton}
                  onPress={() => (navigation as any).navigate('EditProfile')}
                >
                  <Text style={blockedStyles.bannerButtonText}>Actualizar mi perfil →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <InputRow>
            <MessageInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribí un mensaje..."
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <SendButton disabled={!inputText.trim() || sending} onPress={handleSend}>
              <Feather name="send" size={18} color="#fff" />
            </SendButton>
          </InputRow>
        )}
      </KeyboardAvoidingView>
    </ChatContainer>
  );
};

const blockedStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff0f0',
    borderTopWidth: 1,
    borderTopColor: '#E5363A',
    padding: 14,
  },
  bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#E5363A', marginBottom: 4 },
  bannerMessage: { fontSize: 13, color: '#555', lineHeight: 18 },
  bannerButton: {
    marginTop: 10,
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bannerButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default ConversationScreen;
