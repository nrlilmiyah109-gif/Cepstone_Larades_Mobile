import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ServerConfigModal from '../components/ServerConfigModal';
import { getCurrentBaseUrl } from '../config/api';
import { LaradesMark } from '../components/LaradesLogo';

const LANGKAH = [
  {
    nomor: '1',
    judul: 'Ajukan Surat Online',
    isi: 'Pilih jenis surat, isi data, dan unggah berkas persyaratan.',
  },
  {
    nomor: '2',
    judul: 'Pantau Status Pengajuan',
    isi: 'Lihat proses surat Anda, dari diterima hingga disetujui perangkat desa.',
  },
  {
    nomor: '3',
    judul: 'Surat Selesai & Siap Diambil',
    isi: 'Dapatkan pemberitahuan saat surat sudah jadi dan siap digunakan.',
  },
];

export default function LoginScreen({ onNavigateRegister, onNavigateLupaPassword }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(getCurrentBaseUrl());

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Perhatian', 'Username dan password wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password.trim());
    } catch (err) {
      Alert.alert('Gagal Masuk', err.message || 'Username atau password salah.');
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
        {/* Tombol Server di pojok kanan atas */}
        <TouchableOpacity
          style={styles.serverPill}
          onPress={() => setServerModalVisible(true)}
        >
          <Ionicons name="server-outline" size={12} color="#ffffff" />
          <Text style={styles.serverPillText} numberOfLines={1}>
            {currentUrl.replace('http://', '').replace('/api', '')}
          </Text>
        </TouchableOpacity>

        {/* Panel Atas: Brand & Sambutan persis Web (lr-brand teal) */}
        <View style={styles.brandHero}>
          {/* Logo LARADES */}
          <View style={styles.brandTop}>
            <View style={styles.logoMarkWrap}>
              <LaradesMark size={46} />
            </View>
            <View style={styles.brandTitleWrap}>
              <Text style={styles.brandTitle}>
                LARA<Text style={styles.brandTitleAccent}>DES</Text>
              </Text>
              <Text style={styles.brandTagline}>Layanan Persuratan Desa</Text>
            </View>
          </View>

          {/* Sambutan */}
          <Text style={styles.welcomeHeading}>Selamat Datang di Sistem LARADES</Text>
          <Text style={styles.welcomeDesc}>
            Layanan persuratan desa online Pemerintah Desa. Warga dapat mengajukan surat keterangan desa dari rumah, tanpa antre di kantor desa.
          </Text>

          {/* Box Langkah Cara Kerja Layanan */}
          <View style={styles.aboutBox}>
            <Text style={styles.aboutBoxTitle}>Cara Kerja Layanan Persuratan Desa</Text>
            <View style={styles.aboutList}>
              {LANGKAH.map((item) => (
                <View key={item.nomor} style={styles.aboutItem}>
                  <View style={styles.aboutNum}>
                    <Text style={styles.aboutNumText}>{item.nomor}</Text>
                  </View>
                  <View style={styles.aboutTextWrap}>
                    <Text style={styles.aboutItemTitle}>{item.judul}</Text>
                    <Text style={styles.aboutItemDesc}>{item.isi}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Card Form Login (lr-card persis Web) */}
        <View style={styles.card}>
          <View style={styles.headingWrap}>
            <Text style={styles.cardHeading}>Masuk Layanan Warga</Text>
            <Text style={styles.cardSubtitle}>
              Gunakan NIK atau username akun warga Anda untuk mengakses layanan surat online.
            </Text>
          </View>

          {/* Field Username */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>NIK / Username *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={17} color="#7f9498" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan NIK atau username Anda"
                placeholderTextColor="#9db0b3"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Field Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={17} color="#7f9498" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password"
                placeholderTextColor="#9db0b3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#6f8387"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Link Lupa Password */}
          <TouchableOpacity
            style={styles.forgotLink}
            onPress={onNavigateLupaPassword}
          >
            <Text style={styles.forgotText}>Lupa password?</Text>
          </TouchableOpacity>

          {/* Tombol Masuk */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>Masuk</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Pemisah "atau" */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>atau</Text>
            <View style={styles.orLine} />
          </View>

          {/* Box Registrasi (lr-register persis Web) */}
          <View style={styles.registerBox}>
            <Ionicons name="person-add-outline" size={24} color="#2399a6" style={styles.registerIcon} />
            <View style={styles.registerTextWrap}>
              <Text style={styles.registerBoxTitle}>Belum punya akun?</Text>
              <Text style={styles.registerBoxDesc}>
                Daftar sebagai Warga untuk mengakses layanan.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.registerActionBtn}
            onPress={onNavigateRegister}
          >
            <Text style={styles.registerActionBtnText}>Daftar sebagai Warga</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>

          {/* Footer Card */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterP}>LARADES – Layanan Persuratan Desa</Text>
            <Text style={styles.cardFooterP}>Pemerintah Kabupaten Bojonegoro</Text>
          </View>
        </View>
      </ScrollView>

      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
        onSaved={(newUrl) => setCurrentUrl(newUrl)}
      />
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
    paddingBottom: 32,
  },
  serverPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 36,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  serverPillText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    maxWidth: 130,
  },
  /* Panel Atas Brand Teal persis Web (lr-brand) */
  brandHero: {
    backgroundColor: '#2399a6', // var(--wg-primary)
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  brandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTitleAccent: {
    color: '#dfeeef',
  },
  brandTagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 1,
  },
  welcomeHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  welcomeDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 18,
    marginBottom: 14,
  },
  /* Box Cara Kerja (lr-about) */
  aboutBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 14,
    padding: 14,
  },
  aboutBoxTitle: {
    fontSize: 12.5,
    fontWeight: '750',
    color: '#ffffff',
    marginBottom: 10,
  },
  aboutList: {
    gap: 10,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aboutNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  aboutNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#187682',
  },
  aboutTextWrap: {
    flex: 1,
  },
  aboutItemTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  aboutItemDesc: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
    lineHeight: 14,
  },
  /* Card Form (lr-card persis Web) */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    marginHorizontal: 16,
    marginTop: -12,
    borderWidth: 1,
    borderColor: '#cfe3e5', // var(--wg-card-border)
    shadowColor: '#187682',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  headingWrap: {
    marginBottom: 18,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '750',
    color: '#1f2d30', // var(--wg-text)
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#5f7478', // var(--wg-muted)
    lineHeight: 17,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2d3d40',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d3e6e8', // var(--wg-border)
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1f2d30',
  },
  eyeBtn: {
    padding: 6,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 14,
  },
  forgotText: {
    fontSize: 12,
    color: '#2399a6',
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#2399a6', // var(--wg-primary)
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2399a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 2,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e1eced',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 11.5,
    color: '#8fa3a6',
  },
  registerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e6f4f5', // var(--wg-primary-soft)
    borderWidth: 1,
    borderColor: '#c5e0e3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  registerIcon: {
    flexShrink: 0,
  },
  registerTextWrap: {
    flex: 1,
  },
  registerBoxTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2d3d40',
  },
  registerBoxDesc: {
    fontSize: 11,
    color: '#6b8084',
    marginTop: 2,
    lineHeight: 15,
  },
  registerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2399a6',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  registerActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#edf1f2',
    paddingTop: 14,
  },
  cardFooterP: {
    fontSize: 10.5,
    color: '#8fa3a6',
    lineHeight: 15,
  },
});
