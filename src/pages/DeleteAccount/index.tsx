import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { deleteAccount } from '../../services/api';

const DeleteAccount: React.FC = () => {
  const navigation = useNavigation();
  const { user, accessToken, logout } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const CONFIRM_WORD = 'ELIMINAR';

  const handleDelete = () => {
    if (confirmation !== CONFIRM_WORD) {
      Alert.alert('Confirmación incorrecta', `Escribí "${CONFIRM_WORD}" para confirmar.`);
      return;
    }
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente. Se borrarán todos tus videos, comentarios y datos. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!user || !accessToken) return;
            setLoading(true);
            try {
              await deleteAccount(user.id, accessToken);
              await logout();
            } catch (e: unknown) {
              setLoading(false);
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Eliminar cuenta</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={32} color="#E5363A" />
          <Text style={styles.warningTitle}>Esta acción es permanente</Text>
          <Text style={styles.warningText}>
            Al eliminar tu cuenta se borrarán permanentemente:
          </Text>
          <Text style={styles.bullet}>• Tu perfil y foto de perfil</Text>
          <Text style={styles.bullet}>• Todos tus videos</Text>
          <Text style={styles.bullet}>• Tus comentarios y likes</Text>
          <Text style={styles.bullet}>• Tus mensajes directos</Text>
          <Text style={styles.bullet}>• Tus seguidores y seguidos</Text>
          <Text style={[styles.warningText, { marginTop: 12 }]}>
            No podrás recuperar tu cuenta una vez eliminada.
          </Text>
        </View>

        <Text style={styles.label}>
          Escribí <Text style={styles.confirmWord}>{CONFIRM_WORD}</Text> para confirmar
        </Text>
        <TextInput
          style={styles.input}
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
          placeholder={CONFIRM_WORD}
          placeholderTextColor="#ccc"
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (confirmation !== CONFIRM_WORD || loading) && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={confirmation !== CONFIRM_WORD || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Eliminar mi cuenta</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  back: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  warningBox: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    alignItems: 'flex-start',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5363A',
    marginTop: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  confirmWord: {
    fontWeight: '700',
    color: '#E5363A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: 2,
  },
  deleteButton: {
    backgroundColor: '#E5363A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#f5a0a0',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DeleteAccount;
