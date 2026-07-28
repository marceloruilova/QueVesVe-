import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StatusBar, Alert, TouchableOpacity, Linking } from 'react-native';

import {
  FontAwesome,
  MaterialCommunityIcons,
  AntDesign,
  Ionicons,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../../types/navigation';
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
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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
      const result = await cameraRef.current?.recordAsync({
        maxDuration: 180,
        maxFileSize: 150 * 1024 * 1024,
      });
      if (result?.uri) {
        StatusBar.setHidden(false);
        navigation.navigate('UploadVideo', { videoUri: result.uri });
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

    if (result.canceled || !result.assets[0]?.uri) return;

    const { duration } = result.assets[0];
    if (typeof duration === 'number' && duration > 180000) {
      Alert.alert('Video muy largo', 'El video no puede superar los 3 minutos.');
      return;
    }

    StatusBar.setHidden(false);
    navigation.navigate('UploadVideo', { videoUri: result.assets[0].uri });
  };

  if (!cameraPermission || !micPermission) return <View />;
  if (!cameraPermission.granted || !micPermission.granted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 32 }}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#F5A623" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 20, textAlign: 'center' }}>
          Permisos requeridos
        </Text>
        <Text style={{ color: '#aaa', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          QueVesVe necesita acceso a tu cámara y micrófono para grabar videos. Habilitá los permisos en Configuración.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{
            marginTop: 28,
            backgroundColor: '#F5A623',
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Abrir Configuración</Text>
        </TouchableOpacity>
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
