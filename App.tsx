import React from 'react';
import { LogBox } from 'react-native';

import Routes from './src/routes';
import { ErrorBoundary, installGlobalErrorHandler } from './src/errorReporting';

// expo-av deprecation warning — suppressed until migrated to expo-audio/expo-video (SDK 54)
LogBox.ignoreLogs(['[expo-av]', 'Expo AV has been deprecated']);

installGlobalErrorHandler();

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes />
    </ErrorBoundary>
  );
};

export default App;
