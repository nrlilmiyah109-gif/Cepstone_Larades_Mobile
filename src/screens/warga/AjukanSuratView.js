import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { SURAT_CONFIG } from '../../data/suratConfig';
import DatePickerField from '../../components/DatePickerField';
import { apiFetch } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { prepareFileForUpload } from '../../utils/formDataHelper';

const MAX_KETERANGAN = 500;

export default function AjukanSuratView({ onCancel, onSuccess, onNavigateProfil }) {
  const { user } = useAuth();
  const warga = user?.warga || {};

  const [jenisSurat, setJenisSurat] = useState('');
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState({});
  const [isiPermohonan, setIsiPermohonan] = useState('');
  const [setuju, setSetuju] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jenisModalVisible, setJenisModalVisible] = useState(false);
  const [activeDropdownField, setActiveDropdownField] = useState(null);

  const suratTerpilih = SURAT_CONFIG[jenisSurat];

  const handlePickDocument = async (fileName) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setFiles((prev) => ({
          ...prev,
          [fileName]: {
            name: file.name,
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
          },
        }));
      }
    } catch (err) {
      Alert.alert('Gagal Memilih Dokumen', err.message);
    }
  };

  const handleSubmit = async () => {
    if (!jenisSurat) {
      Alert.alert('Perhatian', 'Pilih jenis surat terlebih dahulu.');
      return;
    }

    if (!isiPermohonan.trim()) {
      Alert.alert('Perhatian', 'Keperluan / isi permohonan surat wajib diisi.');
      return;
    }

    if (!setuju) {
      Alert.alert(
        'Persetujuan Wajib',
        'Anda harus mencentang pernyataan bahwa data yang diajukan sudah benar.'
      );
      return;
    }

    // Periksa data isian surat wajib
    if (suratTerpilih?.fields) {
      for (const f of suratTerpilih.fields) {
        if (!formData[f.name] || !String(formData[f.name]).trim()) {
          Alert.alert('Data Belum Lengkap', `${f.label} wajib diisi atau dipilih.`);
          return;
        }
      }
    }

    // Periksa dokumen wajib
    const dokumenKurang = (suratTerpilih?.files || []).filter(
      (file) => !file.optional && !files[file.name]
    );

    if (dokumenKurang.length > 0) {
      Alert.alert(
        'Dokumen Wajib Kurang',
        `Silakan unggah dokumen: ${dokumenKurang.map((f) => f.label).join(', ')}.`
      );
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append('jenis_surat', jenisSurat);
      payload.append(
        'isi_permohonan',
        JSON.stringify({
          keterangan: isiPermohonan,
          data_surat: formData,
          dokumen: Object.keys(files).reduce((acc, key) => {
            if (files[key]) acc[key] = files[key].name;
            return acc;
          }, {}),
        })
      );

      for (const [key, file] of Object.entries(files)) {
        if (file && (file.uri || file.file)) {
          const filePart = await prepareFileForUpload(file);
          if (filePart) {
            payload.append(`file_upload[${key}]`, filePart);
          }
        }
      }

      await apiFetch('/permohonan', {
        method: 'POST',
        body: payload,
      });

      Alert.alert(
        'Berhasil Diajukan',
        'Permohonan surat Anda berhasil dikirim ke perangkat desa dan akan segera diperiksa.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Gagal Mengajukan Surat', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Atas persis Web (ajukan-header) */}
      <View style={styles.ajukanHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagWrap}>
            <Text style={styles.tagText}>LAYANAN PERSURATAN</Text>
          </View>
          <Text style={styles.headerTitle}>Formulir Pengajuan Surat</Text>
          <Text style={styles.headerDesc}>
            Isi formulir berikut untuk mengajukan surat ke pemerintah desa.
            Permohonan Anda akan diperiksa dan diproses oleh petugas.
          </Text>
        </View>
        <View style={styles.badgeForm}>
          <Text style={styles.badgeFormSmall}>Form</Text>
          <Text style={styles.badgeFormBold}>Warga</Text>
        </View>
      </View>

      {/* SECTION 01: DATA PEMOHON */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>01</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Identitas Pemohon</Text>
            <Text style={styles.cardSub}>
              Data otomatis diambil dari akun kependudukan Anda.
            </Text>
          </View>
        </View>

        <View style={styles.profileGrid}>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>NIK</Text>
            <Text style={styles.profileVal}>{user?.nik || warga?.nik || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Nama Lengkap</Text>
            <Text style={styles.profileVal}>{warga?.nama || user?.nama || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Tempat / Tgl Lahir</Text>
            <Text style={styles.profileVal}>
              {(warga?.tempat_lahir || '-') +
                ', ' +
                (warga?.tanggal_lahir ? String(warga.tanggal_lahir).slice(0, 10) : '-')}
            </Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Jenis Kelamin</Text>
            <Text style={styles.profileVal}>{warga?.jenis_kelamin || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Agama</Text>
            <Text style={styles.profileVal}>{warga?.agama || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Pekerjaan</Text>
            <Text style={styles.profileVal}>{warga?.pekerjaan || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Alamat Domisili</Text>
            <Text style={styles.profileVal}>{warga?.alamat || '-'}</Text>
          </View>
        </View>

        {onNavigateProfil && (
          <TouchableOpacity
            style={styles.profilNoticeLink}
            onPress={onNavigateProfil}
          >
            <Ionicons name="information-circle-outline" size={14} color="#187682" />
            <Text style={styles.profilNoticeText}>
              Ada data yang belum sesuai? <Text style={styles.linkBold}>Perbarui di Profil</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SECTION 02: PILIH JENIS SURAT */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>02</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Jenis Surat *</Text>
            <Text style={styles.cardSub}>Pilih surat yang ingin Anda ajukan.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setJenisModalVisible(true)}
        >
          <Text
            style={[styles.dropdownBtnText, !jenisSurat && styles.dropdownBtnPlaceholder]}
          >
            {jenisSurat || 'Pilih jenis surat...'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#1b7480" />
        </TouchableOpacity>

        {suratTerpilih ? (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle" size={16} color="#187682" />
            <View style={{ flex: 1 }}>
              <Text style={styles.hintTitle}>{suratTerpilih.hint}</Text>
              <Text style={styles.hintEst}>
                Estimasi Proses: {suratTerpilih.estimasi}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.helperText}>
            Pilih sesuai dengan kebutuhan administrasi Anda.
          </Text>
        )}
      </View>

      {/* SECTION 2.1: DATA SPESIFIK SURAT */}
      {suratTerpilih && suratTerpilih.fields?.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepNumSub}>
              <Text style={styles.stepNumSubText}>2.1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Data Surat</Text>
              <Text style={styles.cardSub}>Lengkapi data sesuai jenis surat.</Text>
            </View>
          </View>

          {suratTerpilih.fields.map((f) => {
            // 1. Input Tanggal (type: 'date' atau nama tanggal_*)
            if (f.type === 'date' || f.name === 'tanggal_lahir' || f.name === 'tanggal_meninggal') {
              return (
                <View key={f.name} style={styles.fieldGroup}>
                  <DatePickerField
                    label={`${f.label} *`}
                    value={formData[f.name] || ''}
                    placeholder={`Pilih ${f.label.toLowerCase()}...`}
                    maximumDate={new Date()}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, [f.name]: val }))
                    }
                    buttonStyle={styles.input}
                  />
                </View>
              );
            }

            // 2. Jenis Kelamin (2 Pilihan)
            if (f.name === 'jenis_kelamin' || (f.type === 'select' && f.options?.length === 2 && f.name.includes('kelamin'))) {
              const options = f.options || ['Laki-laki', 'Perempuan'];
              return (
                <View key={f.name} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{f.label} *</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    {options.map((opt) => {
                      const isSelected = formData[f.name] === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.twoChoicePill,
                            isSelected && styles.twoChoicePillActive,
                          ]}
                          onPress={() =>
                            setFormData((prev) => ({ ...prev, [f.name]: opt }))
                          }
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={opt === 'Laki-laki' ? 'man-outline' : opt === 'Perempuan' ? 'woman-outline' : 'ellipse-outline'}
                            size={16}
                            color={isSelected ? '#187682' : '#55646d'}
                          />
                          <Text
                            style={[
                              styles.twoChoiceText,
                              isSelected && styles.twoChoiceTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            }

            // 3. Dropdown / Select (misalnya: Agama, Nama RT)
            if (f.type === 'select' && f.options?.length > 0) {
              return (
                <View key={f.name} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{f.label} *</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setActiveDropdownField(f)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownBtnText,
                        !formData[f.name] && styles.dropdownBtnPlaceholder,
                      ]}
                    >
                      {formData[f.name] || `-- Pilih ${f.label} --`}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#1b7480" />
                  </TouchableOpacity>
                </View>
              );
            }

            // 4. Default TextInput
            return (
              <View key={f.name} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{f.label} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Masukkan ${f.label.toLowerCase()}...`}
                  value={formData[f.name] || ''}
                  onChangeText={(t) =>
                    setFormData((prev) => ({ ...prev, [f.name]: t }))
                  }
                />
              </View>
            );
          })}
        </View>
      )}

      {/* SECTION 2.2: DOKUMEN PENDUKUNG */}
      {suratTerpilih && suratTerpilih.files?.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepNumSub}>
              <Text style={styles.stepNumSubText}>2.2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Dokumen Pendukung</Text>
              <Text style={styles.cardSub}>
                Unggah dokumen persyaratan (JPG, PNG, atau PDF, maks. 5 MB).
              </Text>
            </View>
          </View>

          {suratTerpilih.files.map((fileDef) => {
            const uploaded = files[fileDef.name];
            return (
              <View key={fileDef.name} style={styles.uploadRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadLabel}>
                    {fileDef.label}{' '}
                    {!fileDef.optional ? (
                      <Text style={{ color: '#d32f2f' }}>*</Text>
                    ) : (
                      <Text style={{ color: '#777', fontSize: 10 }}>(Opsional)</Text>
                    )}
                  </Text>
                  {uploaded ? (
                    <Text style={styles.uploadedFileName} numberOfLines={1}>
                      ✓ {uploaded.name}
                    </Text>
                  ) : (
                    <Text style={styles.uploadHelper}>Belum ada file dipilih</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.uploadBtn, uploaded && styles.uploadBtnActive]}
                  onPress={() => handlePickDocument(fileDef.name)}
                >
                  <Ionicons
                    name={uploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                    size={16}
                    color={uploaded ? '#25804a' : '#187682'}
                  />
                  <Text
                    style={[
                      styles.uploadBtnText,
                      uploaded && styles.uploadBtnTextActive,
                    ]}
                  >
                    {uploaded ? 'Ganti File' : 'Pilih File'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* SECTION 03: KEPERLUAN / ISI PERMOHONAN */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>03</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Keperluan / Isi Permohonan *</Text>
            <Text style={styles.cardSub}>
              Jelaskan tujuan atau alasan Anda mengajukan surat ini.
            </Text>
          </View>
        </View>

        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          numberOfLines={4}
          maxLength={MAX_KETERANGAN}
          placeholder="Contoh: Untuk melengkapi persyaratan pendaftaran beasiswa kuliah semester gasal..."
          value={isiPermohonan}
          onChangeText={setIsiPermohonan}
        />
        <Text style={styles.charCount}>
          {isiPermohonan.length}/{MAX_KETERANGAN} karakter
        </Text>
      </View>

      {/* SECTION 04: PERNYATAAN KEBENARAN DATA */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>04</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Pernyataan & Persetujuan</Text>
            <Text style={styles.cardSub}>
              Pastikan seluruh isian formulir adalah benar.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSetuju(!setuju)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={setuju ? 'checkbox' : 'square-outline'}
            size={22}
            color={setuju ? '#2399a6' : '#777'}
          />
          <Text style={styles.checkboxText}>
            Saya menyatakan bahwa seluruh data dan dokumen yang saya berikan adalah
            benar, sah, dan dapat dipertanggungjawabkan sesuai hukum yang berlaku.
          </Text>
        </TouchableOpacity>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionsBar}>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Batal</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={16} color="#ffffff" />
              <Text style={styles.submitBtnText}>Kirim Permohonan Surat</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL PILIH JENIS SURAT */}
      <Modal
        visible={jenisModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJenisModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setJenisModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Pilih Jenis Surat</Text>
              <TouchableOpacity onPress={() => setJenisModalVisible(false)}>
                <Ionicons name="close" size={20} color="#444" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {Object.keys(SURAT_CONFIG).map((namaSurat) => {
                const cfg = SURAT_CONFIG[namaSurat];
                const isSelected = jenisSurat === namaSurat;
                return (
                  <TouchableOpacity
                    key={namaSurat}
                    style={[styles.optionItem, isSelected && styles.optionItemActive]}
                    onPress={() => {
                      setJenisSurat(namaSurat);
                      setJenisModalVisible(false);
                      const cfg = SURAT_CONFIG[namaSurat];
                      if (cfg?.fields) {
                        const initial = {};
                        cfg.fields.forEach((f) => {
                          if (f.name === 'agama' && warga?.agama) initial.agama = warga.agama;
                          if (f.name === 'tempat_lahir' && warga?.tempat_lahir && namaSurat === 'Surat Keterangan Belum Menikah') {
                            initial.tempat_lahir = warga.tempat_lahir;
                          }
                          if (f.name === 'tanggal_lahir' && warga?.tanggal_lahir && namaSurat === 'Surat Keterangan Belum Menikah') {
                            initial.tanggal_lahir = String(warga.tanggal_lahir).slice(0, 10);
                          }
                          if (f.name === 'kewarganegaraan') initial.kewarganegaraan = 'Indonesia';
                        });
                        setFormData((prev) => ({ ...initial, ...prev }));
                      }
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleActive,
                        ]}
                      >
                        {namaSurat}
                      </Text>
                      <Text style={styles.optionHint} numberOfLines={1}>
                        {cfg.hint}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#187682" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Dropdown untuk Field Tertentu (misal: Agama, Nama RT) */}
      <Modal
        visible={Boolean(activeDropdownField)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdownField(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveDropdownField(null)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                Pilih {activeDropdownField?.label || 'Pilihan'}
              </Text>
              <TouchableOpacity onPress={() => setActiveDropdownField(null)}>
                <Ionicons name="close" size={20} color="#444" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {activeDropdownField?.options?.map((opt) => {
                const isSelected = formData[activeDropdownField.name] === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionItem, isSelected && styles.optionItemActive]}
                    onPress={() => {
                      setFormData((prev) => ({
                        ...prev,
                        [activeDropdownField.name]: opt,
                      }));
                      setActiveDropdownField(null);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#187682" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0eeef', // var(--w-soft)
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 30,
  },
  /* Header persis Web (.ajukan-header) */
  ajukanHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cfe2e4',
    marginBottom: 14,
    gap: 12,
  },
  tagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0eeef',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#187682',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2d30',
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: 11,
    color: '#5f7478',
    lineHeight: 16,
  },
  badgeForm: {
    backgroundColor: '#2a9fad',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  badgeFormSmall: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  badgeFormBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  /* Cards (.ajukan-card) */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cfe2e4',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f5',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a9fad',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepNumSub: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0eeef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumSubText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#187682',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2d30',
  },
  cardSub: {
    fontSize: 10.5,
    color: '#6e858a',
  },
  /* Profile table */
  profileGrid: {
    backgroundColor: '#f8fafb',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  profileLabel: {
    fontSize: 11,
    color: '#657e82',
    flex: 1,
  },
  profileVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2d30',
    flex: 1.5,
    textAlign: 'right',
  },
  profilNoticeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f5',
  },
  profilNoticeText: {
    fontSize: 10.5,
    color: '#657e82',
  },
  linkBold: {
    fontWeight: '700',
    color: '#187682',
  },
  /* Form inputs */
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2a3b3e',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfe2e4',
    borderRadius: 8,
    backgroundColor: '#fbfcfc',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#1f2d30',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: '#8a9fa3',
    textAlign: 'right',
    marginTop: 4,
  },
  /* Dropdown button */
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cfe2e4',
    borderRadius: 8,
    backgroundColor: '#fbfcfc',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1f2d30',
  },
  dropdownBtnPlaceholder: {
    color: '#95a9ac',
    fontWeight: '400',
  },
  hintBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#e6f4f5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  hintTitle: {
    fontSize: 11,
    color: '#187682',
    fontWeight: '600',
  },
  hintEst: {
    fontSize: 10,
    color: '#34828c',
    marginTop: 2,
  },
  helperText: {
    fontSize: 10.5,
    color: '#839ca0',
    marginTop: 6,
  },
  /* Upload rows */
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f6f7',
    gap: 10,
  },
  uploadLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#243336',
  },
  uploadHelper: {
    fontSize: 10,
    color: '#95a8ab',
    marginTop: 2,
  },
  uploadedFileName: {
    fontSize: 10.5,
    color: '#25804a',
    fontWeight: '600',
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0eeef',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
  },
  uploadBtnActive: {
    backgroundColor: '#eaf8ef',
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#187682',
  },
  uploadBtnTextActive: {
    color: '#25804a',
  },
  /* Checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafb',
    padding: 10,
    borderRadius: 8,
  },
  checkboxText: {
    flex: 1,
    fontSize: 11,
    color: '#34474a',
    lineHeight: 16,
  },
  /* Action bar */
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfe2e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#556c70',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2a9fad',
    borderRadius: 9,
    paddingVertical: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  /* Modal Selector */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f3',
    marginBottom: 8,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2d30',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f7f8',
  },
  optionItemActive: {
    backgroundColor: '#e6f4f5',
    borderRadius: 8,
  },
  optionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1f2d30',
  },
  optionTitleActive: {
    color: '#187682',
  },
  optionHint: {
    fontSize: 10,
    color: '#7b9296',
    marginTop: 2,
  },
  twoChoicePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cfe2e4',
    borderRadius: 8,
    backgroundColor: '#fbfcfc',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  twoChoicePillActive: {
    borderColor: '#187682',
    backgroundColor: '#e6f4f5',
  },
  twoChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475559',
  },
  twoChoiceTextActive: {
    color: '#187682',
    fontWeight: '700',
  },
});