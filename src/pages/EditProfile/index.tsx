import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import avatar from '../../assets/avatar.png';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile, verifySenescyt } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<RootStackParamList>;

const EditProfile: React.FC = () => {
  const { user, accessToken, updateUser } = useAuth();
  const navigation = useNavigation<NavProp>();

  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [birthDate, setBirthDate] = useState(user?.birth_date ?? '');
  const [professionalTitle, setProfessionalTitle] = useState(user?.professional_title ?? '');
  const [professionalInstitution, setProfessionalInstitution] = useState(
    user?.professional_institution ?? '',
  );
  const [senescytNumber, setSenescytNumber] = useState(user?.senescyt_number ?? '');
  const [cedula, setCedula] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(user?.senescyt_verified ?? false);
  const [verifiedName, setVerifiedName] = useState(user?.senescyt_verified_name ?? '');
  const [showProfessional, setShowProfessional] = useState(
    !!(user?.professional_title || user?.senescyt_number),
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleVerify = async () => {
    if (!user || !accessToken) return;
    if (!cedula.trim() || !senescytNumber.trim()) {
      Alert.alert('Faltan datos', 'Ingresá tu cédula y número de registro SENESCYT.');
      return;
    }
    setVerifying(true);
    try {
      const res = await verifySenescyt(user.id, cedula, senescytNumber, accessToken);
      setVerified(true);
      setVerifiedName(res.verified_name);
      if (res.title && !professionalTitle) setProfessionalTitle(res.title);
      if (res.institution && !professionalInstitution) setProfessionalInstitution(res.institution);
      Alert.alert('¡Verificado!', `Título verificado a nombre de: ${res.verified_name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al verificar';
      Alert.alert('Verificación fallida', msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!user || !accessToken) return;
    setSaving(true);
    try {
      let body: FormData | Record<string, string>;

      if (localImageUri) {
        const form = new FormData();
        form.append('username', username);
        form.append('bio', bio);
        if (birthDate.trim()) form.append('birth_date', birthDate.trim());
        form.append('professional_title', professionalTitle);
        form.append('professional_institution', professionalInstitution);
        form.append('senescyt_number', senescytNumber);
        form.append('profile_picture', {
          uri: localImageUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
        body = form;
      } else {
        const jsonBody: Record<string, string> = {
          username,
          bio,
          professional_title: professionalTitle,
          professional_institution: professionalInstitution,
          senescyt_number: senescytNumber,
        };
        if (birthDate.trim()) jsonBody.birth_date = birthDate.trim();
        body = jsonBody;
      }

      const updated = await updateUserProfile(user.id, body, accessToken);
      updateUser(updated);
      Alert.alert('Guardado', 'Tu perfil fue actualizado correctamente.');
      navigation.goBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const profileImageSource = localImageUri
    ? { uri: localImageUri }
    : user?.profile_picture
      ? { uri: user.profile_picture }
      : avatar;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <AntDesign name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar perfil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator size="small" color="#F5A623" />
            ) : (
              <Text style={styles.saveText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Foto de perfil */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage}>
            <Image source={profileImageSource} style={styles.avatar} />
            <View style={styles.cameraOverlay}>
              <AntDesign name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Cambiar foto</Text>
        </View>

        {/* Campos básicos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información básica</Text>

          <Text style={styles.fieldLabel}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="username"
          />

          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholder="Contá algo sobre vos..."
          />

          <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="AAAA-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          {user?.is_adult ? (
            <View style={styles.adultBadge}>
              <AntDesign name="check-circle" size={14} color="#27ae60" />
              <Text style={styles.adultBadgeText}>Mayor de edad verificado</Text>
            </View>
          ) : (
            <Text style={styles.birthDateHint}>
              Necesitás ser mayor de 18 años para usar el chat. Ingresá tu fecha en formato AAAA-MM-DD.
            </Text>
          )}
        </View>

        {/* Perfil profesional */}
        <TouchableOpacity
          style={styles.sectionToggle}
          onPress={() => setShowProfessional(p => !p)}
        >
          <MaterialIcons name="work" size={20} color="#F5A623" />
          <Text style={styles.sectionToggleText}>Perfil profesional</Text>
          <AntDesign
            name={showProfessional ? 'up' : 'down'}
            size={16}
            color="#888"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        {showProfessional && (
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Título profesional</Text>
            <TextInput
              style={styles.input}
              value={professionalTitle}
              onChangeText={setProfessionalTitle}
              placeholder="Ej: Médico, Abogado, Ingeniero..."
            />

            <Text style={styles.fieldLabel}>Institución</Text>
            <TextInput
              style={styles.input}
              value={professionalInstitution}
              onChangeText={setProfessionalInstitution}
              placeholder="Ej: Universidad Central del Ecuador"
            />

            <Text style={styles.sectionLabel}>Verificación SENESCYT</Text>
            {verified ? (
              <View style={styles.verifiedBanner}>
                <AntDesign name="check-circle" size={18} color="#27ae60" />
                <Text style={styles.verifiedBannerText}>
                  Verificado — {verifiedName}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.senescytHint}>
                  Verificá tu título profesional con tu número de registro SENESCYT Ecuador.
                </Text>
                <Text style={styles.fieldLabel}>N° Registro SENESCYT</Text>
                <TextInput
                  style={styles.input}
                  value={senescytNumber}
                  onChangeText={setSenescytNumber}
                  placeholder="Ej: 1031-03-358860"
                  autoCapitalize="none"
                />
                <Text style={styles.fieldLabel}>Cédula (solo para verificación)</Text>
                <TextInput
                  style={styles.input}
                  value={cedula}
                  onChangeText={setCedula}
                  placeholder="Ej: 1712345678"
                  keyboardType="number-pad"
                  maxLength={10}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verificar título</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dadada',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveButton: { padding: 4 },
  saveText: { fontSize: 16, color: '#F5A623', fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F5A623',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: { marginTop: 8, color: '#F5A623', fontSize: 14 },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 14, color: '#444', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#e6e6e6',
    marginTop: 8,
    gap: 8,
  },
  sectionToggleText: { fontSize: 16, fontWeight: '600', color: '#333' },
  senescytHint: { fontSize: 13, color: '#888', marginBottom: 8, lineHeight: 18 },
  verifyButton: {
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eafaf1',
    borderRadius: 6,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  verifiedBannerText: { color: '#27ae60', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
  adultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  adultBadgeText: { color: '#27ae60', fontSize: 13, fontWeight: '600' },
  birthDateHint: { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 16 },
});

export default EditProfile;
