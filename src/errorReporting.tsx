import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { ErrorUtils as RNErrorUtils } from 'react-native';
import Constants from 'expo-constants';

import { reportCrash } from './services/api';

export const SUPPORT_EMAIL = 'marcelo.rui11@gmail.com';

// Seteado por AuthContext cuando cambia la sesión, para que los reportes de error
// lleven a qué usuario le pasó sin depender de pasar props por todo el árbol
// (el ErrorBoundary vive arriba de AuthProvider, así que no puede usar useAuth()).
let currentUsername: string | null = null;
export function setCurrentUsername(username: string | null): void {
  currentUsername = username;
}

const appVersion = (Constants.expoConfig?.version as string | undefined) ?? 'unknown';

function sendReport(message: string, stack: string, isFatal: boolean, componentStack?: string): void {
  try {
    reportCrash({
      username: currentUsername ?? '',
      message,
      stack,
      componentStack,
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
// (que deja la app inutilizable) por solo reportar y seguir -- el hilo de JS sigue vivo.
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
