import React, { useState, useEffect } from 'react';
import {
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
import { apiFetch } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfilWargaView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Form profil warga
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: 'Islam',
    status: 'Belum Kawin',
    pekerjaan: '',
    no_hp: '',
    email: '',
  });

  // Form ubah password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/profil');
      const u = res.user || res.data || user;
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
      });
    } catch (err) {
      console.warn('Gagal ambil data profil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfil = async () => {
    try {
      setSavingProfil(true);
      await apiFetch('/profil', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      Alert.alert('Berhasil', 'Data profil Anda berhasil diperbarui.');
      setIsEditing(false);
      loadData();
    } catch (err) {
      Alert.alert('Gagal Menyimpan Profil', err.message);
    } finally {
      setSavingProfil(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Perhatian', 'Semua kolom password wajib diisi.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Perhatian', 'Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Perhatian', 'Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setSavingPassword(true);
      await apiFetch('/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      Alert.alert('Berhasil', 'Password Anda berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Gagal Mengganti Password', err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const namaTampil = formData.nama || user?.nama || user?.username || 'Warga';
  const inisial = namaTampil.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Banner */}
      <View style={styles.bannerHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagWrap}>
            <Text style={styles.tagText}>PENGATURAN AKUN</Text>
          </View>
          <Text style={styles.bannerTitle}>Profil Pengguna</Text>
          <Text style={styles.bannerDesc}>
            Kelola data diri kependudukan dan keamanan kata sandi akun Anda.
          </Text>
        </View>
      </View>

      {/* 2. Card Identitas / Avatar */}
      <View style={styles.card}>
        <View style={styles.userHeroRow}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>{inisial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userNameText}>{namaTampil}</Text>
            <Text style={styles.userSubText}>NIK: {user?.nik || '-'}</Text>
            <View style={styles.badgeAktif}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeAktifText}>Akun Terverifikasi</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Card Data Kependudukan */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Data Kependudukan</Text>
            <Text style={styles.cardSub}>
              {isEditing
                ? 'Ubah data yang diizinkan lalu tekan Simpan.'
                : 'Data diri resmi yang tercatat di sistem desa.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.editToggleBtn, isEditing && styles.editToggleBtnActive]}
            onPress={() => {
              if (isEditing) {
                loadData();
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Ionicons
              name={isEditing ? 'close' : 'create-outline'}
              size={14}
              color={isEditing ? '#b3261e' : '#187682'}
            />
            <Text
              style={[
                styles.editToggleBtnText,
                isEditing && styles.editToggleBtnTextActive,
              ]}
            >
              {isEditing ? 'Batal' : 'Edit Profil'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#2a9fad" />
          </View>
        ) : (
          <View style={styles.formGrid}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nama Lengkap *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                value={formData.nama}
                onChangeText={(t) => setFormData({ ...formData, nama: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tempat Lahir</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                value={formData.tempat_lahir}
                onChangeText={(t) => setFormData({ ...formData, tempat_lahir: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tanggal Lahir (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                value={formData.tanggal_lahir}
                onChangeText={(t) => setFormData({ ...formData, tanggal_lahir: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Jenis Kelamin</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                value={formData.jenis_kelamin}
                onChangeText={(t) => setFormData({ ...formData, jenis_kelamin: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Agama</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                value={formData.agama}
                onChangeText={(t) => setFormData({ ...formData, agama: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Pekerjaan</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                value={formData.pekerjaan}
                onChangeText={(t) => setFormData({ ...formData, pekerjaan: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nomor WhatsApp / HP *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                editable={isEditing}
                keyboardType="phone-pad"
                value={formData.no_hp}
                onChangeText={(t) => setFormData({ ...formData, no_hp: t })}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Alamat Domisili *</Text>
              <TextInput
                style={[
                  styles.input,
                  { minHeight: 60, textAlignVertical: 'top' },
                  !isEditing && styles.inputDisabled,
                ]}
                editable={isEditing}
                multiline
                numberOfLines={2}
                value={formData.alamat}
                onChangeText={(t) => setFormData({ ...formData, alamat: t })}
              />
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[styles.saveProfilBtn, savingProfil && styles.btnDisabled]}
                onPress={handleSaveProfil}
                disabled={savingProfil}
              >
                {savingProfil ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="#ffffff" />
                    <Text style={styles.saveProfilBtnText}>Simpan Perubahan</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 4. Card Ubah Password */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Keamanan Kata Sandi</Text>
            <Text style={styles.cardSub}>
              Ganti password akun Anda secara berkala.
            </Text>
          </View>
        </View>

        <View style={styles.formGrid}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password Saat Ini *</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password Baru (Min. 6 Karakter) *</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Konfirmasi Password Baru *</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.savePasswordBtn, savingPassword && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="key-outline" size={16} color="#ffffff" />
                <Text style={styles.savePasswordBtnText}>Ganti Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  bannerHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cfe2e4',
    marginBottom: 12,
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
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2d30',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 11,
    color: '#5f7478',
    lineHeight: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cfe2e4',
    marginBottom: 12,
  },
  userHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBig: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2a9fad',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBigText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2d30',
  },
  userSubText: {
    fontSize: 11,
    color: '#6f868a',
    marginTop: 2,
  },
  badgeAktif: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eaf8ef',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#25804a',
  },
  badgeAktifText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#25804a',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f6f7',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1f2d30',
  },
  cardSub: {
    fontSize: 10.5,
    color: '#718b8f',
    marginTop: 2,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0eeef',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editToggleBtnActive: {
    backgroundColor: '#fdebec',
  },
  editToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#187682',
  },
  editToggleBtnTextActive: {
    color: '#b3261e',
  },
  formGrid: {
    gap: 10,
  },
  fieldGroup: {},
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2b3f42',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfe2e4',
    borderRadius: 8,
    backgroundColor: '#fbfcfc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11.5,
    color: '#1f2d30',
  },
  inputDisabled: {
    backgroundColor: '#f6f9f9',
    color: '#556a6d',
  },
  saveProfilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2a9fad',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 6,
  },
  saveProfilBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  savePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1b7480',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 6,
  },
  savePasswordBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
