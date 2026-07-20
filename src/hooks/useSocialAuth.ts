import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

// Disabled for v1 — falta el Client ID de Google (Facebook ya está listo, se
// activarán ambos juntos cuando se resuelva Google OAuth)
const SOCIAL_AUTH_ENABLED = false;

WebBrowser.maybeCompleteAuthSession();

export function useSocialAuth() {
  const { socialLogin } = useAuth();
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

  const googleConfig = SOCIAL_AUTH_ENABLED ? {
    clientId: extra.googleWebClientId || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
    iosClientId: extra.googleIosClientId || undefined,
  } : {
    clientId: 'disabled',
    androidClientId: 'disabled',
    iosClientId: 'disabled',
  };

  const fbConfig = SOCIAL_AUTH_ENABLED ? {
    clientId: extra.facebookAppId || '',
  } : {
    clientId: 'disabled',
  };

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest(googleConfig);
  const [, fbResponse, promptFbAsync] = Facebook.useAuthRequest(fbConfig);

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const token = googleResponse.authentication?.accessToken;
      if (token) {
        setSocialLoading(true);
        setSocialError('');
        socialLogin('google', token)
          .catch(e => setSocialError(e instanceof Error ? e.message : 'Error al iniciar con Google'))
          .finally(() => setSocialLoading(false));
      }
    } else if (googleResponse.type === 'error') {
      setSocialError('Error al iniciar sesión con Google');
    }
  }, [googleResponse]);

  useEffect(() => {
    if (!fbResponse) return;
    if (fbResponse.type === 'success') {
      const token = fbResponse.authentication?.accessToken;
      if (token) {
        setSocialLoading(true);
        setSocialError('');
        socialLogin('facebook', token)
          .catch(e => setSocialError(e instanceof Error ? e.message : 'Error al iniciar con Facebook'))
          .finally(() => setSocialLoading(false));
      }
    } else if (fbResponse.type === 'error') {
      setSocialError('Error al iniciar sesión con Facebook');
    }
  }, [fbResponse]);

  const handleGoogle = () => {
    if (!SOCIAL_AUTH_ENABLED) {
      Alert.alert('Próximamente', 'El inicio de sesión con Google estará disponible cuando la app esté en producción.');
      return;
    }
    setSocialError('');
    promptGoogleAsync();
  };

  const handleFacebook = () => {
    if (!SOCIAL_AUTH_ENABLED) {
      Alert.alert('Próximamente', 'El inicio de sesión con Facebook estará disponible cuando la app esté en producción.');
      return;
    }
    setSocialError('');
    promptFbAsync();
  };

  return { handleGoogle, handleFacebook, socialLoading, socialError, setSocialError };
}
