import styled from 'styled-components/native';

interface Props {
  active: boolean;
}

export const Container = styled.View`
  flex: 1;
  background: #000;
`;

export const Separator = styled.Text`
  color: #fff;
  font-size: 15px;
  opacity: 0.2;
`;

export const TopBar = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  align-self: center;
  align-items: center;
  justify-content: center;
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const ToggleButton = styled.TouchableOpacity`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  margin-left: 10px;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.4);
`;
export const Text = styled.Text<Props>`
  color: #fff;
  font-size: ${(props: Props) => (props.active ? '20px' : '18px')};
  padding: 5px;
  font-weight: bold;
  opacity: ${(props: Props) => (props.active ? '1' : '0.5')};
`;

export const Tab = styled.TouchableOpacity.attrs({
  activeOpacity: 1,
})``;

export const Feed = styled.View`
  flex: 1;
  z-index: -1;
  position: absolute;
`;
