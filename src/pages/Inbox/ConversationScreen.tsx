import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
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

const ConversationScreen: React.FC = () => {
  const { accessToken, user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Conversation'>>();
  const { conversationId, otherUsername } = route.params;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
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
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      setInputText(text);
      if (err instanceof ChatBlockedError) {
        Alert.alert('Chat no disponible', err.message);
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
        <MessageTime isMine={isMine}>{formatTime(item.created_at)}</MessageTime>
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
      </KeyboardAvoidingView>
    </ChatContainer>
  );
};

export default ConversationScreen;
