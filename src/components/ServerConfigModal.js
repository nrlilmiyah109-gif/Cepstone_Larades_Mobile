import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  getCurrentBaseUrl,
  setServerUrl,
  resetServerUrlToDefault,
  getDefaultBaseUrl,
} from '../config/api';
import { Ionicons } from '@expo/vector-icons';

export default function ServerConfigModal({ visible, onClose, onSaved }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (visible) {
      setUrl(getCurrentBaseUrl());
    }
  }, [visible]);

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Perhatian', 'URL server tidak boleh kosong.');
      return;
    }

    try {
      await setServerUrl(url, true);
      Alert.alert('Berhasil', 'URL Server berhasil disimpan.');
      if (onSaved) onSaved(url);
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReset = async () => {
    try {
      const def = await resetServerUrlToDefault();
      setUrl(def);
      Alert.alert('Mode Otomatis Aktif', `URL server otomatis mendeteksi IP laptop:\n${def}`);
      if (onSaved) onSaved(def);
    } catch (_e) {
      setUrl(getDefaultBaseUrl());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="settings-outline" size={20} color="#1b7480" />
              <Text style={styles.title}>Pengaturan Server API</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>
            Masukkan alamat IP komputer tempat backend Laravel berjalan (misal saat terhubung Wi-Fi yang sama).
          </Text>

          <Text style={styles.label}>URL Server Backend:</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.xx:8000/api"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Default</Text>
            </TouchableOpacity>

            <View style={styles.rightBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b7480',
  },
  desc: {
    fontSize: 12.5,
    color: '#666',
    lineHeight: 18,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce7e9',
    backgroundColor: '#f8fbfc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#222',
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f1f2',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  rightBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#1b7480',
  },
  saveBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
});
