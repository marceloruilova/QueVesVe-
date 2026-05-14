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
    },
  },
};
