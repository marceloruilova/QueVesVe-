import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';

import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';

import { useAuth } from '../../../contexts/AuthContext';
import {
  uploadVideo,
  getUploadQuota,
  UploadQuota,
  UploadRejectedError,
} from '../../../services/api';

const MAX_UPLOAD_SIZE_BYTES = 150 * 1024 * 1024;

type UploadMultipleVideosRouteParams = {
  UploadMultipleVideos: { videoUris: string[] };
};

type ItemStatus = 'pending' | 'uploading' | 'done' | 'error';

interface UploadItem {
  uri: string;
  sizeBytes: number | null;
  tooLarge: boolean;
  status: ItemStatus;
  errorMessage?: string;
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const UploadMultipleVideos: React.FC = () => {
  const navigation = useNavigation();
  const route =
    useRoute<
      RouteProp<UploadMultipleVideosRouteParams, 'UploadMultipleVideos'>
    >();
  const { accessToken } = useAuth();
  const { videoUris } = route.params;

  const [items, setItems] = useState<UploadItem[]>(
    videoUris.map(uri => ({
      uri,
      sizeBytes: null,
      tooLarge: false,
      status: 'pending',
    })),
  );
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [music, setMusic] = useState('');
  const [uploading, setUploading] = useState(false);
  const [quota, setQuota] = useState<UploadQuota | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getUploadQuota(accessToken)
      .then(setQuota)
      .catch(() => {
        // si falla, no bloqueamos acá — el servidor vuelve a validar la cuota igual
      });
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      videoUris.map(uri => FileSystem.getInfoAsync(uri).catch(() => null)),
    ).then(infos => {
      if (cancelled) return;
      setItems(prev =>
        prev.map((item, index) => {
          const info = infos[index];
          const sizeBytes =
            info && info.exists && typeof info.size === 'number'
              ? info.size
              : null;
          return {
            ...item,
            sizeBytes,
            tooLarge: sizeBytes !== null && sizeBytes > MAX_UPLOAD_SIZE_BYTES,
          };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (uri: string) => {
    setItems(prev => prev.filter(item => item.uri !== uri));
  };

  const pendingValidItems = items.filter(
    item =>
      (item.status === 'pending' || item.status === 'error') && !item.tooLarge,
  );
  const pendingTotalBytes = pendingValidItems.reduce(
    (sum, item) => sum + (item.sizeBytes || 0),
    0,
  );
  const notEnoughSpace = !!quota && pendingTotalBytes > quota.remaining_bytes;
  const publishDisabled =
    uploading || pendingValidItems.length === 0 || notEnoughSpace;

  const handleUploadAll = async () => {
    if (!accessToken || publishDisabled) return;

    setUploading(true);
    let successCount = 0;

    for (const item of pendingValidItems) {
      setItems(prev =>
        prev.map(i => (i.uri === item.uri ? { ...i, status: 'uploading' } : i)),
      );
      try {
        // eslint-disable-next-line no-await-in-loop
        await uploadVideo(
          item.uri,
          description,
          tags,
          music,
          accessToken,
          false,
        );
        successCount += 1;
        setItems(prev =>
          prev.map(i => (i.uri === item.uri ? { ...i, status: 'done' } : i)),
        );
      } catch (err) {
        const message =
          err instanceof UploadRejectedError
            ? err.message
            : 'No se pudo subir este video.';
        setItems(prev =>
          prev.map(i =>
            i.uri === item.uri
              ? { ...i, status: 'error', errorMessage: message }
              : i,
          ),
        );
      }
    }

    setUploading(false);

    const failCount = pendingValidItems.length - successCount;
    Alert.alert(
      'Subida completa',
      failCount > 0
        ? `Se subieron ${successCount} de ${pendingValidItems.length} video(s). Los que fallaron quedaron marcados para reintentar.`
        : `Se subieron ${successCount} video(s) correctamente.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (successCount > 0) navigation.navigate('Main' as never);
          },
        },
      ],
    );
  };

  const renderStatusBadge = (item: UploadItem) => {
    if (item.status === 'uploading')
      return <ActivityIndicator color="#fff" size="small" />;
    if (item.status === 'done')
      return <AntDesign name="check-circle" size={20} color="#4CAF50" />;
    if (item.status === 'error')
      return <AntDesign name="close-circle" size={20} color="#E5363A" />;
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AntDesign name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevos videos ({items.length})</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={item => item.uri}
        contentContainerStyle={styles.thumbList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.thumbWrapper}>
            <View style={styles.thumb}>
              <Ionicons name="videocam" size={28} color="#666" />
              {item.status !== 'pending' && (
                <View style={styles.statusOverlay}>
                  {renderStatusBadge(item)}
                </View>
              )}
              {(item.status === 'pending' || item.status === 'error') && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(item.uri)}
                >
                  <AntDesign name="close" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            {item.tooLarge && (
              <Text style={styles.thumbWarning}>Muy pesado</Text>
            )}
          </View>
        )}
      />

      {notEnoughSpace && (
        <Text style={styles.warningText}>
          No tenés espacio suficiente para subir todos estos videos. Borrá
          videos viejos o quitá alguno.
        </Text>
      )}
      {quota && (
        <Text style={styles.quotaText}>
          Almacenamiento usado: {formatMB(quota.used_bytes)} /{' '}
          {formatMB(quota.limit_bytes)}
        </Text>
      )}

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.input}
          placeholder="Contá de qué se trata... (se usa para todos los videos)"
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
          style={[
            styles.uploadButton,
            publishDisabled && styles.uploadButtonDisabled,
          ]}
          onPress={handleUploadAll}
          disabled={publishDisabled}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>
              Publicar ({pendingValidItems.length})
            </Text>
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
  thumbList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thumbWrapper: {
    marginRight: 10,
    alignItems: 'center',
  },
  thumb: {
    width: 80,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  thumbWarning: {
    color: '#E5363A',
    fontSize: 10,
    marginTop: 4,
  },
  warningText: {
    color: '#E5363A',
    fontSize: 13,
    marginHorizontal: 16,
    marginTop: 10,
  },
  quotaText: {
    color: '#888',
    fontSize: 12,
    marginHorizontal: 16,
    marginTop: 8,
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

export default UploadMultipleVideos;
