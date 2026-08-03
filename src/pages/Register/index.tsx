import React, { useState, useMemo } from 'react';
import { ActivityIndicator, Alert, View, Text } from 'react-native';
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
  FieldLabel,
  PasswordFieldWrapper,
  PasswordInput,
  EyeButton,
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const { handleGoogle, handleFacebook, socialLoading, socialError } = useSocialAuth();

  const requirements = useMemo(() => getPasswordRequirements(password), [password]);
  const passwordValid = requirements.every(r => r.met);
  const passwordsMatch = confirmPassword.length === 0 || confirmPassword === password;

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Por favor completá todos los campos.');
      return;
    }
    if (!passwordValid) {
      setError('La contraseña no cumple los requisitos de seguridad.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
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

  const isbusy = loading || socialLoading;

  return (
    <Container>
      <Logo>QueVesVe!&</Logo>
      <Subtitle>Creá tu cuenta</Subtitle>

      {error ? <ErrorText>{error}</ErrorText> : null}
      {socialError ? <ErrorText>{socialError}</ErrorText> : null}

      <FieldLabel>Nombre de usuario</FieldLabel>
      <Input
        placeholder="Usuario"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        editable={!isbusy}
        testID="register-username"
      />

      <FieldLabel>Correo electrónico</FieldLabel>
      <Input
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!isbusy}
        testID="register-email"
      />

      <FieldLabel>Contraseña</FieldLabel>
      <PasswordFieldWrapper>
        <PasswordInput
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={text => {
            setPassword(text);
            setPasswordTouched(true);
          }}
          editable={!isbusy}
          testID="register-password"
        />
        <EyeButton
          onPress={() => setShowPassword(prev => !prev)}
          testID="register-password-toggle"
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color="#8f8f91"
          />
        </EyeButton>
      </PasswordFieldWrapper>

      <FieldLabel>Confirmar contraseña</FieldLabel>
      <PasswordFieldWrapper>
        <PasswordInput
          placeholder="Repetí tu contraseña"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isbusy}
          testID="register-confirm-password"
        />
        <EyeButton
          onPress={() => setShowConfirmPassword(prev => !prev)}
          testID="register-confirm-password-toggle"
        >
          <MaterialCommunityIcons
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={20}
            color="#8f8f91"
          />
        </EyeButton>
      </PasswordFieldWrapper>

      {confirmPassword.length > 0 && !passwordsMatch && (
        <Text style={{ fontSize: 12, color: '#ef4444', width: '100%', marginTop: -12, marginBottom: 12 }}>
          Las contraseñas no coinciden
        </Text>
      )}

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

      <Button
        onPress={handleRegister}
        disabled={isbusy || !passwordValid || !confirmPassword || !passwordsMatch}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ButtonText>Registrarse</ButtonText>
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

      <View style={{ paddingHorizontal: 24, marginTop: 4, marginBottom: 8 }}>
        <Text style={{ fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 16 }}>
          {'Al registrarte aceptás nuestros '}
          <Text
            style={{ fontSize: 11, color: '#F5A623', fontWeight: '600' }}
            onPress={() =>
              Alert.alert(
                'Términos y Condiciones',
                'Al usar QueVesVe!& te comprometés a:\n\n• No subir contenido ilegal o que infrinja derechos de autor.\n• No acosar a otros usuarios.\n• No publicar contenido sexual explícito.\n• Respetar las Normas de la Comunidad.\n\nPodés leer los términos completos y la Política de Privacidad en tu perfil → Ajustes y legal.',
              )
            }
          >
            Términos y Condiciones
          </Text>
          {' y '}
          <Text
            style={{ fontSize: 11, color: '#F5A623', fontWeight: '600' }}
            onPress={() =>
              Alert.alert(
                'Política de Privacidad',
                'Recopilamos tu email, nombre de usuario y los videos que subís para operar la plataforma.\n\nNo vendemos tus datos.\n\nPodés eliminar tu cuenta y todos tus datos desde tu perfil → Eliminar cuenta.\n\nContacto: privacidad@quevesve.app',
              )
            }
          >
            Política de Privacidad
          </Text>
          {'.'}
        </Text>
      </View>

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
