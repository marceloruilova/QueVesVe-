// app.config.js: extiende app.json inyectando variables de entorno en runtime.
// Expo SDK 49+ carga .env.local antes de ejecutar este archivo,
// asi que process.env.API_BASE_URL esta disponible aqui (contexto Node.js).
// La app lo lee via Constants.expoConfig.extra.apiBaseUrl
const { expo } = require('./app.json');

module.exports = {
  ...expo,
  extra: {
    ...expo.extra,
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
  },
};
