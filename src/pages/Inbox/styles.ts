import { StatusBar } from 'react-native';
import styled from 'styled-components/native';

export const Container = styled.View`
  padding-top: ${StatusBar.currentHeight || 44}px;
  flex: 1;
  background: #fff;
`;

export const Header = styled.View`
  padding: 10px 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-bottom-width: 0.5px;
  border-bottom-color: #dadada;
`;

export const Title = styled.Text`
  font-size: 18px;
  font-weight: bold;
`;

export const EmptyText = styled.Text`
  text-align: center;
  color: #888;
  margin-top: 40px;
  font-size: 14px;
`;

export const ConversationRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-bottom-width: 0.5px;
  border-bottom-color: #f0f0f0;
`;

export const Avatar = styled.Image`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #e0e0e0;
`;

export const AvatarPlaceholder = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #e0e0e0;
  align-items: center;
  justify-content: center;
`;

export const AvatarInitial = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #666;
`;

export const ConversationInfo = styled.View`
  flex: 1;
  margin-left: 12px;
`;

export const ConversationUsername = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
`;

export const LastMessageText = styled.Text<{ unread: boolean }>`
  font-size: 13px;
  color: ${({ unread }) => (unread ? '#1a1a1a' : '#888')};
  font-weight: ${({ unread }) => (unread ? '600' : 'normal')};
  margin-top: 2px;
`;

export const ConversationMeta = styled.View`
  align-items: flex-end;
`;

export const TimeText = styled.Text`
  font-size: 11px;
  color: #aaa;
`;

export const UnreadBadge = styled.View`
  background-color: #f97316;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  padding-horizontal: 4px;
`;

export const UnreadBadgeText = styled.Text`
  color: #fff;
  font-size: 11px;
  font-weight: bold;
`;

// ── Conversation Screen ──────────────────────────────────────────────────────

export const ChatContainer = styled.View`
  flex: 1;
  background: #fff;
`;

export const ChatHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px 16px;
  padding-top: ${StatusBar.currentHeight || 44}px;
  border-bottom-width: 0.5px;
  border-bottom-color: #dadada;
  background: #fff;
`;

export const ChatHeaderTitle = styled.Text`
  font-size: 17px;
  font-weight: 600;
  margin-left: 12px;
`;

export const BackButton = styled.TouchableOpacity`
  padding: 4px;
`;

export const MessageBubble = styled.View<{ isMine: boolean }>`
  max-width: 72%;
  padding: 10px 14px;
  border-radius: 18px;
  margin: 4px 16px;
  align-self: ${({ isMine }) => (isMine ? 'flex-end' : 'flex-start')};
  background-color: ${({ isMine }) => (isMine ? '#f97316' : '#f0f0f0')};
`;

export const MessageText = styled.Text<{ isMine: boolean }>`
  font-size: 14px;
  color: ${({ isMine }) => (isMine ? '#fff' : '#1a1a1a')};
`;

export const MessageTime = styled.Text<{ isMine: boolean }>`
  font-size: 10px;
  color: ${({ isMine }) => (isMine ? 'rgba(255,255,255,0.7)' : '#aaa')};
  margin-top: 2px;
  text-align: right;
`;

export const InputRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  border-top-width: 0.5px;
  border-top-color: #dadada;
  background: #fff;
`;

export const MessageInput = styled.TextInput`
  flex: 1;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  max-height: 100px;
`;

export const SendButton = styled.TouchableOpacity<{ disabled: boolean }>`
  margin-left: 8px;
  background-color: ${({ disabled }) => (disabled ? '#ccc' : '#f97316')};
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
`;
