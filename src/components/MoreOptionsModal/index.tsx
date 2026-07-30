import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { markCategoryNotInterested, hideCreator, blockUser } from '../../services/api';

interface Props {
  videoId: number;
  userId: number;
  username: string;
  category: string;
  visible: boolean;
  onClose: () => void;
}

const MoreOptionsModal: React.FC<Props> = ({ userId, username, category, visible, onClose }) => {
  const { accessToken } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    if (!accessToken) return;
    setLoadingAction(key);
    try {
      await action();
      setLoadingAction(null);
      Alert.alert('Listo', successMessage, [{ text: 'OK', onPress: onClose }]);
    } catch (e: unknown) {
      setLoadingAction(null);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar la acción.');
    }
  };

  const handleNotInterested = () => {
    if (!category) {
      Alert.alert('Sin categoría', 'Este video no tiene una categoría asignada.');
      return;
    }
    runAction(
      'category',
      () => markCategoryNotInterested(category, accessToken as string),
      'Vas a ver menos contenido de esta categoría.',
    );
  };

  const handleHide = () => {
    runAction(
      'hide',
      () => hideCreator(userId, accessToken as string),
      `No vas a ver más contenido de @${username} en tu feed.`,
    );
  };

  const handleBlock = () => {
    Alert.alert(
      `Bloquear a @${username}`,
      'No vas a ver más su contenido en tu feed. Podés desbloquearlo después desde su perfil.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () => runAction(
            'block',
            () => blockUser(userId, accessToken as string),
            `Bloqueaste a @${username}.`,
          ),
        },
      ],
    );
  };

  const options = [
    {
      key: 'category',
      icon: 'eye-off-outline' as const,
      label: 'No me interesa esta categoría',
      onPress: handleNotInterested,
    },
    {
      key: 'hide',
      icon: 'person-remove-outline' as const,
      label: `Ocultar a @${username}`,
      onPress: handleHide,
    },
    {
      key: 'block',
      icon: 'ban-outline' as const,
      label: `Bloquear a @${username}`,
      onPress: handleBlock,
      destructive: true,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Más opciones</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        {options.map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.row}
            onPress={option.onPress}
            disabled={loadingAction !== null}
          >
            <Ionicons
              name={option.icon}
              size={20}
              color={option.destructive ? '#E5363A' : '#333'}
            />
            <Text style={[styles.rowText, option.destructive && styles.rowTextDestructive]}>
              {option.label}
            </Text>
            {loadingAction === option.key && <ActivityIndicator size="small" color="#555" />}
          </TouchableOpacity>
        ))}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rowText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  rowTextDestructive: {
    color: '#E5363A',
  },
});

export default MoreOptionsModal;
