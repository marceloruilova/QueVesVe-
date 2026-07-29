import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import type { ErrorUtils as RNErrorUtils } from 'react-native';
import Constants from 'expo-constants';

import { reportCrash } from './services/api';

export const SUPPORT_EMAIL = 'marcelo.rui11@gmail.com';

// Deben coincidir con los max_length de CrashReport en el backend (reports/models.py):
// mandar de más solo hace que el serializer devuelva 400 y el reporte se pierda entero.
const MAX_MESSAGE_LEN = 2000;
const MAX_STACK_LEN = 8000;

// Techo dentro de una misma sesión de la app: si algo entra en un loop de errores
// (ej. un setInterval roto que tira excepción en cada tick, o el propio fallback del
// ErrorBoundary fallando), esto corta el flood de requests en vez de depender solo
// del rate-limit por IP del backend.
const MAX_REPORTS_PER_SESSION = 15;
let reportsSentThisSession = 0;

// Seteado por AuthContext cuando cambia la sesión, para que los reportes de error
// lleven a qué usuario le pasó sin depender de pasar props por todo el árbol
// (el ErrorBoundary vive arriba de AuthProvider, así que no puede usar useAuth()).
let currentUsername: string | null = null;
export function setCurrentUsername(username: string | null): void {
  currentUsername = username;
}

const appVersion = (Constants.expoConfig?.version as string | undefined) ?? 'unknown';

function sendReport(message: string, stack: string, isFatal: boolean, componentStack?: string): void {
  if (reportsSentThisSession >= MAX_REPORTS_PER_SESSION) return;
  reportsSentThisSession += 1;
  try {
    reportCrash({
      username: currentUsername ?? '',
      message: message.slice(0, MAX_MESSAGE_LEN),
      stack: stack.slice(0, MAX_STACK_LEN),
      componentStack: componentStack?.slice(0, MAX_STACK_LEN),
      isFatal,
      platform: Platform.OS,
      appVersion,
    });
  } catch {
    // El reporte de errores no puede generar sus propios errores.
  }
}

// Atrapa excepciones de JS no capturadas fuera del árbol de React (handlers de eventos,
// promises, timers). En producción reemplaza el diálogo nativo de "error fatal" de RN
// (que deja la app inutilizable) por reportar y avisar con un Alert -- el hilo de JS
// sigue vivo y el usuario se entera sin que le rompamos la pantalla en la que estaba.
// En desarrollo se deja el comportamiento normal (redbox) para no ocultar bugs.
export function installGlobalErrorHandler(): void {
  const errorUtils = (global as unknown as { ErrorUtils?: RNErrorUtils }).ErrorUtils;
  if (!errorUtils) return;

  const previousHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const err = error instanceof Error ? error : new Error(String(error));
    sendReport(err.message, err.stack ?? '', !!isFatal);
    if (__DEV__) {
      previousHandler(error, !!isFatal);
      return;
    }
    if (isFatal) {
      Alert.alert(
        'Algo salió mal',
        'Se produjo un error inesperado y ya fue reportado. Si la app deja de responder, cerrala y volvé a abrirla.',
      );
    }
  });
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Atrapa errores durante el render del árbol de React. A diferencia del handler
// global, acá sí podemos ofrecer una recuperación limpia: el botón "Continuar"
// resetea el boundary y remonta la app desde cero (sin forzar un cierre real).
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    sendReport(error.message, error.stack ?? '', true, info.componentStack ?? undefined);
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>
            Encontramos un error inesperado. Ya fue reportado automáticamente para que lo
            solucionemos. Si el problema persiste, escribinos a {SUPPORT_EMAIL}.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#E5363A',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
