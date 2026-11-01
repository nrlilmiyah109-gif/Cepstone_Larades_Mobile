import React, { useState } from 'react';
import {
  Modal,
  Image,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAndOpenFile } from '../utils/fileDownloader';

const IGNORED_DATA_KEYS = [
  'nama',
  'nama_lengkap',
  'nik',
  'tempat_lahir',
  'tanggal_lahir',
  'tgl_lahir',
  'tempat_tgl_lahir',
  'jenis_kelamin',
  'jk',
  'agama',
  'status',
  'status_perkawinan',
  'pekerjaan',
  'alamat',
  'rt',
  'rw',
  'kewarganegaraan',
  'keperluan',
  'keterangan',
];

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

// Helper format tanggal Indonesia 100% aman di semua engine JS (Hermes / JSC / Web)
const formatTanggalIndo = (val) => {
  if (!val) return '';
  try {
    if (typeof val === 'string' && /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(val)) {
      return val;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const tgl = d.getDate();
    const bln = NAMA_BULAN[d.getMonth()] || '';
    const thn = d.getFullYear();
    return `${tgl} ${bln} ${thn}`;
  } catch {
    return String(val);
  }
};

const formatHariIndo = (val) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '-';
    return NAMA_HARI[d.getDay()] || '-';
  } catch {
    return '-';
  }
};

