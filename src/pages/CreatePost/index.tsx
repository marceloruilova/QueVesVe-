import React from 'react';
import { Alert, StatusBar } from 'react-native';

import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../../types/navigation';

import {
  Container,
  Header,
  CloseButton,
  HeaderTitle,
  OptionsContainer,
  OptionCard,
  OptionLabel,
  OptionHint,
} from './styles';

const MAX_VIDEOS = 5;
const MAX_DURATION_MS = 180000;

const CreatePost: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleOpenCamera = () => {
    navigation.replace('Record');
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'QueVesVe necesita acceso a tu galería para elegir videos. Habilitá el permiso en Configuración.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      selectionLimit: MAX_VIDEOS,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) return;

    const assets = result.assets.slice(0, MAX_VIDEOS);
    const validUris = assets
      .filter(
        asset =>
          typeof asset.duration !== 'number' ||
          asset.duration <= MAX_DURATION_MS,
      )
      .map(asset => asset.uri);
    const excludedCount = assets.length - validUris.length;

    if (validUris.length === 0) {
      Alert.alert(
        'Videos muy largos',
        'Ningún video puede superar los 3 minutos.',
      );
      return;
    }

    if (excludedCount > 0) {
      Alert.alert(
        'Algunos videos quedaron afuera',
        `${excludedCount} video(s) superaban los 3 minutos y no se incluyeron.`,
      );
    }

    StatusBar.setHidden(false);
    navigation.navigate('UploadMultipleVideos', { videoUris: validUris });
  };

  return (
    <Container>
      <Header>
        <CloseButton onPress={() => navigation.goBack()}>
          <AntDesign name="close" size={24} color="#fff" />
        </CloseButton>
        <HeaderTitle>Nueva publicación</HeaderTitle>
        <CloseButton style={{ opacity: 0 }}>
          <AntDesign name="close" size={24} color="#fff" />
        </CloseButton>
      </Header>

      <OptionsContainer>
        <OptionCard onPress={handleOpenCamera} testID="create-post-camera">
          <MaterialCommunityIcons name="camera" size={40} color="#F5A623" />
          <OptionLabel>Cámara</OptionLabel>
          <OptionHint>Grabá un video nuevo</OptionHint>
        </OptionCard>
        <OptionCard onPress={handlePickFromGallery} testID="create-post-vault">
          <MaterialCommunityIcons
            name="treasure-chest"
            size={40}
            color="#F5A623"
          />
          <OptionLabel>Baúl</OptionLabel>
          <OptionHint>Subí hasta {MAX_VIDEOS} videos guardados</OptionHint>
        </OptionCard>
      </OptionsContainer>
    </Container>
  );
};

export default CreatePost;
