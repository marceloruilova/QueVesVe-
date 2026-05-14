import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StatusBar, Alert } from 'react-native';

import {
  FontAwesome,
  MaterialCommunityIcons,
  AntDesign,
  Ionicons,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import {
  Container,
  RecordButton,
  Header,
  Row,
  Button,
  Description,
} from './styles';

const Record: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation();

  useEffect(() => {
    StatusBar.setHidden(true);
    const requestPermissions = async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted) await requestMicPermission();
    };
    requestPermissions();
  }, []);

  const handleRecordPress = async () => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
      return;
    }

    setIsRecording(true);
    try {
      const result = await cameraRef.current?.recordAsync({ maxDuration: 60 });
      if (result?.uri) {
        StatusBar.setHidden(false);
        navigation.navigate('UploadVideo' as never, { videoUri: result.uri } as never);
      }
    } catch {
      Alert.alert('Error', 'No se pudo grabar el video.');
    } finally {
      setIsRecording(false);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      StatusBar.setHidden(false);
      navigation.navigate('UploadVideo' as never, { videoUri: result.assets[0].uri } as never);
    }
  };

  if (!cameraPermission || !micPermission) return <View />;
  if (!cameraPermission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>Se necesita permiso de cámara</Text>
      </View>
    );
  }

  return (
    <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} mode="video">
      <Container>
        <Header>
          <Button
            onPress={() => {
              if (isRecording) cameraRef.current?.stopRecording();
              StatusBar.setHidden(false);
              navigation.goBack();
            }}
          >
            <AntDesign name="close" size={28} color="#fff" />
          </Button>
          <Button onPress={handlePickFromGallery}>
            <Row>
              <Ionicons name="images-outline" size={20} color="#fff" />
              <Description>Galería</Description>
            </Row>
          </Button>
          <Button
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <MaterialCommunityIcons
              name="rotate-right"
              size={28}
              color="#fff"
            />
          </Button>
        </Header>
        <RecordButton
          onPress={handleRecordPress}
          style={isRecording ? { backgroundColor: '#C42B2F', transform: [{ scale: 1.15 }] } : {}}
        />
        {isRecording && (
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 13 }}>Grabando... presioná para detener</Text>
          </View>
        )}
      </Container>
    </CameraView>
  );
};

export default Record;
