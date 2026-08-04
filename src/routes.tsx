import React from 'react';

import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Splash from './pages/Splash';
import AppRoutes from './routes/app.routes';
import Login from './pages/Login';
import Register from './pages/Register';

const Stack = createStackNavigator();

const AuthStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="Register" component={Register} />
  </Stack.Navigator>
);

const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Splash />;
  }

  return user ? <AppRoutes /> : <AuthStack />;
};

const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [Linking.createURL('/'), 'quevesve://'],
  config: {
    screens: {
      VideoViewer: {
        path: 'video/:videoId',
        parse: { videoId: (videoId: string) => Number(videoId) },
      },
    },
  },
};

const Routes: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default Routes;
