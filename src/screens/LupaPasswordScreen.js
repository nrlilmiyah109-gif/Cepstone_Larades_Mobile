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
import { apiFetch, getCurrentBaseUrl } from '../config/api';
import { Ionicons } from '@expo/vector-icons';
import { LaradesMark } from '../components/LaradesLogo';
import ServerConfigModal from '../components/ServerConfigModal';

/* Langkah pemulihan akun di panel hero atas */
const LANGKAH_PEMULIHAN = [
  {
    nomor: '1',
    judul: 'Identifikasi Akun',
    isi: 'Masukkan NIK, Username, atau Email akun yang terdaftar pada sistem LARADES.',
  },
  {
    nomor: '2',
    judul: 'Kode OTP ke Email',
    isi: 'Sistem mengirimkan 6 digit kode verifikasi resmi ke alamat email terdaftar Anda.',
  },
  {
    nomor: '3',
    judul: 'Kata Sandi Baru',
    isi: 'Masukkan kode OTP beserta kata sandi baru untuk memulihkan akses akun Anda.',
  },
];

const ROLE_LABEL = {
  warga: 'Warga Desa',
  petugas: 'Petugas Desa',
  kepala_desa: 'Kepala Desa',
};

export default function LupaPasswordScreen({ onNavigateLogin, onNavigateRegister }) {
  // Step 1: Input Identitas & Kirim OTP ke Email
  const [identity, setIdentity] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [accountData, setAccountData] = useState(null);

  // Step 2: Input OTP & Password Baru
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hitung mundur pengiriman ulang OTP
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  // Status Pesan
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Server Modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(getCurrentBaseUrl());

  // Countdown timer effect
  useEffect(() => {
    let timer = null;
    if (accountData && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [accountData, countdown]);

  /* Langkah 1: Kirim OTP ke Email */
  const handleSendOtp = async () => {
    const idClean = identity.trim();
    if (!idClean) {
      setError('Identitas akun wajib diisi.');
      Alert.alert('Perhatian', 'Identitas akun wajib diisi. Masukkan NIK, Username, atau Email Anda.');
      return;
    }

    try {
      setSendingOtp(true);
      setError('');
      setSuccessMsg('');
      const res = await apiFetch('/lupa-password/kirim-otp', {
        method: 'POST',
        body: JSON.stringify({ identity: idClean }),
      });
      setAccountData(res);
      setCountdown(60);
      setOtp('');
      setPassword('');
      setPasswordConfirmation('');
      setSuccessMsg(res.message || 'Kode verifikasi telah dikirim ke email terdaftar Anda.');
    } catch (err) {
      const msg =
        err.message ||
        'Gagal mengirim kode verifikasi. Pastikan NIK, Username, atau Email Anda sudah terdaftar.';
      setError(msg);

      if (
        msg.toLowerCase().includes('tidak ditemukan') ||
        msg.toLowerCase().includes('belum terdaftar')
      ) {
        Alert.alert(
          'Akun Tidak Ditemukan',
          `Identitas akun "${idClean}" tidak ditemukan.\n\nPastikan NIK, Username, atau Email yang dimasukkan sudah benar dan terdaftar di sistem.`
        );
      } else {
        Alert.alert('Gagal Mengirim Kode', msg);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  /* Kirim Ulang OTP */
  const handleResendOtp = async () => {
    if (resending || countdown > 0 || !accountData) return;
    try {
      setResending(true);
      setError('');
      setSuccessMsg('');
      const res = await apiFetch('/lupa-password/kirim-otp', {
        method: 'POST',
        body: JSON.stringify({ identity: accountData.identity }),
      });
      setAccountData((prev) => ({
        ...prev,
        ...res,
      }));
      setCountdown(60);
      setSuccessMsg('Kode verifikasi baru berhasil dikirim ke email Anda.');
      Alert.alert('Berhasil', 'Kode verifikasi baru berhasil dikirim ke email Anda.');
    } catch (err) {
      const msg = err.message || 'Gagal mengirim ulang kode OTP.';
      setError(msg);
      Alert.alert('Gagal Mengirim Ulang', msg);
    } finally {
      setResending(false);
    }
  };

  /* Langkah 2: Verifikasi OTP & Reset Password */
  const handleVerifyOtpAndReset = async () => {
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp && !password && !passwordConfirmation) {
      setError('Semua kolom verifikasi dan kata sandi baru wajib diisi.');
      Alert.alert('Perhatian', 'Semua kolom verifikasi dan kata sandi baru wajib diisi.');
      return;
    }

    if (!cleanOtp) {
      setError('Kode verifikasi (OTP) wajib diisi.');
      Alert.alert('Perhatian', 'Kode verifikasi (OTP) wajib diisi.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Kode OTP harus terdiri dari 6 digit angka.');
      Alert.alert('Perhatian', 'Kode OTP harus terdiri dari 6 digit angka.');
      return;
    }

    if (!password) {
      setError('Password baru wajib diisi.');
      Alert.alert('Perhatian', 'Password baru wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setError('Password baru minimal harus 8 karakter.');
      Alert.alert('Perhatian', 'Password baru minimal harus 8 karakter demi keamanan akun Anda.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi password baru tidak cocok.');
      Alert.alert('Perhatian', 'Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiFetch('/lupa-password/verifikasi-otp', {
        method: 'POST',
        body: JSON.stringify({
          identity: accountData.identity,
          otp: cleanOtp,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      Alert.alert(
        'Kata Sandi Berhasil Diperbarui!',
        res.message ||
          'Kata sandi akun Anda telah berhasil diubah. Silakan masuk menggunakan kata sandi baru Anda.',
        [
          {
            text: 'Masuk Sekarang',
            onPress: onNavigateLogin,
          },
        ]
      );
    } catch (err) {
      const msg =
        err.message ||
        'Gagal memverifikasi kode OTP. Pastikan kode yang dimasukkan sudah benar.';
      setError(msg);
      Alert.alert('Gagal Verifikasi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* Kembali ke Langkah 1 */
  const handleResetStep = () => {
    setAccountData(null);
    setOtp('');
    setPassword('');
    setPasswordConfirmation('');
    setError('');
    setSuccessMsg('');
    setCountdown(0);
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
          <TouchableOpacity style={styles.backBtn} onPress={onNavigateLogin}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text style={styles.backBtnText}>Kembali ke Halaman Masuk</Text>
          </TouchableOpacity>

          {/* Logo LARADES */}
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

          {/* Sambutan / Keterangan Pemulihan */}
          <Text style={styles.welcomeHeading}>Pemulihan Kata Sandi</Text>
          <Text style={styles.welcomeDesc}>
            Atur ulang kata sandi akun LARADES Anda secara cepat dan aman melalui kode verifikasi OTP yang dikirimkan langsung ke email terdaftar Anda.
          </Text>

          {/* Box Alur Pemulihan Akun */}
          <View style={styles.aboutBox}>
            <Text style={styles.aboutBoxTitle}>Alur Pemulihan Akun</Text>
            <View style={styles.aboutList}>
              {LANGKAH_PEMULIHAN.map((item) => (
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

        {/* Card Form Lupa Password (lr-card persis Web) */}
        <View style={styles.card}>
          {/* Tombol kembali kecil di dalam card */}
          <TouchableOpacity
            style={styles.cardBackLink}
            onPress={onNavigateLogin}
          >
            <Ionicons name="arrow-back" size={16} color="#187682" />
            <Text style={styles.cardBackLinkText}>Kembali ke Halaman Masuk</Text>
          </TouchableOpacity>

          {/* Heading Form */}
          <View style={styles.headingWrap}>
            <Text style={styles.cardHeading}>Lupa Kata Sandi</Text>
            <Text style={styles.cardSubtitle}>
              {accountData
                ? 'Masukkan kode 6 digit OTP yang telah dikirim ke email terdaftar Anda beserta kata sandi baru.'
                : 'Masukkan NIK, Username, atau Email akun terdaftar untuk menerima kode verifikasi OTP melalui email.'}
            </Text>
          </View>

          {/* Alert Sukses */}
          {!!successMsg && (
            <View style={styles.alertSuccess}>
              <Ionicons name="checkmark-circle" size={18} color="#0e7058" style={{ marginTop: 1 }} />
              <Text style={styles.alertSuccessText}>{successMsg}</Text>
            </View>
          )}

          {/* Alert Error */}
          {!!error && (
            <View style={styles.alertError}>
              <Ionicons name="alert-circle" size={18} color="#b3261e" style={{ marginTop: 1 }} />
              <Text style={styles.alertErrorText}>{error}</Text>
            </View>
          )}

          {/* =========================================================
              LANGKAH 1 : IDENTITAS AKUN & KIRIM OTP EMAIL
              ========================================================= */}
          {!accountData ? (
            <View style={{ marginTop: 8 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Identitas Akun *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan NIK, Username, atau Email..."
                    placeholderTextColor="#9db0b3"
                    value={identity}
                    onChangeText={(val) => {
                      setIdentity(val);
                      setError('');
                    }}
                    autoCapitalize="none"
                    editable={!sendingOtp}
                  />
                </View>
                <Text style={styles.helperText}>
                  Warga dapat memasukkan NIK atau Username. Petugas dan Kepala Desa dapat memasukkan Username atau Email.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, sendingOtp && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <View style={styles.btnInner}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.primaryBtnText}>Mengirim Kode OTP ke Email...</Text>
                  </View>
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Kirim Kode Verifikasi ke Email</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* =========================================================
                LANGKAH 2 : VERIFIKASI KODE OTP & KATA SANDI BARU
                ========================================================= */
            <View style={{ marginTop: 8 }}>
              {/* Kartu Status Email Terkirim */}
              <View style={styles.accountBadgeCard}>
                <View style={{ flexDirection: 'row', gap: 10, flex: 1, alignItems: 'flex-start' }}>
                  <View style={styles.mailIconCircle}>
                    <Ionicons name="mail-outline" size={18} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.accountHeaderRow}>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>
                          {ROLE_LABEL[accountData.role] || accountData.role || 'Akun Terdaftar'}
                        </Text>
                      </View>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {accountData.nama || accountData.identity}
                      </Text>
                    </View>
                    <Text style={styles.emailSentText}>
                      Kode OTP 6-digit telah dikirim ke:{'\n'}
                      <Text style={styles.emailSentMasked}>{accountData.email_masked}</Text>
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.changeAccountBtn}
                  onPress={handleResetStep}
                  disabled={submitting}
                >
                  <Text style={styles.changeAccountBtnText}>Ganti Akun</Text>
                </TouchableOpacity>
              </View>

              {/* Panduan Cek Email */}
              <View style={styles.infoBanner}>
                <Text style={{ fontSize: 16 }}>📩</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoBannerTitle}>Email verifikasi telah dikirim!</Text>
                  <Text style={styles.infoBannerDesc}>
                    Silakan periksa kotak masuk (Inbox) atau folder <Text style={{ fontWeight: '700' }}>Spam</Text> pada email Anda untuk melihat 6 digit kode OTP. Kode hanya berlaku selama 15 menit.
                  </Text>
                </View>
              </View>

              {/* Field Kode OTP */}
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Kode Verifikasi (OTP) *</Text>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>Kirim ulang ({countdown}s)</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={resending}
                      style={styles.resendBtn}
                    >
                      <Ionicons name="refresh-outline" size={13} color="#187682" />
                      <Text style={styles.resendBtnText}>
                        {resending ? 'Mengirim...' : 'Kirim Ulang Kode'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons name="key-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="6 digit kode OTP"
                    placeholderTextColor="#9db0b3"
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val.replace(/\D/g, ''));
                      setError('');
                    }}
                    editable={!submitting}
                  />
                </View>
                <Text style={styles.helperText}>
                  Periksa kotak masuk (Inbox) atau folder Spam pada email Anda. Kode berlaku 15 menit.
                </Text>
              </View>

              {/* Field Password Baru */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password Baru *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#9db0b3"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                    editable={!submitting}
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

              {/* Field Konfirmasi Password Baru */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ulangi Password Baru *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={17} color="#7f9498" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ketik ulang password baru Anda"
                    placeholderTextColor="#9db0b3"
                    value={passwordConfirmation}
                    onChangeText={(val) => {
                      setPasswordConfirmation(val);
                      setError('');
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!submitting}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#6f8387"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tombol Simpan Password Baru */}
              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={handleVerifyOtpAndReset}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.btnInner}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.primaryBtnText}>Menyimpan Perubahan...</Text>
                  </View>
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Verifikasi & Simpan Password Baru</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Pemisah "atau" */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>atau</Text>
            <View style={styles.orLine} />
          </View>

          {/* Navigasi Tambahan */}
          <View style={styles.bottomNavWrap}>
            <TouchableOpacity onPress={onNavigateLogin} style={styles.navRow}>
              <Text style={styles.navTextMuted}>Sudah ingat password Anda? </Text>
              <Text style={styles.navTextLink}>Masuk di sini</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNavigateRegister} style={styles.navRow}>
              <Text style={styles.navTextMuted}>Warga desa belum punya akun? </Text>
              <Text style={styles.navTextLink}>Daftar Akun Baru</Text>
            </TouchableOpacity>
          </View>

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
  /* Box Alur Pemulihan (lr-about) */
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
  cardBackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  cardBackLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#187682',
  },
  headingWrap: {
    marginBottom: 16,
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
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#e8f8f5',
    borderWidth: 1,
    borderColor: '#b7ebd9',
    borderRadius: 9,
    padding: 10,
    marginBottom: 14,
  },
  alertSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#0e7058',
    lineHeight: 16,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fdebec',
    borderWidth: 1,
    borderColor: '#f8c2c0',
    borderRadius: 9,
    padding: 10,
    marginBottom: 14,
  },
  alertErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#b3261e',
    lineHeight: 16,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  countdownText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resendBtnText: {
    fontSize: 11.5,
    color: '#187682',
    fontWeight: '700',
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
  otpInput: {
    letterSpacing: 4,
    fontSize: 16,
    fontWeight: '700',
  },
  eyeBtn: {
    padding: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 5,
    lineHeight: 15,
  },
  /* Step 2 Account Info Card */
  accountBadgeCard: {
    backgroundColor: '#eaf6f7',
    borderWidth: 1,
    borderColor: '#b7e0e4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  mailIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#187682',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  roleTag: {
    backgroundColor: '#187682',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleTagText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  accountName: {
    fontSize: 13,
    fontWeight: '750',
    color: '#1f2d30',
  },
  emailSentText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  emailSentMasked: {
    color: '#187682',
    fontWeight: '700',
    fontSize: 12,
  },
  changeAccountBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b7e0e4',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  changeAccountBtnText: {
    color: '#187682',
    fontSize: 11,
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: '#f0f9fa',
    borderWidth: 1,
    borderColor: '#cbe9ec',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#187682',
    marginBottom: 2,
  },
  infoBannerDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  primaryBtn: {
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
    marginTop: 6,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
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
  bottomNavWrap: {
    alignItems: 'center',
    gap: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  navTextMuted: {
    fontSize: 12,
    color: '#5f7478',
  },
  navTextLink: {
    fontSize: 12,
    color: '#2399a6',
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

