import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
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
} from './styles';

type AuthStackParams = { Login: undefined; Register: undefined };

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AuthStackParams>>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <Container>
      <Logo>QueVesVe!&</Logo>
      <Subtitle>Sign in to your account</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Input
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <Input
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ButtonText>Log In</ButtonText>
        )}
      </Button>

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
