const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const webStubs = {
  'react-native-pager-view': path.resolve(__dirname, 'src/stubs/PagerViewStub.tsx'),
  'lottie-react-native': path.resolve(__dirname, 'src/stubs/LottieStub.tsx'),
};

const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webStubs[moduleName]) {
    return { filePath: webStubs[moduleName], type: 'sourceFile' };
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
