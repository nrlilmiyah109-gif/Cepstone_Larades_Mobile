import { Platform } from 'react-native';
import { File as ExpoFile } from 'expo-file-system';

/**
 * Mengonversi file hasil DocumentPicker menjadi bagian FormDataPart yang valid
 * agar kompatibel dengan runtime Expo (WinterCG fetch) di Android, iOS, dan Web.
 * Mencegah error "Unsupported FormDataPart implementation".
 */
export async function prepareFileForUpload(file) {
  if (!file) return null;

  // Jika di lingkungan Web
  if (Platform.OS === 'web' && file.file) {
    return file.file;
  }

  const fileName = file.name || 'dokumen';
  const fileType = file.type || file.mimeType || 'application/octet-stream';

  return {
    name: fileName,
    type: fileType,
    bytes: async () => {
      try {
        if (file.uri) {
          const expoFile = new ExpoFile(file.uri);
          return await expoFile.bytes();
        }
      } catch (err) {
        console.warn('ExpoFile bytes() gagal, mencoba fallback fetch:', err);
      }

      const resp = await fetch(file.uri);
      const arrayBuf = await resp.arrayBuffer();
      return new Uint8Array(arrayBuf);
    },
  };
}
