import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { reportVideo } from '../../services/api';

const REASONS = [
  { key: 'spam', label: 'Spam o contenido falso' },
  { key: 'inappropriate', label: 'Contenido inapropiado' },
  { key: 'harassment', label: 'Acoso o ciberacoso' },
  { key: 'copyright', label: 'Violación de derechos de autor' },
  { key: 'misinformation', label: 'Desinformación' },
  { key: 'other', label: 'Otro' },
];

interface Props {
  videoId: number;
  visible: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<Props> = ({ videoId, visible, onClose }) => {
  const { accessToken } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setSelectedReason('');
    setDetails('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Seleccioná un motivo', 'Por favor elegí por qué estás reportando este video.');
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    try {
      await reportVideo(videoId, selectedReason, details, accessToken);
      Alert.alert(
        'Reporte enviado',
        'Gracias por ayudarnos a mantener la comunidad segura. Lo revisaremos pronto.',
        [{ text: 'OK', onPress: handleClose }],
      );
    } catch (e: unknown) {
      setLoading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo enviar el reporte.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Reportar video</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>¿Por qué estás reportando este video?</Text>

        <ScrollView>
          {REASONS.map(reason => (
            <TouchableOpacity
              key={reason.key}
              style={[
                styles.reasonRow,
                selectedReason === reason.key && styles.reasonRowSelected,
              ]}
              onPress={() => setSelectedReason(reason.key)}
            >
              <Text style={[styles.reasonText, selectedReason === reason.key && styles.reasonTextSelected]}>
                {reason.label}
              </Text>
              {selectedReason === reason.key && (
                <Ionicons name="checkmark-circle" size={20} color="#F5A623" />
              )}
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.detailsInput}
            placeholder="Detalles adicionales (opcional)"
            placeholderTextColor="#aaa"
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={500}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, (!selectedReason || loading) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Enviar reporte</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 14,
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f8f8f8',
  },
  reasonRowSelected: {
    backgroundColor: '#fff8ee',
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
  },
  reasonTextSelected: {
    color: '#F5A623',
    fontWeight: '600',
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#E5363A',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#f5a0a0',
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ReportModal;
