import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Container, LeafImage, AppName, LoadingText } from './styles';

const Splash: React.FC = () => (
  <Container>
    <LeafImage
      source={require('../../assets/leaf.png')}
      resizeMode="contain"
    />
    <AppName>QueVesVe!&</AppName>
    <ActivityIndicator size="small" color="#3D1800" />
    <LoadingText>Cargando...</LoadingText>
  </Container>
);

export default Splash;
