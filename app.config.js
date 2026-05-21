export default {
  expo: {
    name: 'QueVesVe!&',
    slug: 'quevesve',
    privacy: 'public',
    platforms: ['ios', 'android'],
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/leaf.png',
    splash: {
      image: './src/assets/leaf.png',
      resizeMode: 'contain',
      backgroundColor: '#F5A623',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    android: {
      package: 'com.quevesve.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './src/assets/leaf.png',
        backgroundColor: '#F5A623',
      },
      permissions: [
        'CAMERA',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
        'RECORD_AUDIO',
      ],
    },
    ios: {
      supportsTablet: true,
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow QueVesVe to access your photos to upload videos.',
          cameraPermission: 'Allow QueVesVe to use the camera.',
          microphonePermission: 'Allow QueVesVe to use the microphone.',
        },
      ],
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
      eas: {
        projectId: '70c66ce0-c11a-43f2-bbcf-a14ff4f0bde9',
      },
    },
  },
};
