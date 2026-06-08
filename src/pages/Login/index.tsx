import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import {
  Container,
  Logo,
  Subtitle,
  Input,
  Button,
  ButtonText,
  Footer,
  FooterText,
  FooterLink,
  ErrorText,
  Divider,
  DividerLine,
  DividerText,
  SocialButtonsRow,
  SocialButton,
  SocialButtonText,
} from './styles';

type AuthStackParams = { Login: undefined; Register: undefined };

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AuthStackParams>>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { handleGoogle, handleFacebook, socialLoading, socialError } = useSocialAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const isbusy = loading || socialLoading;

  return (
    <Container>
      <Logo>QueVesVe!&</Logo>
      <Subtitle>Sign in to your account</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {socialError ? <ErrorText>{socialError}</ErrorText> : null}

      <Input
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        editable={!isbusy}
      />
      <Input
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isbusy}
      />

      <Button onPress={handleLogin} disabled={isbusy}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ButtonText>Log In</ButtonText>
        )}
      </Button>

      <Divider>
        <DividerLine />
        <DividerText>o continuar con</DividerText>
        <DividerLine />
      </Divider>

      <SocialButtonsRow>
        <SocialButton
          bgColor="#fff"
          borderColor="#e6e6e6"
          onPress={handleGoogle}
          disabled={isbusy}
        >
          {socialLoading ? (
            <ActivityIndicator color="#EA4335" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={18} color="#EA4335" />
              <SocialButtonText textColor="#1A1A1A">Google</SocialButtonText>
            </>
          )}
        </SocialButton>

        <SocialButton
          bgColor="#1877F2"
          onPress={handleFacebook}
          disabled={isbusy}
        >
          {socialLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="facebook" size={18} color="#fff" />
              <SocialButtonText textColor="#fff">Facebook</SocialButtonText>
            </>
          )}
        </SocialButton>
      </SocialButtonsRow>

      <Footer>
        <FooterText>Don't have an account? </FooterText>
        <FooterLink onPress={() => navigation.navigate('Register')}>
          Sign up
        </FooterLink>
      </Footer>
    </Container>
  );
};

export default Login;
