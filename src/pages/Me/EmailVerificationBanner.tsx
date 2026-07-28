import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  email: string;
  loading: boolean;
  onResend: () => void;
}

function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 2);
  return `${visible}****@${domain}`;
}

const EmailVerificationBanner: React.FC<Props> = ({ email, loading, onResend }) => (
  <View style={styles.wrapper}>
    <View style={styles.topRow}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="mark-email-unread" size={22} color="#F5A623" />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Verificación de cuenta pendiente</Text>
        <Text style={styles.subtitle}>
          Enviamos un email a{' '}
          <Text style={styles.emailChip}>{obfuscateEmail(email)}</Text>
          {'. Confirmá tu cuenta para mejorar tu visibilidad en QueVesVe!&.'}
        </Text>
      </View>
    </View>

    <TouchableOpacity
      testID="resend-verification-button"
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={onResend}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <MaterialIcons name="send" size={15} color="#fff" style={styles.btnIcon} />
          <Text style={styles.buttonText}>Reenviar email de verificación</Text>
        </>
      )}
    </TouchableOpacity>

    <Text style={styles.securityNote}>
      <MaterialIcons name="lock-outline" size={11} color="#999" />
      {'  QueVesVe!& nunca te pedirá tu contraseña por email.'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFFBF5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F5D99A',
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
    padding: 14,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0D6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
  },
  emailChip: {
    color: '#b45309',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#F5A623',
    borderRadius: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  btnIcon: {
    marginRight: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  securityNote: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default EmailVerificationBanner;
