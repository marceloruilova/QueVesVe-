import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  background-color: #fff;
  justify-content: center;
  padding: 32px 24px;
`;

export const Logo = styled.Text`
  font-size: 40px;
  font-weight: 900;
  text-align: center;
  color: #F5A623;
  letter-spacing: -1px;
  margin-bottom: 8px;
`;

export const Subtitle = styled.Text`
  font-size: 14px;
  color: #8f8f91;
  text-align: center;
  margin-bottom: 40px;
`;

export const Input = styled.TextInput`
  border-width: 1px;
  border-color: #e6e6e6;
  border-radius: 4px;
  padding: 14px 16px;
  font-size: 15px;
  margin-bottom: 16px;
  background-color: #fafafa;
`;

export const Button = styled.TouchableOpacity`
  background-color: #F5A623;
  border-radius: 4px;
  padding: 14px;
  align-items: center;
  margin-top: 8px;
`;

export const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`;

export const Footer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 24px;
`;

export const FooterText = styled.Text`
  color: #8f8f91;
  font-size: 14px;
`;

export const FooterLink = styled.Text`
  color: #F5A623;
  font-size: 14px;
  font-weight: bold;
`;

export const ErrorText = styled.Text`
  color: #F5A623;
  font-size: 13px;
  text-align: center;
  margin-bottom: 12px;
`;

export const Divider = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 20px 0 16px;
`;

export const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: #e6e6e6;
`;

export const DividerText = styled.Text`
  color: #8f8f91;
  font-size: 13px;
  padding: 0 12px;
`;

export const SocialButtonsRow = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const SocialButton = styled.TouchableOpacity<{ bgColor: string; borderColor?: string }>`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${({ bgColor }) => bgColor};
  border-width: ${({ borderColor }) => (borderColor ? '1px' : '0px')};
  border-color: ${({ borderColor }) => borderColor ?? 'transparent'};
  border-radius: 4px;
  padding: 13px 8px;
  gap: 6px;
`;

export const SocialButtonText = styled.Text<{ textColor: string }>`
  color: ${({ textColor }) => textColor};
  font-size: 14px;
  font-weight: 600;
`;
