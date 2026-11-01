import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const DEFAULT_BASE_URL =
  Platform.OS === 'web'
    ? 'http://127.0.0.1:8000/api'
    : 'http://192.168.1.38:8000/api';

const STORAGE_SERVER_KEY = '@larades_server_url';
const STORAGE_TOKEN_KEY = '@larades_token';
const STORAGE_USER_KEY = '@larades_user';

let currentBaseUrl = DEFAULT_BASE_URL;

// Inisialisasi URL server dari penyimpanan lokal HP
export async function initServerUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_SERVER_KEY);
    if (saved) {
      let cleaned = saved.trim().replace(/\/+$/, '');
      if (cleaned.includes('192.168.1.43') || cleaned.includes('192.168.1.45')) {
        cleaned = cleaned
          .replace('192.168.1.43', '192.168.1.38')
          .replace('192.168.1.45', '192.168.1.38');
        await AsyncStorage.setItem(STORAGE_SERVER_KEY, cleaned);
      }
      currentBaseUrl = cleaned;
    } else {
      currentBaseUrl = DEFAULT_BASE_URL;
    }
  } catch (e) {
    console.warn('Gagal membaca server URL:', e);
  }
  return currentBaseUrl;
}

export function getCurrentBaseUrl() {
  return currentBaseUrl;
}

export async function setServerUrl(newUrl) {
  try {
    const cleaned = newUrl.trim().replace(/\/+$/, '');
    currentBaseUrl = cleaned;
    await AsyncStorage.setItem(STORAGE_SERVER_KEY, cleaned);
    return cleaned;
  } catch (e) {
    throw new Error('Gagal menyimpan URL server.');
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
    const response = await fetch(url, {
      ...options,
      headers,
    });

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
