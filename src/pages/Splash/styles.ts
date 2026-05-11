import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  background-color: #f5a623;
  align-items: center;
  justify-content: center;
`;

export const LeafImage = styled.Image`
  width: 240px;
  height: 280px;
  margin-bottom: 20px;
`;

export const AppName = styled.Text`
  font-size: 32px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  margin-bottom: 28px;
`;

export const LoadingText = styled.Text`
  font-size: 12px;
  color: #3d1800;
  opacity: 0.6;
  margin-top: 6px;
`;
