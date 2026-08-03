import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AntDesign } from '@expo/vector-icons';

import { useAuth } from '../../../contexts/AuthContext';
import { getComments, postComment, CommentItem } from '../../../services/api';

interface Props {
  videoId: number;
  visible: boolean;
  onClose: () => void;
}

const CommentsModal: React.FC<Props> = ({ videoId, visible, onClose }) => {
  const { accessToken } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // RN's KeyboardAvoidingView no calcula bien el espacio disponible dentro de
  // un <Modal> en Android (el diálogo nativo tiene su propia ventana), lo que
  // hacía que el input quedara oculto/clippeado mientras el teclado estaba
  // abierto: el texto tipeado no se veía hasta minimizar el teclado. Se
  // reemplaza por un ajuste manual usando la altura real del teclado.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchComments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getComments(videoId, accessToken);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [videoId, accessToken]);

  useEffect(() => {
    if (visible) fetchComments();
  }, [visible, fetchComments]);

  const handleSend = async () => {
    if (!accessToken || !text.trim()) return;
    setSending(true);
    try {
      const comment = await postComment(videoId, text.trim(), accessToken);
      setComments(prev => [comment, ...prev]);
      setText('');
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            keyboardHeight > 0
              ? { maxHeight: windowHeight - keyboardHeight - insets.top, marginBottom: keyboardHeight }
              : { maxHeight: windowHeight * 0.7, marginBottom: insets.bottom },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Comentarios</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#E5363A" />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => String(item.id)}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <Text style={styles.empty}>Sé el primero en comentar</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Text style={styles.commentUser}>@{item.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribí un comentario..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || !text.trim()}
              style={styles.sendBtn}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#E5363A" />
              ) : (
                <AntDesign name="arrow-right" size={22} color={text.trim() ? '#E5363A' : '#ccc'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    minHeight: 300,
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
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
  },
  commentRow: {
    marginBottom: 16,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
  },
  sendBtn: {
    marginLeft: 10,
    padding: 6,
  },
});

export default CommentsModal;
