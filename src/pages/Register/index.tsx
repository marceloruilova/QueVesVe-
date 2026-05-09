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

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AuthStackParams>>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(username, email, password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Logo>QueVesVe!&</Logo>
      <Subtitle>Create your account</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Input
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <Input
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ButtonText>Sign Up</ButtonText>
        )}
      </Button>

      <Footer>
        <FooterText>Already have an account? </FooterText>
        <FooterLink onPress={() => navigation.navigate('Login')}>
          Log in
        </FooterLink>
      </Footer>
    </Container>
  );
};

export default Register;
