# LARADES Mobile App 📱

Aplikasi mobile resmi Layanan Administrasi Persuratan Desa (LARADES) yang terhubung langsung dengan backend Laravel.

---

## 📂 Struktur Proyek
Proyek ini berada di folder terpisah: `D:\laragon\www\larades-mobile` (tidak bercampur dengan folder web).

- `src/config/api.js`: Pengaturan URL API Server & token auth
- `src/context/AuthContext.js`: Manajemen sesi login & role pengguna
- `src/screens/LoginScreen.js`: Halaman masuk akun
- `src/screens/RegisterScreen.js`: Pendaftaran akun warga dengan auto-lookup NIK 16 digit ke data kependudukan desa
- `src/screens/warga/`: Dashboard warga, pengajuan surat, tracking status, dan unduh surat resmi (.pdf)
- `src/screens/kepala/`: Dashboard Kepala Desa untuk persetujuan surat & arsip dokumen
- `src/components/ServerConfigModal.js`: Pengaturan fleksibel IP Server langsung dari layar aplikasi
- `eas.json`: Konfigurasi build langsung menjadi file `.apk`

---

## 🚀 Cara Menjalankan & Mencoba di HP (Expo Go)

### 1. Jalankan Backend Laravel agar Bisa Diakses HP
Pastikan Laravel berjalan dengan host `0.0.0.0` (agar HP yang satu Wi-Fi bisa mengakses):
```bash
cd "D:\laragon\www\New folder\larades-backend"
php artisan serve --host 0.0.0.0 --port 8000
```

### 2. Jalankan Expo di Laptop
Buka terminal baru di folder `larades-mobile`:
```bash
cd "D:\laragon\www\larades-mobile"
npx expo start
```
Terminal akan menampilkan **QR Code**.

### 3. Buka di HP Anda
1. Install aplikasi **Expo Go** dari Google Play Store di HP Android Anda.
2. Buka Expo Go dan **scan QR Code** yang muncul di terminal laptop.
3. Aplikasi LARADES Mobile akan langsung terbuka di HP Anda!

---

## 📦 Cara Membuat File APK (Siap Install di HP)

Tanpa perlu menginstall Android Studio, Anda dapat memanfaatkan cloud build dari Expo:

1. Buat akun gratis di [expo.dev](https://expo.dev) jika belum punya.
2. Login di terminal laptop:
   ```bash
   npx eas-cli login
   ```
3. Jalankan perintah build APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
4. Tunggu proses build di cloud selesai (beberapa menit). Anda akan diberikan link untuk mengunduh file `.apk` langsung ke HP Anda!
