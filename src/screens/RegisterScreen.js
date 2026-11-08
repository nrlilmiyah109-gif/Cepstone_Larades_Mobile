import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { apiFetch } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { LaradesMark } from '../components/LaradesLogo';
import DatePickerField from '../components/DatePickerField';

const PERKS = [
  {
    num: '1',
    title: 'Pengajuan Surat Mandiri',
    desc: 'Ajukan dari rumah tanpa perlu datang antre di kantor desa.',
  },
  {
    num: '2',
    title: 'Pantau Proses Real-Time',
    desc: 'Status surat dapat dipantau dari awal hingga selesai diverifikasi.',
  },
  {
    num: '3',
    title: 'Dokumen Digital Resmi',
    desc: 'Unduh surat resmi ber-barcode kapan saja dan di mana saja.',
  },
];

const DAFTAR_AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const DAFTAR_STATUS = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

export default function RegisterScreen({ onNavigateLogin }) {
  const [nik, setNik] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [wargaData, setWargaData] = useState(null);
  const [isManual, setIsManual] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Form data diri untuk pendaftaran mandiri jika NIK belum ada di Master Data
  const [manualData, setManualData] = useState({
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'Laki-laki',
    agama: 'Islam',
    status: 'Belum Kawin',
    pekerjaan: '',
    alamat: '',
  });

  // Data akun & keamanan
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function lookupNik(nikVal) {
    try {
      setLookupLoading(true);
      setLookupError('');
      const res = await apiFetch(`/registrasi/lookup?nik=${nikVal}`);

      if (res && res.found && res.data && !res.sudah_terdaftar) {
        // Kasus 1: NIK terdaftar di Master Data Kependudukan Desa
        setWargaData(res.data);
        setIsManual(false);
        if (res.data.no_hp) setNoHp(res.data.no_hp);
      } else if (res && !res.found && res.bisa_manual) {
        // Kasus 2: NIK belum terdaftar di Master Data -> Pendaftaran Mandiri
        setIsManual(true);
        setWargaData({ is_manual: true });
        setLookupError('');
      } else {
        setWargaData(null);
        setIsManual(false);
        setLookupError(res?.message || 'Data NIK tidak dapat diproses.');
      }
    } catch (err) {
      setWargaData(null);
      setIsManual(false);
      setLookupError(err.message || 'Gagal memeriksa NIK di server.');
    } finally {
      setLookupLoading(false);
    }
  }

  // Auto-lookup saat NIK mencapai 16 digit
  useEffect(() => {
    const cleanNik = nik.trim();

    if (cleanNik.length === 16 && /^[0-9]+$/.test(cleanNik)) {
      lookupNik(cleanNik);
    } else {
      setWargaData(null);
      setIsManual(false);
      if (cleanNik.length > 0 && cleanNik.length < 16) {
        setLookupError(`NIK harus 16 digit angka (saat ini ${cleanNik.length} digit, kurang ${16 - cleanNik.length} digit lagi).`);
      } else {
        setLookupError('');
      }
    }
  }, [nik]);

  const handleRegister = async () => {
    if (!wargaData) {
      Alert.alert('Perhatian', 'Silakan masukkan 16 digit NIK Anda terlebih dahulu.');
      return;
    }

    if (isManual) {
      if (!manualData.nama.trim()) {
        Alert.alert('Perhatian', 'Nama lengkap wajib diisi sesuai KTP.');
        return;
      }
      if (!manualData.tempat_lahir.trim()) {
        Alert.alert('Perhatian', 'Tempat lahir wajib diisi.');
        return;
      }
      if (!manualData.tanggal_lahir.trim()) {
        Alert.alert('Perhatian', 'Tanggal lahir wajib dipilih.');
        return;
      }
      if (!manualData.pekerjaan.trim()) {
        Alert.alert('Perhatian', 'Pekerjaan wajib diisi.');
        return;
      }
      if (!manualData.alamat.trim()) {
        Alert.alert('Perhatian', 'Alamat lengkap wajib diisi.');
        return;
      }
    }

    if (!username.trim()) {
      Alert.alert('Perhatian', 'Username wajib diisi untuk login ke sistem.');
      return;
    }
    if (username.trim().length < 4) {
      Alert.alert('Perhatian', 'Username minimal 4 karakter.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      Alert.alert('Perhatian', 'Username hanya boleh berisi huruf, angka, strip (-), dan garis bawah (_).');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Perhatian', 'Email wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Perhatian', 'Format email tidak valid.');
      return;
    }

    if (!noHp.trim()) {
      Alert.alert('Perhatian', 'Nomor WhatsApp / HP wajib diisi.');
      return;
    }

    if (!password) {
      Alert.alert('Perhatian', 'Password wajib diisi.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Perhatian', 'Password minimal 8 karakter demi keamanan akun Anda.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Perhatian', 'Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        nik: nik.trim(),
        is_manual: isManual,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        no_hp: noHp.trim(),
        password,
        password_confirmation: passwordConfirmation,
      };

      if (isManual) {
        payload.nama = manualData.nama.trim();
        payload.tempat_lahir = manualData.tempat_lahir.trim();
        payload.tanggal_lahir = manualData.tanggal_lahir.trim();
        payload.jenis_kelamin = manualData.jenis_kelamin;
        payload.agama = manualData.agama;
        payload.status = manualData.status;
        payload.pekerjaan = manualData.pekerjaan.trim();
        payload.alamat = manualData.alamat.trim();
      }

      const res = await apiFetch('/registrasi', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (isManual) {
        Alert.alert(
          'Pendaftaran Mandiri Diajukan',
          'Pendaftaran akun Anda berhasil diajukan! Karena NIK Anda belum terdaftar dalam Master Data Desa, data pendaftaran Anda akan diverifikasi dan divalidasi terlebih dahulu oleh Petugas Desa sebelum akun dapat digunakan.',
          [{ text: 'Kembali ke Login', onPress: onNavigateLogin }]
        );
      } else {
        Alert.alert(
          'Pendaftaran Berhasil',
          'Akun Anda berhasil didaftarkan dan sudah aktif! Silakan masuk menggunakan Username / NIK dan Password yang baru saja Anda buat.',
          [{ text: 'Masuk Sekarang', onPress: onNavigateLogin }]
        );
      }
    } catch (err) {
      Alert.alert('Pendaftaran Gagal', err.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Brand Banner persis Web (lr-brand teal) */}
        <View style={styles.brandHero}>
          <TouchableOpacity style={styles.backBtn} onPress={onNavigateLogin}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text style={styles.backBtnText}>Kembali ke Login</Text>
          </TouchableOpacity>

          <View style={styles.brandTop}>
            <View style={styles.logoMarkWrap}>
              <LaradesMark size={44} />
            </View>
            <View style={styles.brandTitleWrap}>
              <Text style={styles.brandTitle}>
                LARA<Text style={styles.brandTitleAccent}>DES</Text>
              </Text>
              <Text style={styles.brandTagline}>Layanan Persuratan Desa</Text>
            </View>
          </View>

          <Text style={styles.welcomeHeading}>Daftar sebagai Warga</Text>
          <Text style={styles.welcomeDesc}>
            Daftarkan diri Anda untuk mulai mengajukan surat permohonan desa secara online, cepat, dan transparan.
          </Text>

          {/* Perks Box */}
          <View style={styles.perksBox}>
            <Text style={styles.perksBoxTitle}>Keuntungan Akun LARADES</Text>
            <View style={styles.perksList}>
              {PERKS.map((p) => (
                <View key={p.num} style={styles.perkItem}>
                  <View style={styles.perkNum}>
                    <Text style={styles.perkNumText}>{p.num}</Text>
                  </View>
                  <View style={styles.perkTextWrap}>
                    <Text style={styles.perkTitle}>{p.title}</Text>
                    <Text style={styles.perkDesc}>{p.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Form Card (lr-register-card persis Web) */}
        <View style={styles.card}>
          {/* Section 1: Verifikasi NIK */}
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Verifikasi NIK Kependudukan</Text>
              <Text style={styles.sectionSub}>Sistem memeriksa data Anda di kependudukan desa</Text>
            </View>
            {wargaData && (
              <View style={[styles.statusBadge, isManual ? styles.statusBadgeManual : styles.statusBadgeVerified]}>
                <Ionicons
                  name={isManual ? 'create-outline' : 'checkmark-circle-outline'}
                  size={13}
                  color={isManual ? '#92400e' : '#1d6b3d'}
                />
                <Text style={[styles.statusBadgeText, isManual ? styles.statusBadgeTextManual : styles.statusBadgeTextVerified]}>
                  {isManual ? 'Daftar Mandiri' : 'Master Data'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Nomor Induk Kependudukan (NIK) *</Text>
              <Text style={[styles.counterText, nik.length === 16 && styles.counterValid]}>
                {nik.length}/16 digit
              </Text>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="card-outline" size={18} color="#7f9498" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="16 digit angka sesuai e-KTP / KK"
                placeholderTextColor="#9db0b3"
                value={nik}
                onChangeText={(text) => setNik(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={16}
              />
              {lookupLoading && <ActivityIndicator size="small" color="#2399a6" />}
            </View>

            {lookupLoading && (
              <Text style={styles.hintLoading}>🔄 Memeriksa NIK di Master Data Desa...</Text>
            )}

            {lookupError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#b3261e" />
                <Text style={styles.errorText}>{lookupError}</Text>
              </View>
            ) : null}
          </View>

          {/* KASUS A: NIK DITEMUKAN DI MASTER DATA DESA */}
          {wargaData && !isManual && (
            <View style={styles.wargaBox}>
              <View style={styles.wargaBoxHeader}>
                <Ionicons name="checkmark-circle" size={18} color="#1d6b3d" />
                <Text style={styles.wargaBoxTitle}>Data Terverifikasi di Master Data Desa</Text>
              </View>
              <Text style={styles.wargaBoxSub}>
                Data kependudukan ditemukan. Akun Anda akan langsung aktif setelah mengisi data akun.
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nama Lengkap:</Text>
                <Text style={styles.infoVal}>{wargaData.nama}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tempat, Tanggal Lahir:</Text>
                <Text style={styles.infoVal}>
                  {wargaData.tempat_lahir}, {String(wargaData.tanggal_lahir || '').slice(0, 10)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jenis Kelamin:</Text>
                <Text style={styles.infoVal}>{wargaData.jenis_kelamin}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Agama:</Text>
                <Text style={styles.infoVal}>{wargaData.agama || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status Perkawinan:</Text>
                <Text style={styles.infoVal}>{wargaData.status || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pekerjaan:</Text>
                <Text style={styles.infoVal}>{wargaData.pekerjaan || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alamat:</Text>
                <Text style={styles.infoVal}>
                  {wargaData.alamat}
                  {wargaData.rt ? ` (RT ${wargaData.rt} / RW ${wargaData.rw || '-'})` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* KASUS B: NIK BELUM ADA DI MASTER DATA DESA (PENDAFTARAN MANDIRI) */}
          {wargaData && isManual && (
            <View style={styles.manualBox}>
              <View style={styles.manualNotice}>
                <Ionicons name="alert-circle-outline" size={20} color="#b45309" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.manualNoticeTitle}>NIK Belum Ada di Master Data Desa</Text>
                  <Text style={styles.manualNoticeText}>
                    Anda dapat mengisi formulir data diri di bawah ini secara mandiri. Akun dan data Anda akan{' '}
                    <Text style={{ fontWeight: '700' }}>diverifikasi dan divalidasi oleh Petugas Desa</Text> terlebih dahulu sebelum akun diaktifkan.
                  </Text>
                </View>
              </View>

              <Text style={styles.manualSubhead}>Lengkapi Biodata Diri</Text>

              {/* Nama Lengkap */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap (sesuai KTP) *</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor="#9db0b3"
                  value={manualData.nama}
                  onChangeText={(val) => setManualData((p) => ({ ...p, nama: val }))}
                />
              </View>

              {/* Tempat & Tanggal Lahir */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Tempat Lahir *</Text>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Bojonegoro"
                    placeholderTextColor="#9db0b3"
                    value={manualData.tempat_lahir}
                    onChangeText={(val) => setManualData((p) => ({ ...p, tempat_lahir: val }))}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <DatePickerField
                    label="Tgl Lahir *"
                    value={manualData.tanggal_lahir}
                    placeholder="Pilih tgl lahir..."
                    maximumDate={new Date()}
                    onChange={(val) => setManualData((p) => ({ ...p, tanggal_lahir: val }))}
                    buttonStyle={styles.manualInput}
                  />
                </View>
              </View>

              {/* Jenis Kelamin */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Jenis Kelamin *</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Laki-laki', 'Perempuan'].map((jk) => (
                    <TouchableOpacity
                      key={jk}
                      style={[
                        styles.genderPill,
                        manualData.jenis_kelamin === jk && styles.genderPillActive,
                      ]}
                      onPress={() => setManualData((p) => ({ ...p, jenis_kelamin: jk }))}
                    >
                      <Ionicons
                        name={jk === 'Laki-laki' ? 'man-outline' : 'woman-outline'}
                        size={15}
                        color={manualData.jenis_kelamin === jk ? '#187682' : '#55646d'}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          manualData.jenis_kelamin === jk && styles.genderTextActive,
                        ]}
                      >
                        {jk}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Agama */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Agama *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                  {DAFTAR_AGAMA.map((agm) => (
                    <TouchableOpacity
                      key={agm}
                      style={[
                        styles.chipPill,
                        manualData.agama === agm && styles.chipPillActive,
                      ]}
                      onPress={() => setManualData((p) => ({ ...p, agama: agm }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          manualData.agama === agm && styles.chipTextActive,
                        ]}
                      >
                        {agm}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Status Perkawinan */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status Perkawinan *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                  {DAFTAR_STATUS.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.chipPill,
                        manualData.status === st && styles.chipPillActive,
                      ]}
                      onPress={() => setManualData((p) => ({ ...p, status: st }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          manualData.status === st && styles.chipTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Pekerjaan */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pekerjaan *</Text>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Contoh: Wiraswasta / Petani / Pelajar"
                  placeholderTextColor="#9db0b3"
                  value={manualData.pekerjaan}
                  onChangeText={(val) => setManualData((p) => ({ ...p, pekerjaan: val }))}
                />
              </View>

              {/* Alamat Lengkap */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Alamat Lengkap (Dusun, RT/RW, Desa) *</Text>
                <TextInput
                  style={[styles.manualInput, { minHeight: 65, textAlignVertical: 'top' }]}
                  placeholder="Dusun Krajan RT 01 / RW 02, Desa Kedungsumber"
                  placeholderTextColor="#9db0b3"
                  value={manualData.alamat}
                  onChangeText={(val) => setManualData((p) => ({ ...p, alamat: val }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          )}

          {/* Section 2: Data Akun & Sandi (Terbuka setelah NIK valid) */}
          {wargaData && (
            <>
              <View style={[styles.sectionTitleRow, { marginTop: 14 }]}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>2</Text>
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Akun & Keamanan</Text>
                  <Text style={styles.sectionSub}>Digunakan untuk masuk ke aplikasi LARADES</Text>
                </View>
              </View>

              {/* Username */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: budi_santoso"
                    placeholderTextColor="#9db0b3"
                    value={username}
                    onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Text style={styles.inputSubHint}>Hanya huruf kecil, angka, strip (-), garis bawah (_), min 4 karakter.</Text>
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Aktif *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="nama@email.com"
                    placeholderTextColor="#9db0b3"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* No WhatsApp / HP */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor WhatsApp / HP *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="call-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="08123456789"
                    placeholderTextColor="#9db0b3"
                    value={noHp}
                    onChangeText={setNoHp}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password Akun *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#9db0b3"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#7f9498"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Konfirmasi Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Konfirmasi Password *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ketik ulang password"
                    placeholderTextColor="#9db0b3"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#7f9498"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tombol Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons
                      name={isManual ? 'send-outline' : 'person-add-outline'}
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.submitBtnText}>
                      {isManual ? 'Ajukan Pendaftaran Mandiri' : 'Daftar Akun Sekarang'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.submitNote}>
                {isManual
                  ? 'ℹ️ Pendaftaran mandiri akan diverifikasi dan divalidasi terlebih dahulu oleh Petugas Desa sebelum Anda dapat masuk.'
                  : '✓ NIK telah terverifikasi. Akun Anda akan langsung aktif setelah berhasil mendaftar.'}
              </Text>
            </>
          )}

          {/* Link Kembali Login */}
          <View style={styles.loginLinkWrap}>
            <Text style={styles.loginLinkNote}>Sudah memiliki akun?</Text>
            <TouchableOpacity onPress={onNavigateLogin}>
              <Text style={styles.loginLinkText}>Masuk Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dfeeef', // var(--wg-bg-light)
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  brandHero: {
    backgroundColor: '#187682', // var(--wg-primary)
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 50 : 38,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 11.5,
    color: '#ffffff',
    fontWeight: '700',
  },
  brandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logoMarkWrap: {
    shadowColor: '#0b4a52',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  brandTitleWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTitleAccent: {
    color: '#dfeeef',
  },
  brandTagline: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.88)',
  },
  welcomeHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 17,
    marginBottom: 12,
  },
  perksBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    padding: 12,
  },
  perksBoxTitle: {
    fontSize: 12,
    fontWeight: '750',
    color: '#ffffff',
    marginBottom: 8,
  },
  perksList: {
    gap: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  perkNum: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  perkNumText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#187682',
  },
  perkTextWrap: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  perkDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginTop: -12,
    borderWidth: 1,
    borderColor: '#cfe3e5',
    shadowColor: '#187682',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#e6f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#187682',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '750',
    color: '#1f2d30',
  },
  sectionSub: {
    fontSize: 10.5,
    color: '#5f7478',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeVerified: {
    backgroundColor: '#eaf8ef',
    borderWidth: 1,
    borderColor: '#bce4cb',
  },
  statusBadgeManual: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextVerified: {
    color: '#1d6b3d',
  },
  statusBadgeTextManual: {
    color: '#92400e',
  },
  formGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3d40',
    marginBottom: 5,
  },
  counterText: {
    fontSize: 11,
    color: '#7f9498',
  },
  counterValid: {
    color: '#1d6b3d',
    fontWeight: '700',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3e6e8',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#1f2d30',
  },
  inputSubHint: {
    fontSize: 10.5,
    color: '#7f9498',
    marginTop: 4,
  },
  hintLoading: {
    fontSize: 11,
    color: '#187682',
    marginTop: 4,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fdebec',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#b3261e',
    flex: 1,
    lineHeight: 15,
  },
  wargaBox: {
    backgroundColor: '#eaf8ef',
    borderWidth: 1,
    borderColor: '#bce4cb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  wargaBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  wargaBoxTitle: {
    fontSize: 12.5,
    fontWeight: '750',
    color: '#1d6b3d',
  },
  wargaBoxSub: {
    fontSize: 10.5,
    color: '#2e7d32',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c8ebda',
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#444',
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111',
    maxWidth: '65%',
    textAlign: 'right',
  },
  manualBox: {
    backgroundColor: '#fffdf5',
    borderWidth: 1,
    borderColor: '#fcefc7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  manualNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  manualNoticeTitle: {
    fontSize: 12,
    fontWeight: '750',
    color: '#92400e',
    marginBottom: 3,
  },
  manualNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#78350f',
  },
  manualSubhead: {
    fontSize: 13,
    fontWeight: '750',
    color: '#187682',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1e6c8',
    paddingBottom: 4,
  },
  manualInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfdcdf',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#1f2d30',
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#cfdcdf',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  genderPillActive: {
    borderColor: '#187682',
    backgroundColor: '#eaf6f7',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#55646d',
  },
  genderTextActive: {
    color: '#187682',
    fontWeight: '750',
  },
  pillScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#cfdcdf',
    backgroundColor: '#ffffff',
  },
  chipPillActive: {
    borderColor: '#187682',
    backgroundColor: '#187682',
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#55646d',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#187682',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#187682',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  submitNote: {
    fontSize: 10.5,
    color: '#657d82',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },
  loginLinkWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf1f2',
  },
  loginLinkNote: {
    fontSize: 12,
    color: '#5f7478',
  },
  loginLinkText: {
    fontSize: 12,
    fontWeight: '750',
    color: '#187682',
  },
});
