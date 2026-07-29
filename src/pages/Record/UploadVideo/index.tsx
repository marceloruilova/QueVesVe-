import React, { useEffect, useState } from 'react';
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

import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { uploadVideo, getUploadQuota, UploadQuota, UploadRejectedError } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Video as CompressorStubVideo } from '../../../stubs/CompressorStub';

const MAX_DURATION_MS = 180000;
const MAX_UPLOAD_SIZE_BYTES = 150 * 1024 * 1024;
// La compresión nativa (react-native-compressor) transcodea en el propio
// dispositivo, y el pico de memoria que usa escala con la resolución del
// video de origen, no con su duración -- un clip corto en alta resolución
// puede pesar igual que uno largo. Por arriba de este umbral, evitamos el
// transcode local (riesgo de un OOM nativo no capturable desde JS) y
// subimos el original: el backend igual comprime del lado del servidor
// cuando client_compressed=false (ver videos/views.py).
const SKIP_CLIENT_COMPRESSION_ABOVE_BYTES = 60 * 1024 * 1024;

type CompressorVideoModule = {
  compress: (
    uri: string,
    options?: Record<string, unknown>,
    onProgress?: (progress: number) => void,
  ) => Promise<string>;
};

// react-native-compressor no está linkeado en Expo Go (requiere un dev client
// nativo): construye un NativeEventEmitter al nivel del módulo, así que basta
// con hacer `import` (ni siquiera llamar a .compress()) para que tire
// "doesn't seem to be linked... You are not using Expo Go" y tumbe la
// pantalla, sin que ningún try/catch del componente llegue a protegerlo. Por
// eso el require es condicional -- en Expo Go ni se carga el paquete real, se
// usa el mismo stub que ya existe para web. El backend igual comprime del
// lado del servidor cuando client_compressed=false (ver videos/views.py).
//
// La heurística de `isExpoGo` no alcanza sola: en un dev client (ver
// eas.json) cuyo binario nativo quedó desactualizado respecto al
// react-native-compressor del package.json, `executionEnvironment` da
// distinto de 'storeClient' pero el módulo nativo real puede no estar
// linkeado igual, y el require truena igual. El try/catch cubre ese caso
// también.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
function loadCompressorVideo(): CompressorVideoModule {
  if (isExpoGo) return CompressorStubVideo;
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    return require('react-native-compressor').Video;
  } catch {
    return CompressorStubVideo;
  }
}
const CompressorVideo: CompressorVideoModule = loadCompressorVideo();

type UploadVideoRouteParams = {
  UploadVideo: { videoUri: string };
};

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const UploadVideo: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UploadVideoRouteParams, 'UploadVideo'>>();
  const { accessToken } = useAuth();
  const { videoUri } = route.params;

  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [music, setMusic] = useState('');
  const [uploading, setUploading] = useState(false);

  const [quota, setQuota] = useState<UploadQuota | null>(null);
  const [compressing, setCompressing] = useState(true);
  const [compressProgress, setCompressProgress] = useState(0);
  const [finalUri, setFinalUri] = useState(videoUri);
  const [clientCompressed, setClientCompressed] = useState(false);
  const [tooLong, setTooLong] = useState(false);
  const [notEnoughSpace, setNotEnoughSpace] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);

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

    const skipCompression = () => {
      if (cancelled) return;
      setFinalUri(videoUri);
      setClientCompressed(false);
      setCompressing(false);
    };

    FileSystem.getInfoAsync(videoUri)
      .then((info) => {
        if (cancelled) return;
        if (info.exists && typeof info.size === 'number' && info.size > SKIP_CLIENT_COMPRESSION_ABOVE_BYTES) {
          skipCompression();
          return;
        }

        CompressorVideo.compress(
          videoUri,
          { compressionMethod: 'auto', minimumFileSizeForCompress: 5 },
          (progress) => {
            if (!cancelled) setCompressProgress(progress);
          },
        )
          .then((output) => {
            if (cancelled) return;
            setFinalUri(output);
            setClientCompressed(output !== videoUri);
          })
          .catch(() => {
            if (cancelled) return;
            setFinalUri(videoUri);
            setClientCompressed(false);
          })
          .finally(() => {
            if (!cancelled) setCompressing(false);
          });
      })
      .catch(() => {
        // si no podemos ni leer el tamaño crudo, no arriesgamos el transcode nativo
        skipCompression();
      });

    return () => {
      cancelled = true;
    };
  }, [videoUri]);

  useEffect(() => {
    if (compressing) return;
    FileSystem.getInfoAsync(finalUri)
      .then((info) => {
        if (info.exists && typeof info.size === 'number') {
          setTooLarge(info.size > MAX_UPLOAD_SIZE_BYTES);
          if (quota) setNotEnoughSpace(info.size > quota.remaining_bytes);
        }
      })
      .catch(() => {
        // si falla, no bloqueamos acá — el servidor vuelve a validar todo igual
      });
  }, [compressing, finalUri, quota]);

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded && typeof status.durationMillis === 'number') {
      setTooLong(status.durationMillis > MAX_DURATION_MS);
    }
  };

  const handleUpload = async () => {
    if (!accessToken || compressing) return;
    if (tooLong) {
      Alert.alert('Video muy largo', 'El video no puede superar los 3 minutos.');
      return;
    }
    if (tooLarge) {
      Alert.alert('Video muy pesado', 'El video no puede superar los 150MB.');
      return;
    }
    if (notEnoughSpace) {
      Alert.alert(
        'Espacio insuficiente',
        'No tenés espacio suficiente disponible. Borrá videos viejos para poder subir uno nuevo.',
      );
      return;
    }
    setUploading(true);
    try {
      await uploadVideo(finalUri, description, tags, music, accessToken, clientCompressed);
      navigation.navigate('Main' as never);
    } catch (err) {
      if (err instanceof UploadRejectedError && err.reason === 'quota_exceeded') {
        Alert.alert('Espacio insuficiente', err.message);
      } else if (err instanceof UploadRejectedError && err.reason === 'duration_exceeded') {
        Alert.alert('Video muy largo', err.message);
      } else if (err instanceof UploadRejectedError && err.reason === 'file_too_large') {
        Alert.alert('Video muy pesado', err.message);
      } else {
        Alert.alert('Error', 'No se pudo subir el video. Intentá de nuevo.');
      }
    } finally {
      setUploading(false);
    }
  };

  const publishDisabled = uploading || compressing || tooLong || tooLarge || notEnoughSpace;

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
        {!compressing && (
          <Video
            source={{ uri: finalUri }}
            style={styles.preview}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatus}
          />
        )}
        {compressing && (
          <View style={styles.compressingOverlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.compressingText}>
              Optimizando video... {Math.round(compressProgress * 100)}%
            </Text>
          </View>
        )}
      </View>

      {tooLong && (
        <Text style={styles.warningText}>El video supera los 3 minutos.</Text>
      )}
      {tooLarge && (
        <Text style={styles.warningText}>El video supera los 150MB.</Text>
      )}
      {notEnoughSpace && (
        <Text style={styles.warningText}>
          No tenés espacio suficiente disponible. Borrá videos viejos para subir este.
        </Text>
      )}
      {quota && (
        <Text style={styles.quotaText}>
          Almacenamiento usado: {formatMB(quota.used_bytes)} / {formatMB(quota.limit_bytes)}
        </Text>
      )}

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
          style={[styles.uploadButton, publishDisabled && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={publishDisabled}
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
  compressingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compressingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
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

export default UploadVideo;
