import React from 'react';
import { LogBox } from 'react-native';

import Routes from './src/routes';

// expo-av deprecation warning — suppressed until migrated to expo-audio/expo-video (SDK 54)
LogBox.ignoreLogs(['[expo-av]', 'Expo AV has been deprecated']);

const App: React.FC = () => {
  return <Routes />;
};

export default App;
