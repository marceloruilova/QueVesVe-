import { StatusBar } from 'react-native';
import styled from 'styled-components/native';

export const Container = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const Header = styled.View`
  /* Alto real de la barra de estado (o el notch en iOS) + margen visual, así
     los botones de cerrar/galería/voltear no quedan pegados al borde o
     tapados por el notch/cámara frontal en pantalla completa. */
  margin-top: ${(StatusBar.currentHeight || 44) + 10}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const Button = styled.TouchableOpacity`
  padding: 10px;
`;

export const Row = styled.View`
  flex-direction: row;
`;

export const Description = styled.Text`
  font-size: 15px;
  color: #fff;
  margin-left: 10px;
  font-weight: bold;
`;

export const RecordButton = styled.TouchableOpacity`
  padding: 10px;
  width: 80px;
  height: 80px;
  border-width: 6px;
  border-color: #C42B2F;
  border-radius: 40px;
  align-self: center;
  bottom: 5%;
  position: absolute;
  background-color: #E5363A;
`;
