import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

import { AntDesign } from '@expo/vector-icons';

import { useAuth } from '../../../contexts/AuthContext';
import { updateVideo } from '../../../services/api';

interface Props {
  videoId: number;
  visible: boolean;
  initialDescription: string;
  initialTags: string;
  initialMusic: string;
  priorityLevel?: string | null;
  priorityScore?: number | null;
  priorityFactors?: string[] | null;
  priorityRecommendations?: string[] | null;
  onClose: () => void;
  onSaved: (data: { description: string; tags: string; music: string }) => void;
}

const EditVideoModal: React.FC<Props> = ({
  videoId,
  visible,
  initialDescription,
  initialTags,
  initialMusic,
  priorityLevel,
  priorityScore,
  priorityFactors,
  priorityRecommendations,
  onClose,
  onSaved,
}) => {
  const { accessToken } = useAuth();
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState(initialTags);
  const [music, setMusic] = useState(initialMusic);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDescription(initialDescription);
      setTags(initialTags);
      setMusic(initialMusic);
    }
  }, [visible, initialDescription, initialTags, initialMusic]);

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await updateVideo(videoId, { description, tags, music }, accessToken);
      onSaved({
        description: updated.description ?? description,
        tags: updated.tags ?? tags,
        music: updated.music ?? music,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar los cambios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Editar video</Text>
            <TouchableOpacity onPress={onClose} testID="edit-video-close">
              <AntDesign name="close" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {priorityLevel && (
              <View style={styles.priorityBox}>
                <Text style={styles.priorityTitle}>
                  Prioridad en el feed: {priorityLevel}
                  {typeof priorityScore === 'number' ? ` (${priorityScore}/100)` : ''}
                </Text>
                {!!priorityFactors?.length && (
                  <Text style={styles.priorityText}>
                    Lo que más pesó: {priorityFactors.join(', ')}
                  </Text>
                )}
                {!!priorityRecommendations?.length && (
                  <>
                    <Text style={styles.priorityLabel}>Para mejorar tu visibilidad:</Text>
                    {priorityRecommendations.map(tip => (
                      <Text key={tip} style={styles.priorityText}>• {tip}</Text>
                    ))}
                  </>
                )}
              </View>
            )}

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              placeholder="Contá de qué se trata..."
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              testID="edit-video-description"
            />

            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="#tag1 #tag2"
              placeholderTextColor="#888"
              value={tags}
              onChangeText={setTags}
              maxLength={500}
              testID="edit-video-tags"
            />

            <Text style={styles.label}>Música</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la canción"
              placeholderTextColor="#888"
              value={music}
              onChangeText={setMusic}
              maxLength={200}
              testID="edit-video-music"
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              testID="edit-video-save"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  priorityBox: {
    backgroundColor: '#fff8ee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginTop: 6,
    marginBottom: 2,
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  label: {
    color: '#666',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f2f2f2',
    color: '#000',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditVideoModal;
