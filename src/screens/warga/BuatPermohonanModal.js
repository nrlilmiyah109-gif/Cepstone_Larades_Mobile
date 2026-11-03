import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { apiFetch } from '../../config/api';
import { prepareFileForUpload } from '../../utils/formDataHelper';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const DAFTAR_JENIS_SURAT = [
  'Surat Keterangan Usaha (SKU)',
  'Surat Keterangan Domisili',
  'Surat Keterangan Tidak Mampu (SKTM)',
  'Surat Pengantar SKCK',
  'Surat Keterangan Belum Menikah',
  'Surat Keterangan Kelahiran',
  'Surat Keterangan Kematian',
  'Surat Keterangan Penghasilan',
];

export default function BuatPermohonanModal({ visible, onClose, onSuccess }) {
  const [jenisSurat, setJenisSurat] = useState(DAFTAR_JENIS_SURAT[0]);
  const [keterangan, setKeterangan] = useState('');
  const [fileKtp, setFileKtp] = useState(null);
  const [fileKk, setFileKk] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (type === 'ktp') setFileKtp(file);
        if (type === 'kk') setFileKk(file);
      }
    } catch (err) {
      Alert.alert('Gagal Memilih Dokumen', err.message);
    }
  };

  const handleSubmit = async () => {
    if (!keterangan.trim()) {
      Alert.alert('Perhatian', 'Harap isi keterangan keperluan surat.');
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append('jenis_surat', jenisSurat);
      payload.append(
        'isi_permohonan',
        JSON.stringify({
          keterangan: keterangan.trim(),
          data_surat: {},
          dokumen: {
            ktp: fileKtp?.name || null,
            kk: fileKk?.name || null,
          },
        })
      );

      // Lampirkan KTP jika ada
      if (fileKtp) {
        const ktpPart = await prepareFileForUpload(fileKtp);
        if (ktpPart) {
          payload.append('file_upload[ktp]', ktpPart);
        }
      }

      // Lampirkan KK jika ada
      if (fileKk) {
        const kkPart = await prepareFileForUpload(fileKk);
        if (kkPart) {
          payload.append('file_upload[kk]', kkPart);
        }
      }

      const res = await apiFetch('/permohonan', {
        method: 'POST',
        body: payload,
      });

      Alert.alert('Berhasil', res.message || 'Permohonan surat berhasil dikirim.');
      setKeterangan('');
      setFileKtp(null);
      setFileKk(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Gagal Mengajukan', err.message || 'Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Ajukan Permohonan Surat</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Pilih Jenis Surat:</Text>
            <View style={styles.chipsWrap}>
              {DAFTAR_JENIS_SURAT.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    jenisSurat === item && styles.chipActive,
                  ]}
                  onPress={() => setJenisSurat(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      jenisSurat === item && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Keperluan / Keterangan Tambahan *:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Contoh: Untuk persyaratan pendaftaran beasiswa anak, atau untuk syarat pengajuan kredit usaha mikro."
              value={keterangan}
              onChangeText={setKeterangan}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Dokumen Pendukung (KTP & KK) */}
            <Text style={[styles.label, { marginTop: 14 }]}>Dokumen Pendukung (KTP & KK):</Text>
            
            {/* Box Upload KTP */}
            <View style={styles.uploadRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadLabel}>Foto KTP Pemohon:</Text>
                <Text style={styles.uploadSub} numberOfLines={1}>
                  {fileKtp ? `✓ ${fileKtp.name}` : 'Belum ada file dipilih'}
                </Text>
              </View>
              {fileKtp ? (
                <TouchableOpacity style={styles.removeBtn} onPress={() => setFileKtp(null)}>
                  <Ionicons name="trash-outline" size={16} color="#b3261e" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pickBtn} onPress={() => pickFile('ktp')}>
                  <Ionicons name="cloud-upload-outline" size={14} color="#1b7480" />
                  <Text style={styles.pickBtnText}>Pilih File</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Box Upload KK */}
            <View style={styles.uploadRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadLabel}>Foto Kartu Keluarga (KK):</Text>
                <Text style={styles.uploadSub} numberOfLines={1}>
                  {fileKk ? `✓ ${fileKk.name}` : 'Belum ada file dipilih'}
                </Text>
              </View>
              {fileKk ? (
                <TouchableOpacity style={styles.removeBtn} onPress={() => setFileKk(null)}>
                  <Ionicons name="trash-outline" size={16} color="#b3261e" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pickBtn} onPress={() => pickFile('kk')}>
                  <Ionicons name="cloud-upload-outline" size={14} color="#1b7480" />
                  <Text style={styles.pickBtnText}>Pilih File</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Kirim Permohonan</Text>
              )}
            </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#13545d',
  },
  body: {
    marginVertical: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dce7e9',
    backgroundColor: '#f8fbfc',
  },
  chipActive: {
    backgroundColor: '#1b7480',
    borderColor: '#1b7480',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#dce7e9',
    backgroundColor: '#fbfdfd',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#222',
    height: 75,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fbfc',
    borderWidth: 1,
    borderColor: '#e2ebec',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#13545d',
  },
  uploadSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f3f5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cce5e8',
  },
  pickBtnText: {
    fontSize: 11.5,
    color: '#1b7480',
    fontWeight: '700',
  },
  removeBtn: {
    padding: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f1f2',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  submitBtn: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2a9fad',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
