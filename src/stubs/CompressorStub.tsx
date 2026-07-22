// Stub para web: react-native-compressor no tiene soporte web (metro.config.js lo redirige acá).
// La compresión real en este target queda a cargo del respaldo del servidor.
export const Video = {
  async compress(
    uri: string,
    _options?: Record<string, unknown>,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    onProgress?.(1);
    return uri;
  },
};
