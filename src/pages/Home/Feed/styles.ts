import styled from 'styled-components/native';

export const Container = styled.View`
  background: #fff;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

export const Details = styled.View`
  position: absolute;
  padding: 20px 10px;
  width: 65%;
  flex-direction: column;
  bottom: 0;
  z-index: 10;
`;

export const User = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #fff;
`;

export const UserRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 10px 0;
  gap: 10px;
`;

export const FollowButton = styled.TouchableOpacity.attrs({
  activeOpacity: 0.8,
})<{ following?: boolean }>`
  padding: 4px 12px;
  border-radius: 4px;
  border-width: 1.5px;
  border-color: #fff;
  background-color: ${({ following }: { following?: boolean }) =>
    following ? 'rgba(255,255,255,0.15)' : '#F5A623'};
`;

export const FollowButtonText = styled.Text`
  color: #fff;
  font-size: 13px;
  font-weight: bold;
`;

export const Tags = styled.Text`
  font-size: 16px;
  font-weight: bold;
  line-height: 22px;
  padding: 5px 0;
  color: #fff;
`;
export const MusicBox = styled.View`
  flex-direction: row;
  align-items: center;
`;
export const Music = styled.Text`
  font-size: 15px;
  padding: 5px 5px 5px 15px;
  flex-shrink: 1;
  color: #fff;
`;

export const Actions = styled.View`
  flex-direction: column;
  position: absolute;
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  bottom: 0;
  right: 10px;
  z-index: 10;
`;

export const BoxAction = styled.TouchableOpacity.attrs({
  activeOpacity: 0.8,
})`
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
`;

export const TextAction = styled.Text`
  color: #fff;
  padding: 5px 0;
  text-align: center;
`;
