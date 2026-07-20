import React, { useState } from 'react';
import { StatusBar, Platform } from 'react-native';

import {
  MaterialCommunityIcons,
  AntDesign,
  FontAwesome,
} from '@expo/vector-icons';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeButtom from '../components/HomeButton';
import { theme } from '../theme/theme';
import Discover from '../pages/Discover';
import EditProfile from '../pages/EditProfile';
import Home from '../pages/Home';
import Inbox from '../pages/Inbox';
import ConversationScreen from '../pages/Inbox/ConversationScreen';
import Me from '../pages/Me';
import Record from '../pages/Record';
import UploadVideo from '../pages/Record/UploadVideo';
import FollowList from '../pages/FollowList';
import UserProfile from '../pages/UserProfile';
import VideoViewer from '../pages/VideoViewer';
import Legal from '../pages/Legal';
import DeleteAccount from '../pages/DeleteAccount';

const Tab = createMaterialBottomTabNavigator();
const Stack = createStackNavigator();

const AppRoutes: React.FC = () => {
  const [home, setHome] = useState(true);

  StatusBar.setBarStyle('dark-content');

  if (Platform.OS === 'android') StatusBar.setBackgroundColor('#fff');

  if (home) {
    StatusBar.setHidden(true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#fff');
      StatusBar.setBarStyle('light-content');
    }
  } else {
    StatusBar.setHidden(false);
  }

  return (
    <Tab.Navigator
      shifting={false}
      barStyle={{
        backgroundColor: home ? theme.colors.primaryDark : theme.colors.primary,
      }}
      initialRouteName="Home"
      activeColor={home ? theme.colors.text : theme.colors.textDark}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        listeners={{
          focus: () => setHome(true),
          blur: () => setHome(false),
        }}
        options={{
          tabBarLabel: 'Vé!',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={Discover}
        options={{
          tabBarLabel: 'Panas',
          tabBarIcon: ({ color }) => (
            <AntDesign name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Live"
        component={Record}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('Record');
          },
        })}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => <HomeButtom home={home} />,
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={Inbox}
        options={{
          tabBarLabel: 'Chat(o)',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="message-text-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Me"
        component={Me}
        options={{
          tabBarLabel: 'Yo',
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootStackScreen: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={AppRoutes}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Record"
        component={Record}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="UploadVideo"
        component={UploadVideo}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VideoViewer"
        component={VideoViewer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Legal"
        component={Legal}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccount}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootStackScreen;
