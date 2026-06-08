import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export function useSocialAuth() {
  const { socialLogin } = useAuth();
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: extra.googleWebClientId || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
    iosClientId: extra.googleIosClientId || undefined,
  });

  const [, fbResponse, promptFbAsync] = Facebook.useAuthRequest({
    clientId: extra.facebookAppId || '',
  });

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
    setSocialError('');
    promptGoogleAsync();
  };

  const handleFacebook = () => {
    setSocialError('');
    promptFbAsync();
  };

  return { handleGoogle, handleFacebook, socialLoading, socialError, setSocialError };
}
