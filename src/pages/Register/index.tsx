import React, { useState, useMemo } from 'react';
import { ActivityIndicator, Alert, View, Text } from 'react-native';
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

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: '1 letra mayúscula', met: /[A-Z]/.test(password) },
    { label: '1 letra minúscula', met: /[a-z]/.test(password) },
    { label: '1 número', met: /\d/.test(password) },
  ];
}

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AuthStackParams>>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const requirements = useMemo(() => getPasswordRequirements(password), [password]);
  const passwordValid = requirements.every(r => r.met);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('Por favor completá todos los campos.');
      return;
    }
    if (!passwordValid) {
      setError('La contraseña no cumple los requisitos de seguridad.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(username, email, password);
      Alert.alert(
        '¡Cuenta creada!',
        `Te enviamos un email a ${email} para verificar tu cuenta. Podés usarla mientras tanto.`,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Logo>QueVesVe!&</Logo>
      <Subtitle>Creá tu cuenta</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Input
        placeholder="Usuario"
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
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={text => {
          setPassword(text);
          setPasswordTouched(true);
        }}
      />

      {passwordTouched && (
        <View style={{ width: '100%', paddingHorizontal: 24, marginBottom: 8 }}>
          {requirements.map(req => (
            <Text
              key={req.label}
              style={{ fontSize: 12, color: req.met ? '#22c55e' : '#ef4444', marginBottom: 2 }}
            >
              {req.met ? '✓' : '✗'} {req.label}
            </Text>
          ))}
        </View>
      )}

      <Button onPress={handleRegister} disabled={loading || !passwordValid}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ButtonText>Registrarse</ButtonText>
        )}
      </Button>

      <Footer>
        <FooterText>¿Ya tenés una cuenta? </FooterText>
        <FooterLink onPress={() => navigation.navigate('Login')}>
          Iniciar sesión
        </FooterLink>
      </Footer>
    </Container>
  );
};

export default Register;
