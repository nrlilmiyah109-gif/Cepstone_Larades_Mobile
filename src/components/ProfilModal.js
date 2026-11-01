import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch, setAuthSession, getAuthToken } from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilModal({ visible, onClose }) {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const isWarga = user?.role === 'warga';
  const [formData, setFormData] = useState({});

  // Password fields for staf
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfil = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/profil');
      const u = res.user || user;
      const w = u.warga || {};

      setFormData({
        nama: w.nama || u.nama || '',
        alamat: w.alamat || '',
        jenis_kelamin: w.jenis_kelamin || 'Laki-laki',
        tempat_lahir: w.tempat_lahir || '',
        tanggal_lahir: w.tanggal_lahir ? String(w.tanggal_lahir).slice(0, 10) : '',
        agama: w.agama || 'Islam',
        status: w.status || 'Belum Kawin',
        pekerjaan: w.pekerjaan || '',
        no_hp: w.no_hp || '',
        email: u.email || '',
        username: u.username || '',
      });
    } catch (err) {
      console.warn('Gagal ambil profil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadProfil();
    }
  }, [visible]);

  const handleSave = async () => {
    try {
      setSaving(true);
      let payload = {};

      if (isWarga) {
        payload = {
          nama: formData.nama,
          alamat: formData.alamat,
          jenis_kelamin: formData.jenis_kelamin,
          tempat_lahir: formData.tempat_lahir,
          tanggal_lahir: formData.tanggal_lahir,
          agama: formData.agama,
          status: formData.status,
          pekerjaan: formData.pekerjaan,
          no_hp: formData.no_hp,
          email: formData.email,
        };
      } else {
        payload = {
          username: formData.username,
          email: formData.email,
        };

        if (newPassword) {
          if (!currentPassword) {
            throw new Error('Masukkan password saat ini untuk mengganti password.');
          }
          if (newPassword !== confirmPassword) {
            throw new Error('Konfirmasi password baru tidak cocok.');
          }
          payload.current_password = currentPassword;
          payload.password = newPassword;
          payload.password_confirmation = confirmPassword;
        }
      }

      const res = await apiFetch('/profil', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      Alert.alert('Berhasil', res.message || 'Profil berhasil diperbarui.');

      if (res.user) {
        const token = await getAuthToken();
        await setAuthSession(token, res.user);
        setUser(res.user);
      }

      setIsEditing(false);
      loadProfil();
    } catch (err) {
      Alert.alert('Gagal Memperbarui', err.message || 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="person-circle-outline" size={24} color="#1b7480" />
              <Text style={styles.title}>Profil Pengguna</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#1b7480" />
              <Text style={styles.loadingText}>Memuat profil...</Text>
            </View>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Role Badge */}
              <View style={styles.roleCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>
                    {(formData.nama || formData.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{formData.nama || formData.username}</Text>
                  <Text style={styles.profileRole}>
                    {user?.role === 'kepala_desa'
                      ? '👑 KEPALA DESA'
                      : user?.role === 'petugas'
                      ? '💼 PETUGAS DESA'
                      : '👤 WARGA DESA'}
                  </Text>
                  {user?.nik && <Text style={styles.profileNik}>NIK: {user.nik}</Text>}
                </View>
              </View>

              {/* Form Data */}
              <View style={styles.formSection}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.sectionHeading}>Data Informasi Akun</Text>
                  {!isEditing && (
                    <TouchableOpacity style={styles.editPill} onPress={() => setIsEditing(true)}>
                      <Ionicons name="create-outline" size={14} color="#1b7480" />
                      <Text style={styles.editPillText}>Ubah Profil</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isWarga && (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Nama Lengkap:</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={formData.nama}
                        editable={isEditing}
                        onChangeText={(val) => setFormData({ ...formData, nama: val })}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Nomor WhatsApp / HP:</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={formData.no_hp}
                        editable={isEditing}
                        keyboardType="phone-pad"
                        onChangeText={(val) => setFormData({ ...formData, no_hp: val })}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Alamat:</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={formData.alamat}
                        editable={isEditing}
                        onChangeText={(val) => setFormData({ ...formData, alamat: val })}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Pekerjaan:</Text>
                      <TextInput
                        style={[styles.input, !isEditing && styles.inputDisabled]}
                        value={formData.pekerjaan}
                        editable={isEditing}
                        onChangeText={(val) => setFormData({ ...formData, pekerjaan: val })}
                      />
                    </View>
                  </>
                )}

                {!isWarga && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Username:</Text>
                    <TextInput
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      value={formData.username}
                      editable={isEditing}
                      autoCapitalize="none"
                      onChangeText={(val) => setFormData({ ...formData, username: val })}
                    />
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email:</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={formData.email}
                    editable={isEditing}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(val) => setFormData({ ...formData, email: val })}
                  />
                </View>

                {/* Ganti Password untuk Staf */}
                {!isWarga && isEditing && (
                  <View style={styles.passwordBox}>
                    <Text style={styles.passwordTitle}>Ganti Password (Opsional)</Text>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Password Saat Ini:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Masukkan password lama"
                        value={currentPassword}
                        secureTextEntry
                        onChangeText={setCurrentPassword}
                      />
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Password Baru (Min. 8 karakter):</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Masukkan password baru"
                        value={newPassword}
                        secureTextEntry
                        onChangeText={setNewPassword}
                      />
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Konfirmasi Password Baru:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        secureTextEntry
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Footer Actions saat mode Edit */}
          {isEditing && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditing(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#13545d',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: 14,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: '#666',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#e6f3f5',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cce5e8',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2a9fad',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#13545d',
  },
  profileRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#187682',
    marginTop: 2,
  },
  profileNik: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  formSection: {
    backgroundColor: '#fff',
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f3f5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cce5e8',
  },
  editPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1b7480',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dce7e9',
    backgroundColor: '#fbfdfd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#222',
  },
  inputDisabled: {
    backgroundColor: '#f8fbfc',
    color: '#555',
    borderColor: '#e8edf0',
  },
  passwordBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#fff9ea',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffe8a8',
  },
  passwordTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b77700',
    marginBottom: 8,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f1f2',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2a9fad',
  },
  saveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