const formatRupiah = (val) => {
  if (!val && val !== 0) return '-';
  try {
    const num = String(val).replace(/[^0-9]/g, '');
    if (!num) return String(val);
    return `Rp ${num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  } catch {
    return String(val);
  }
};

const InfoRow = ({ label, value, bold = false, labelWidth = 125 }) => (
  <View style={styles.rowIdentitas}>
    <Text style={[styles.labelKolom, { width: labelWidth }]}>{label}</Text>
    <Text style={styles.titikDua}>:</Text>
    <Text style={[styles.isiKolom, bold && { fontWeight: '700', color: '#000' }]}>
      {value ? String(value) : '-'}
    </Text>
  </View>
);

export default function PreviewSuratModal({
  visible,
  onClose,
  item,
}) {
  const [downloading, setDownloading] = useState(false);

  if (!item) return null;

  const warga = item.warga || {};
  let isi = item.isi_permohonan || {};
  if (typeof isi === 'string') {
    try {
      isi = JSON.parse(isi);
    } catch {
      isi = { keterangan: isi };
    }
  }
  if (!isi || typeof isi !== 'object') {
    isi = {};
  }

  const dataSurat = (isi.data_surat && typeof isi.data_surat === 'object') ? isi.data_surat : {};
  const jenisSurat = String(item.jenis_surat || 'SURAT KETERANGAN');
  const nomorSurat = item.nomor_surat || '470/...../DESA/2026';
  const tanggalSurat = item.updated_at || item.created_at || new Date().toISOString();
  const tanggalFormatted = formatTanggalIndo(tanggalSurat);

  const nama = warga.nama || dataSurat.nama || dataSurat.nama_lengkap || item.nik || '-';
  const nik = item.nik || warga.nik || dataSurat.nik || '-';

  // Tempat, Tgl Lahir dengan fallback cerdas
  const tempatLahir = warga.tempat_lahir || dataSurat.tempat_lahir || '';
  const rawTglLahir = warga.tanggal_lahir || dataSurat.tanggal_lahir || dataSurat.tgl_lahir || '';
  const tglLahirFormatted = formatTanggalIndo(rawTglLahir);

  let wargaTtl = '-';
  if (tempatLahir && tglLahirFormatted) {
    wargaTtl = `${tempatLahir}, ${tglLahirFormatted}`;
  } else if (tempatLahir) {
    wargaTtl = tempatLahir;
  } else if (tglLahirFormatted) {
    wargaTtl = tglLahirFormatted;
  }

  let jenisKelamin = warga.jenis_kelamin || dataSurat.jenis_kelamin || dataSurat.jk || '-';
  if (jenisKelamin === 'L' || jenisKelamin === 'Laki-laki') jenisKelamin = 'Laki-laki';
  if (jenisKelamin === 'P' || jenisKelamin === 'Perempuan') jenisKelamin = 'Perempuan';

  const agama = warga.agama || dataSurat.agama || 'Islam';
  const statusPerkawinan = warga.status || dataSurat.status || dataSurat.status_perkawinan || '-';
  const pekerjaan = warga.pekerjaan || dataSurat.pekerjaan || '-';
  const alamat = warga.alamat || dataSurat.alamat || 'Desa Sendangrejo RT. 001 RW. 001 Kec. Dander Kab. Bojonegoro';
  const kewarganegaraan = dataSurat.kewarganegaraan || 'Indonesia (WNI)';
  const keperluan = isi.keterangan || dataSurat.keperluan || item.keterangan || '';

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const safeNomor = (item.nomor_surat || `surat_${item.id}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const endpoint = item.arsip?.id
        ? `/arsip/${item.arsip.id}/unduh`
        : `/permohonan/${item.id}/download`;

      await downloadAndOpenFile(
        endpoint,
        `Surat_${safeNomor}.pdf`,
        `Dokumen Resmi ${item.jenis_surat}`
      );
    } catch (err) {
      // Error sudah ditangani di downloadAndOpenFile
    } finally {
      setDownloading(false);
    }
  };

  // Switch template persis PermohonanPdfService di Web
  const isSkck = jenisSurat.includes('Catatan Kepolisian') || jenisSurat.includes('SKCK');
  const isDomisili = jenisSurat.includes('Domisili');
  const isUsaha = jenisSurat.includes('Usaha');
  const isBelumMenikah = jenisSurat.includes('Belum Menikah');
  const isTidakMampu = jenisSurat.includes('Tidak Mampu');
  const isKelahiran = jenisSurat.includes('Kelahiran');
  const isKematian = jenisSurat.includes('Kematian');
  const isPenghasilan = jenisSurat.includes('Penghasilan');

  const renderSuratContent = () => {
    if (isSkck) {
      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN CATATAN KEPOLISIAN</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Lengkap" value={nama} bold />
            <InfoRow label="Tempat, Tgl Lahir" value={wargaTtl} />
            <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
            <InfoRow label="Status Perkawinan" value={statusPerkawinan} />
            <InfoRow label="Kewarganegaraan" value={kewarganegaraan} />
            <InfoRow label="Agama" value={agama} />
            <InfoRow label="Pekerjaan" value={pekerjaan} />
            <InfoRow label="Alamat" value={alamat} />
            <InfoRow label="Nama Ayah Kandung" value={dataSurat.nama_ayah || '-'} />
            <InfoRow label="Pekerjaan Ayah" value={dataSurat.pekerjaan_ayah || '-'} />
            <InfoRow label="Nama Ibu Kandung" value={dataSurat.nama_ibu || '-'} />
            <InfoRow label="Pekerjaan Ibu" value={dataSurat.pekerjaan_ibu || '-'} />
          </View>

          <Text style={styles.paragraf}>
            Setelah diadakan penelitian selama bertempat tinggal di Desa Sendangrejo Kec. Dander Kab. Bojonegoro, dapat dinyatakan bahwa yang bersangkutan:
          </Text>

          <View style={styles.listContainer}>
            <View style={styles.listItem}>
              <Text style={styles.listNum}>1.</Text>
              <Text style={styles.listText}>Berkelakuan baik dan tidak pernah terlibat minuman keras/alkohol atau narkoba.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listNum}>2.</Text>
              <Text style={styles.listText}>Tidak pernah menjadi anggota/penyokong/penghimpunan parpol yang dilarang oleh pemerintah.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listNum}>3.</Text>
              <Text style={styles.listText}>Belum pernah tersangkut tindak pidana atau dihukum.</Text>
            </View>
          </View>

          <Text style={styles.paragraf}>
            Surat keterangan ini dibuat untuk memperoleh SKCK dipergunakan untuk:{' '}
            <Text style={{ fontWeight: '700' }}>
              {keperluan || 'Melengkapi persyaratan administrasi'}
            </Text>.
          </Text>

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isDomisili) {
      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN DOMISILI</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan dengan sebenarnya bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Lengkap" value={nama} bold />
            <InfoRow label="NIK" value={nik} />
            <InfoRow label="Tempat, Tgl Lahir" value={wargaTtl} />
            <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
            <InfoRow label="Agama" value={agama} />
            <InfoRow label="Kewarganegaraan" value={kewarganegaraan} />
            <InfoRow label="Pekerjaan" value={pekerjaan} />
            <InfoRow label="Alamat KTP" value={alamat} />
          </View>

          <Text style={styles.paragraf}>
            <Text style={{ fontWeight: '700' }}>Keterangan:</Text> Orang tersebut di atas adalah benar-benar berdomisili di {alamat} Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro.
          </Text>

          {keperluan ? (
            <Text style={styles.paragraf}>
              Surat keterangan domisili ini dibuat untuk keperluan:{' '}
              <Text style={{ fontWeight: '700' }}>{keperluan}</Text>.
            </Text>
          ) : null}

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat dengan sebenar-benarnya dan untuk dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isUsaha) {
      const namaUsaha = dataSurat.nama_usaha || '-';
      const jenisUsaha = dataSurat.jenis_usaha || 'Perdagangan / Jasa';
      const alamatUsaha = dataSurat.alamat_usaha || alamat;
      const lamaUsaha = dataSurat.lama_usaha ? `, Berjalan: ${dataSurat.lama_usaha}` : '';

      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN USAHA</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan dengan sebenarnya bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Lengkap" value={nama} bold />
            <InfoRow label="NIK" value={nik} />
            <InfoRow label="Tempat, Tgl Lahir" value={wargaTtl} />
            <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
            <InfoRow label="Agama" value={agama} />
            <InfoRow label="Status Perkawinan" value={statusPerkawinan} />
            <InfoRow label="Alamat Tinggal" value={alamat} />
          </View>

          <Text style={styles.paragraf}>
            Orang tersebut benar-benar berdomisili di {alamat} dan benar-benar memiliki usaha{' '}
            <Text style={{ fontWeight: '700' }}>{namaUsaha}</Text> (Bidang/Jenis: {jenisUsaha}{lamaUsaha}) yang berlokasi di {alamatUsaha}.
          </Text>

          <Text style={styles.paragraf}>
            Maksud Surat Keterangan ini untuk melengkapi berkas:{' '}
            <Text style={{ fontWeight: '700' }}>
              {keperluan || 'Pengajuan permodalan / administrasi usaha'}
            </Text>.
          </Text>

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isBelumMenikah) {
      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN BELUM MENIKAH</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan dengan sebenarnya bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Lengkap" value={nama} bold />
            <InfoRow label="NIK" value={nik} />
            <InfoRow label="Tempat, Tgl Lahir" value={wargaTtl} />
            <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
            <InfoRow label="Agama" value={agama} />
            <InfoRow label="Status Perkawinan" value="Belum Menikah" bold />
            <InfoRow label="Pekerjaan" value={pekerjaan} />
            <InfoRow label="Alamat" value={alamat} />
          </View>

          <Text style={styles.paragraf}>
            Orang tersebut di atas benar-benar Penduduk Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro, dan yang bersangkutan sampai saat surat ini diterbitkan benar-benar belum pernah menikah (jejaka / perawan).
          </Text>

          <Text style={styles.paragraf}>
            Maksud keterangan ini untuk melengkapi berkas persyaratan:{' '}
            <Text style={{ fontWeight: '700' }}>
              {keperluan || 'Persyaratan administrasi'}
            </Text>.
          </Text>

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isTidakMampu) {
      const tanggungan = dataSurat.jumlah_tanggungan
        ? ` dengan tanggungan keluarga sebanyak ${dataSurat.jumlah_tanggungan} orang`
        : '';
      const pekerjaanKeluarga = dataSurat.pekerjaan || pekerjaan;

      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN TIDAK MAMPU</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Lengkap" value={nama} bold />
            <InfoRow label="NIK" value={nik} />
            <InfoRow label="Tempat, Tgl Lahir" value={wargaTtl} />
            <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
            <InfoRow label="Status Perkawinan" value={statusPerkawinan} />
            <InfoRow label="Agama" value={agama} />
            <InfoRow label="Kewarganegaraan" value={kewarganegaraan} />
            <InfoRow label="Pekerjaan" value={pekerjaanKeluarga} />
            <InfoRow label="Alamat" value={alamat} />
          </View>

          <Text style={styles.paragraf}>
            Orang tersebut di atas benar-benar penduduk Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro, dan berdasarkan pendataan keluarga yang bersangkutan benar-benar tergolong{' '}
            <Text style={{ fontWeight: '700' }}>Keluarga Tidak Mampu</Text>{tanggungan}.
          </Text>

          <Text style={styles.paragraf}>
            Maksud keterangan ini untuk melengkapi:{' '}
            <Text style={{ fontWeight: '700' }}>
              {keperluan || 'Permohonan bantuan / beasiswa / keringanan biaya'}
            </Text>.
          </Text>

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isKelahiran) {
      const namaBayi = dataSurat.nama_bayi || '-';
      const jkBayi = dataSurat.jenis_kelamin || '-';
      const tglLahirBayi = formatTanggalIndo(dataSurat.tanggal_lahir) || '-';

      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN KELAHIRAN</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Pemerintah Desa Sendangrejo menerangkan bahwa telah lahir seorang bayi:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Bayi" value={namaBayi} bold />
            <InfoRow label="Jenis Kelamin" value={jkBayi} />
            <InfoRow label="Tanggal Lahir" value={tglLahirBayi} />
            <InfoRow label="Jenis Kelahiran" value="Perkawinan Sah" />
            <InfoRow label="Nama Ayah" value={dataSurat.nama_ayah || '-'} />
            <InfoRow label="Nama Ibu" value={dataSurat.nama_ibu || '-'} />
            <InfoRow label="Alamat Orang Tua" value={alamat} />
          </View>

          <Text style={styles.paragraf}>
            Kelahiran tersebut adalah benar terjadi di wilayah Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro dan surat keterangan ini diterbitkan guna pengurusan Akta Kelahiran dan dokumen kependudukan lainnya.
          </Text>

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isKematian) {
      const namaAlmarhum = dataSurat.nama_almarhum || '-';
      const tglMeninggal = formatTanggalIndo(dataSurat.tanggal_meninggal) || '-';
      const hariMeninggal = formatHariIndo(dataSurat.tanggal_meninggal);
      const penyebab = dataSurat.penyebab || 'Sakit';

      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN KEMATIAN</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini kami Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan dengan sesungguhnya bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Almarhum" value={namaAlmarhum} bold />
            <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
            <InfoRow label="Alamat Duka" value={alamat} />
          </View>

          <Text style={[styles.paragraf, { marginTop: 6, fontWeight: '600' }]}>
            Telah meninggal dunia pada:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Hari" value={hariMeninggal} />
            <InfoRow label="Tanggal" value={tglMeninggal} />
            <InfoRow label="Tempat Kematian" value="Sendangrejo, Dander, Bojonegoro" />
            <InfoRow label="Dikarenakan" value={penyebab} />
          </View>

          <Text style={styles.paragraf}>
            Demikian surat keterangan kematian ini Kami buat dengan sebenarnya dan dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    if (isPenghasilan) {
      const namaAyah = dataSurat.nama_ayah || '-';
      const penghasilanAyah = formatRupiah(dataSurat.penghasilan_ayah);
      const namaIbu = dataSurat.nama_ibu || '-';
      const penghasilanIbu = formatRupiah(dataSurat.penghasilan_ibu);

      return (
        <View>
          <View style={styles.judulWrap}>
            <Text style={styles.judulSurat}>SURAT KETERANGAN PENGHASILAN ORANG TUA</Text>
            <View style={styles.garisBawahJudul} />
            <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
          </View>

          <Text style={styles.paragraf}>
            Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan dengan sebenarnya bahwa:
          </Text>

          <View style={styles.tabelIdentitas}>
            <InfoRow label="Nama Ayah" value={namaAyah} />
            <InfoRow label="Penghasilan Ayah" value={`${penghasilanAyah} / Bulan`} />
            <InfoRow label="Nama Ibu" value={namaIbu} />
            <InfoRow label="Penghasilan Ibu" value={`${penghasilanIbu} / Bulan`} />
            <InfoRow label="Nama Anak / Pemohon" value={nama} bold />
            <InfoRow label="NIK Anak" value={nik} />
            <InfoRow label="Alamat Tinggal" value={alamat} />
          </View>

          <Text style={styles.paragraf}>
            Orang tersebut di atas adalah benar-benar Penduduk Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro. Surat keterangan penghasilan orang tua ini dibuat untuk melengkapi berkas persyaratan:{' '}
            <Text style={{ fontWeight: '700' }}>
              {keperluan || 'Pendaftaran pendidikan / permohonan beasiswa'}
            </Text>.
          </Text>

          <Text style={styles.paragraf}>
            Demikian surat keterangan ini dibuat agar dapat dipergunakan sebagaimana mestinya.
          </Text>
        </View>
      );
    }

    // Default Generic Sendangrejo Letter
    const customFields = Object.entries(dataSurat).filter(
      ([k, v]) => !IGNORED_DATA_KEYS.includes(k.toLowerCase()) && v && typeof v !== 'object'
    );

    return (
      <View>
        <View style={styles.judulWrap}>
          <Text style={styles.judulSurat}>{jenisSurat.toUpperCase()}</Text>
          <View style={styles.garisBawahJudul} />
          <Text style={styles.nomorSuratText}>Nomor : {nomorSurat}</Text>
        </View>

        <Text style={styles.paragraf}>
          Yang bertanda tangan di bawah ini Kepala Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro menerangkan dengan sebenarnya bahwa:
        </Text>

        <View style={styles.tabelIdentitas}>
          <InfoRow label="Nama Lengkap" value={nama} bold />
          <InfoRow label="NIK" value={nik} />
          <InfoRow label="Tempat, Tgl Lahir" value={wargaTtl} />
          <InfoRow label="Jenis Kelamin" value={jenisKelamin} />
          <InfoRow label="Agama" value={agama} />
          <InfoRow label="Pekerjaan" value={pekerjaan} />
          <InfoRow label="Alamat" value={alamat} />

          {/* Dynamic custom fields excluding identity keys */}
          {customFields.map(([k, v]) => {
            const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return <InfoRow key={k} label={label} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />;
          })}
        </View>

        <Text style={styles.paragraf}>
          Orang tersebut di atas adalah benar-benar warga yang bertempat tinggal di Desa Sendangrejo Kecamatan Dander Kabupaten Bojonegoro.
        </Text>

        {keperluan ? (
          <View style={styles.keperluanBox}>
            <Text style={styles.keperluanText}>
              Surat keterangan ini diterbitkan untuk keperluan:{' '}
              <Text style={{ fontWeight: '700' }}>{keperluan}</Text>
            </Text>
          </View>
        ) : null}

        <Text style={styles.paragraf}>
          Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Bar Modal */}
          <View style={styles.topModalBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="document-text-outline" size={20} color="#1b7480" />
              <Text style={styles.topModalTitle}>Pratinjau Surat Jadi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Kertas Surat (Lembar Resmi) */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.paperSheet}>
              {/* Kop Surat Resmi persis Web / PermohonanPdfService */}
              <View style={styles.kopSurat}>
                <Image
                  source={require('../../assets/logo-bojonegoro.png')}
                  style={styles.kopLogoImg}
                  resizeMode="contain"
                />
                <View style={styles.kopTextWrap}>
                  <Text style={styles.kopInstansi1}>PEMERINTAH KABUPATEN BOJONEGORO</Text>
                  <Text style={styles.kopInstansi2}>KECAMATAN DANDER</Text>
                  <Text style={styles.kopInstansi3}>KANTOR DESA SENDANGREJO</Text>
                  <Text
                    style={styles.kopAlamat}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    Jalan Raya Balai Desa No. 177 Sendangrejo - Dander - Bojonegoro 62171
                  </Text>
                </View>
              </View>
              <View style={styles.kopDividerDouble} />

              {/* Isi Surat Sesuai Jenis */}
              {renderSuratContent()}

              {/* Tanda Tangan & Stempel Resmi Kepala Desa persis Web */}
              <View style={styles.ttdContainer}>
                <View style={styles.ttdBox}>
                  <Text style={styles.ttdTanggal}>Sendangrejo, {tanggalFormatted}</Text>
                  <Text style={styles.ttdJabatan}>KEPALA DESA SENDANGREJO</Text>

                  {/* Gambar TTD & Stempel Asli Kepala Desa persis Web */}
                  <View style={styles.stempelArea}>
                    <Image
                      source={require('../../assets/ttd-kepala-desa.png')}
                      style={styles.ttdImage}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={[styles.ttdNama, styles.underlineText]}>
                    ( KEPALA DESA SENDANGREJO )
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action: Tombol Unduh PDF */}
          <View style={styles.footerAction}>
            <TouchableOpacity
              style={styles.unduhPdfBtn}
              onPress={handleDownloadPdf}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download" size={18} color="#fff" />
                  <Text style={styles.unduhPdfBtnText}>Unduh Dokumen PDF Resmi (.pdf)</Text>
                </>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  topModalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafcfc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#13545d',
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#eceff1',
    padding: 12,
  },
  paperSheet: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  kopLogoImg: {
    width: 44,
    height: 52,
  },
  kopSurat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  kopTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kopInstansi1: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.3,
  },
  kopInstansi2: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#222',
    letterSpacing: 0.3,
  },
  kopInstansi3: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#111',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  kopAlamat: {
    fontSize: 7.8,
    color: '#555',
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  kopDividerDouble: {
    height: 4,
    borderTopWidth: 2.5,
    borderBottomWidth: 0.8,
    borderColor: '#000',
    marginTop: 4,
    marginBottom: 14,
  },
  judulWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  judulSurat: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  garisBawahJudul: {
    width: 140,
    height: 1.5,
    backgroundColor: '#111',
    marginVertical: 2,
  },
  nomorSuratText: {
    fontSize: 10.5,
    color: '#444',
  },
  paragraf: {
    fontSize: 11,
    color: '#333',
    lineHeight: 17,
    textAlign: 'justify',
    marginBottom: 8,
  },
  tabelIdentitas: {
    marginVertical: 6,
    marginLeft: 4,
    gap: 3.5,
  },
  rowIdentitas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  labelKolom: {
    fontSize: 10.8,
    color: '#444',
  },
  titikDua: {
    width: 12,
    fontSize: 10.8,
    color: '#444',
  },
  isiKolom: {
    flex: 1,
    fontSize: 10.8,
    color: '#222',
  },
  listContainer: {
    marginVertical: 6,
    marginLeft: 8,
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  listNum: {
    fontSize: 11,
    color: '#333',
    lineHeight: 17,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: 11,
    color: '#333',
    lineHeight: 17,
  },
  keperluanBox: {
    backgroundColor: '#f6fbfb',
    borderLeftWidth: 3,
    borderLeftColor: '#1b7480',
    padding: 9,
    borderRadius: 4,
    marginBottom: 8,
  },
  keperluanText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#1b7480',
    fontWeight: '600',
  },
  ttdContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    paddingRight: 6,
  },
  ttdBox: {
    alignItems: 'center',
    minWidth: 160,
  },
  ttdTanggal: {
    fontSize: 10.5,
    color: '#333',
  },
  ttdJabatan: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#222',
    marginTop: 2,
  },
  stempelArea: {
    width: 175,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  ttdImage: {
    width: 170,
    height: 75,
  },
  ttdNama: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#000',
    marginTop: 2,
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  footerAction: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  unduhPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a9fad',
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: '#2a9fad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unduhPdfBtnText: {
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
