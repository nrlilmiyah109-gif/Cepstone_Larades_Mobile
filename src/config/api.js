import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const STORAGE_SERVER_KEY = '@larades_server_url';
const STORAGE_IS_MANUAL_KEY = '@larades_server_is_manual';
const STORAGE_TOKEN_KEY = '@larades_token';
const STORAGE_USER_KEY = '@larades_user';

/**
 * Deteksi otomatis IP host dari laptop yang sedang menjalankan Metro Bundler / Expo Go.
 * Sehingga ketika anggota tim manapun menjalankan `npx expo start`, HP mereka otomatis
 * terhubung ke IP laptop mereka sendiri tanpa perlu mengubah kodingan!
 */
export function detectHostIp() {
  try {
    // 1. Coba dari Expo Constants expoConfig / manifest hostUri (format: "192.168.1.10:8081")
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;
    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    // 2. Coba dari NativeModules SourceCode scriptURL (format: "http://192.168.1.10:8081/index.bundle...")
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL && typeof scriptURL === 'string') {
      const match = scriptURL.match(/:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch (err) {
    console.warn('Gagal mendeteksi host IP otomatis:', err);
  }

  return null;
}

export const PUBLIC_API_URL = 'https://reactions-upon-evaluate-equality.trycloudflare.com/api';

/**
 * Mendapatkan URL API default secara cerdas:
 * 1. Prioritas 1: process.env.EXPO_PUBLIC_API_URL (jika diatur di .env atau EAS Build)
 * 2. Prioritas 2: http://127.0.0.1:8000/api untuk browser / web
 * 3. Prioritas 3: Deteksi IP host otomatis dari Expo Go (HP ke Laptop masing-masing saat dev)
 * 4. Fallback: PUBLIC_API_URL (URL server publik online untuk rilis APK)
 */
export function getDefaultBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8000/api';
  }

  const hostIp = detectHostIp();
  if (hostIp && typeof __DEV__ !== 'undefined' && __DEV__) {
    return `http://${hostIp}:8000/api`;
  }

  return PUBLIC_API_URL;
}

export const DEFAULT_BASE_URL = getDefaultBaseUrl();

let currentBaseUrl = DEFAULT_BASE_URL;

// Inisialisasi URL server dari penyimpanan lokal HP atau otomatisasi IP
export async function initServerUrl() {
  try {
    const autoDefault = getDefaultBaseUrl();
    const saved = await AsyncStorage.getItem(STORAGE_SERVER_KEY);
    const isManual = await AsyncStorage.getItem(STORAGE_IS_MANUAL_KEY);

    // Jika user pernah mengatur URL manual lewat modal ⚙️ dan menandainya manual
    if (saved && isManual === 'true') {
      currentBaseUrl = saved.trim().replace(/\/+$/, '');
    } else {
      // Jika mode otomatis: selalu gunakan autoDefault agar selalu sinkron dengan laptop manapun yang menjalankan Expo
      currentBaseUrl = autoDefault;
      await AsyncStorage.setItem(STORAGE_SERVER_KEY, autoDefault);
    }
  } catch (e) {
    console.warn('Gagal membaca server URL:', e);
    currentBaseUrl = getDefaultBaseUrl();
  }
  return currentBaseUrl;
}

export function getCurrentBaseUrl() {
  return currentBaseUrl;
}

export async function setServerUrl(newUrl, isManual = true) {
  try {
    const cleaned = newUrl.trim().replace(/\/+$/, '');
    currentBaseUrl = cleaned;
    await AsyncStorage.setItem(STORAGE_SERVER_KEY, cleaned);
    if (isManual) {
      await AsyncStorage.setItem(STORAGE_IS_MANUAL_KEY, 'true');
    }
    return cleaned;
  } catch (_e) {
    throw new Error('Gagal menyimpan URL server.');
  }
}

export async function resetServerUrlToDefault() {
  try {
    await AsyncStorage.removeItem(STORAGE_IS_MANUAL_KEY);
    const def = getDefaultBaseUrl();
    currentBaseUrl = def;
    await AsyncStorage.setItem(STORAGE_SERVER_KEY, def);
    return def;
  } catch (_e) {
    return getDefaultBaseUrl();
  }
}

export async function getAuthToken() {
  return await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
}

export async function setAuthSession(token, user) {
  await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
  await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
  await AsyncStorage.removeItem(STORAGE_USER_KEY);
}

export async function getSavedUser() {
  const raw = await AsyncStorage.getItem(STORAGE_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function apiFetch(endpoint, options = {}) {
  const token = await getAuthToken();
  const url = `${currentBaseUrl}${endpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (netErr) {
      // Auto-fallback jika backend di laptop aktif di port 8001 (bukan 8000)
      if (currentBaseUrl.includes(':8000') || currentBaseUrl.includes(':8001')) {
        const altUrl = currentBaseUrl.includes(':8000')
          ? currentBaseUrl.replace(':8000', ':8001')
          : currentBaseUrl.replace(':8001', ':8000');
        try {
          response = await fetch(`${altUrl}${endpoint}`, {
            ...options,
            headers,
          });
          currentBaseUrl = altUrl;
          await AsyncStorage.setItem(STORAGE_SERVER_KEY, altUrl).catch(() => {});
        } catch {
          throw netErr;
        }
      } else {
        throw netErr;
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && endpoint !== '/login') {
        await clearAuthSession();
      }
      const message = (data && data.message) || (data && data.error) || 'Terjadi kesalahan pada server.';
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error.message && error.message.includes('Network request failed')) {
      throw new Error(`Tidak dapat terhubung ke server (${currentBaseUrl}). Pastikan PC dan HP berada di jaringan Wi-Fi yang sama.`);
    }
    throw error;
  }
}
