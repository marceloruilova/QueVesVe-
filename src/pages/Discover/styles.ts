import { StatusBar } from 'react-native';

import styled from 'styled-components/native';

interface TabProps {
  active: boolean;
}

export const Container = styled.View.attrs({
  paddingTop: StatusBar.currentHeight || 44,
})`
  flex: 1;
  background: #fff;
`;

export const Header = styled.View`
  margin: 10px;
  margin-right: 15px;
  flex-direction: row;
  align-items: center;
`;

export const Search = styled.TouchableOpacity.attrs({
  activeOpacity: 1,
})`
  flex: 1;
  border-radius: 8px;
  border-width: 1px;
  border-color: #d8d8d8;
  align-items: center;
  padding: 12px 15px;
  margin-right: 15px;
  background: #ececec;
  flex-direction: row;
`;

export const Input = styled.TextInput`
  flex: 1;
  font-size: 16px;
  padding: 4px 0;
`;

export const TabBar = styled.View`
  flex-direction: row;
  border-bottom-width: 1px;
  border-bottom-color: #e8e8e8;
`;

export const TabItem = styled.TouchableOpacity<TabProps>`
  flex: 1;
  padding: 10px 0;
  align-items: center;
  border-bottom-width: 2px;
  border-bottom-color: ${(props: TabProps) => (props.active ? '#F5A623' : 'transparent')};
`;

export const TabText = styled.Text<TabProps>`
  font-size: 14px;
  font-weight: ${(props: TabProps) => (props.active ? 'bold' : 'normal')};
  color: ${(props: TabProps) => (props.active ? '#000' : '#888')};
`;

export const EmptyState = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-bottom: 60px;
`;

export const EmptyText = styled.Text`
  margin-top: 16px;
  font-size: 16px;
  color: #aaa;
`;

export const UserCard = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const UserAvatar = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: #e0e0e0;
`;

export const UserInfo = styled.View`
  flex: 1;
  margin-left: 12px;
`;

export const UserName = styled.Text`
  font-size: 15px;
  font-weight: bold;
  color: #000;
`;

export const UserMeta = styled.Text`
  font-size: 13px;
  color: #888;
  margin-top: 2px;
`;

export const FollowButton = styled.TouchableOpacity<{ following: boolean }>`
  padding: 6px 16px;
  border-radius: 4px;
  background: ${(props: { following: boolean }) => (props.following ? '#e0e0e0' : '#F5A623')};
`;

export const FollowButtonText = styled.Text<{ following: boolean }>`
  font-size: 13px;
  font-weight: bold;
  color: ${(props: { following: boolean }) => (props.following ? '#555' : '#fff')};
`;

export const VideoCard = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`;

export const VideoThumb = styled.Image`
  width: 70px;
  height: 100px;
  border-radius: 6px;
  background-color: #e0e0e0;
`;

export const VideoInfo = styled.View`
  flex: 1;
  margin-left: 12px;
`;

export const VideoDesc = styled.Text`
  font-size: 14px;
  color: #000;
  font-weight: 500;
`;

export const VideoMeta = styled.Text`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

export const PlaceholderContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-bottom: 60px;
`;

export const PlaceholderText = styled.Text`
  font-size: 16px;
  color: #aaa;
  margin-top: 12px;
  text-align: center;
  padding: 0 40px;
`;
