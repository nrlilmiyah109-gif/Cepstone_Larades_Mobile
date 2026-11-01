import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform, Linking } from 'react-native';
import { getAuthToken, getCurrentBaseUrl } from '../config/api';

/**
 * Mengunduh dokumen resmi LARADES langsung ke folder Download perangkat
 * Menampilkan notifikasi download di bilah atas layar HP (Android Download Manager).
 * @param {string} endpoint - Path API seperti /permohonan/1/download atau /arsip/2/unduh
 * @param {string} defaultFilename - Nama file yang akan disimpan di perangkat
 * @param {string} dialogTitle - Judul dialog/keterangan dokumen
 */
export async function downloadAndOpenFile(endpoint, defaultFilename = 'dokumen.pdf', dialogTitle = 'Buka Dokumen') {
  try {
    const token = await getAuthToken();
    const baseUrl = getCurrentBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    const downloadUrl = `${baseUrl}${cleanEndpoint}${token ? `${separator}token=${encodeURIComponent(token)}` : ''}`;

    // Bersihkan nama file agar aman di sistem operasi
    const safeFilename = (defaultFilename || 'dokumen.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');

    // 1. Dukungan Lingkungan Web (Browser)
    if (Platform.OS === 'web') {
      const resp = await fetch(downloadUrl);
      if (!resp.ok) {
        throw new Error(`Gagal mengunduh dokumen (status ${resp.status})`);
      }
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return { success: true };
    }

    // 2. Mobile (Android & iOS):
    // Gunakan Linking.openURL untuk memicu Download Manager asli sistem HP.
    // Ini membuat icon notifikasi unduhan otomatis muncul di bagian atas layar HP (status bar)
    // dan file otomatis masuk ke folder Download HP.
    const canOpen = await Linking.canOpenURL(downloadUrl);
    if (canOpen) {
      await Linking.openURL(downloadUrl);
      Alert.alert(
        'Mengunduh Surat...',
        `Dokumen "${safeFilename}" sedang diunduh.\n\nSilakan cek notifikasi di bagian atas layar HP Anda untuk melihat status unduhan dan membuka file surat.`,
        [{ text: 'OK' }]
      );
      return { success: true };
    }

    // Fallback: download ke internal storage jika Linking tidak didukung
    const fileUri = `${FileSystem.documentDirectory}${safeFilename}`;
    const result = await FileSystem.downloadAsync(downloadUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status >= 200 && result.status < 300) {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: dialogTitle || 'Buka Dokumen Resmi',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sukses', `Dokumen berhasil diunduh dan tersimpan di:\n${result.uri}`);
      }
      return { success: true, uri: result.uri };
    } else {
      throw new Error(`Server mengembalikan status ${result.status}. Berkas belum tersedia.`);
    }
  } catch (err) {
    Alert.alert('Gagal Mengunduh Dokumen', err.message || 'Terjadi kesalahan saat mengunduh berkas.');
    throw err;
  }
}
