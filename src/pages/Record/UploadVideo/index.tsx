import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { Video, ResizeMode } from 'expo-av';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { uploadVideo } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

type UploadVideoRouteParams = {
  UploadVideo: { videoUri: string };
};

const UploadVideo: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UploadVideoRouteParams, 'UploadVideo'>>();
  const { accessToken } = useAuth();
  const { videoUri } = route.params;

  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [music, setMusic] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!accessToken) return;
    setUploading(true);
    try {
      await uploadVideo(videoUri, description, tags, music, accessToken);
      navigation.navigate('Main' as never);
    } catch {
      Alert.alert('Error', 'No se pudo subir el video. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo video</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.previewContainer}>
        <Video
          source={{ uri: videoUri }}
          style={styles.preview}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted
          shouldPlay
        />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.input}
          placeholder="Contá de qué se trata..."
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
        />

        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          placeholder="#tag1 #tag2"
          placeholderTextColor="#888"
          value={tags}
          onChangeText={setTags}
          maxLength={500}
        />

        <Text style={styles.label}>Música</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la canción"
          placeholderTextColor="#888"
          value={music}
          onChangeText={setMusic}
          maxLength={200}
        />

        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    height: 280,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  label: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  uploadButton: {
    backgroundColor: '#E5363A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadVideo;
