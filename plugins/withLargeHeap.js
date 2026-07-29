const { withAndroidManifest } = require('@expo/config-plugins');

// La compresión nativa de video (react-native-compressor) y la decodificación
// de preview de clips grandes (hasta 150MB / 3 min) pueden agotar el heap
// default de Android (~128-192MB en muchos dispositivos), lo que mata la app
// entera con un OutOfMemoryError no capturable desde JS. largeHeap le pide al
// sistema un heap más grande para este proceso.
module.exports = function withLargeHeap(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:largeHeap'] = 'true';
    }
    return config;
  });
};
