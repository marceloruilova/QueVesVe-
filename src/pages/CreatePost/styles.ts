import { StatusBar } from 'react-native';
import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  background-color: #000;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-top: ${(StatusBar.currentHeight || 44) + 6}px;
  padding-horizontal: 16px;
  padding-bottom: 12px;
`;

export const CloseButton = styled.TouchableOpacity`
  padding: 10px;
`;

export const HeaderTitle = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`;

export const OptionsContainer = styled.View`
  flex: 1;
  flex-direction: row;
  padding: 16px;
  gap: 16px;
`;

export const OptionCard = styled.TouchableOpacity`
  flex: 1;
  background-color: #1a1a1a;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const OptionLabel = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-top: 16px;
`;

export const OptionHint = styled.Text`
  color: #8f8f91;
  font-size: 13px;
  margin-top: 6px;
  text-align: center;
`;
