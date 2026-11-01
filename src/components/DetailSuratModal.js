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
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAndOpenFile } from '../utils/fileDownloader';
import { getCurrentBaseUrl, getAuthToken } from '../config/api';
import PreviewSuratModal from './PreviewSuratModal';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatTanggalIndo = (val) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return `${d.getDate()} ${NAMA_BULAN[d.getMonth()] || ''} ${d.getFullYear()}`;
  } catch {
    return String(val);
  }
};

export default function DetailSuratModal({
  visible,
  onClose,
  item,
  role,
  type = 'permohonan', // 'permohonan' | 'surat_masuk' | 'surat_keluar' | 'arsip'
  onUnduh,
  onApprove,
  onReject,
  onMintaRevisi,
  onProses,
  onArsipkan,
  onDisposisiKades,
  onBuatDisposisiPetugas,
  loadingAction,
}) {
  // State untuk input alasan tolak / revisi
  const [modalAlasanVisible, setModalAlasanVisible] = useState(false);
  const [modalPreviewVisible, setModalPreviewVisible] = useState(false);
  const [alasanMode, setAlasanMode] = useState(''); // 'tolak' | 'revisi' | 'disposisi'
  const [alasanText, setAlasanText] = useState('');
  const [downloadingDoc, setDownloadingDoc] = useState(null);

  // State untuk pratinjau dokumen (KTP / KK) di dalam aplikasi
  const [docPreviewModal, setDocPreviewModal] = useState(null);
  const [docPreviewLoading, setDocPreviewLoading] = useState(false);
  const [docPreviewError, setDocPreviewError] = useState(false);

  if (!item) return null;

  // Buka pratinjau dokumen pendukung warga di dalam aplikasi
  const handlePreviewDokumenWarga = async (key, label, defaultFilename) => {
    try {
      setDownloadingDoc(key);
      const token = await getAuthToken();
      const baseUrl = getCurrentBaseUrl();
      const fileKeyPath = (fileUpload && fileUpload[key]) || (dokumenWarga && dokumenWarga[key]) || '';
      const isPdf = typeof fileKeyPath === 'string' && fileKeyPath.toLowerCase().endsWith('.pdf');
      const uri = `${baseUrl}/permohonan/${item.id}/dokumen/${encodeURIComponent(key)}?token=${encodeURIComponent(token || '')}`;
      const fname = defaultFilename || `Dokumen_${key}_${item.id}.${isPdf ? 'pdf' : 'jpg'}`;

      setDocPreviewLoading(true);
      setDocPreviewError(false);
      setDocPreviewModal({
        visible: true,
        key,
        title: label || `Dokumen ${key.toUpperCase()}`,
        uri,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        isPdf,
        filename: fname,
      });
    } catch (err) {
      Alert.alert('Gagal Membuka Dokumen', err.message || 'Tidak dapat memuat dokumen.');
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Parse isi_permohonan jika berupa JSON string atau object
  let isi = item.isi_permohonan || {};
  if (typeof isi === 'string') {
    try {
      isi = JSON.parse(isi);
    } catch {
      isi = { keterangan: isi };
    }
  }

  const warga = item.warga || {};
  const keterangan = isi.keterangan || item.keterangan || item.isi_ringkas || '-';
  const dokumenWarga = isi.dokumen || {};
  const fileUpload = item.file_upload || {};

  // Status badge styling
  const getStatusBadge = () => {
    const s = (item.status || '').toLowerCase();
    if (s === 'selesai' || s === 'disetujui') {
      return { label: 'Disetujui / Selesai', bg: '#eaf8ef', text: '#1d6b3d', icon: 'checkmark-circle' };
    }
    if (s === 'diproses') {
      return { label: 'Sedang Diproses Kades', bg: '#fff5dc', text: '#b77700', icon: 'time' };
    }
    if (s === 'revisi') {
      return { label: 'Perlu Revisi', bg: '#fef3e2', text: '#d97706', icon: 'alert-circle' };
    }
    if (s === 'ditolak') {
      return { label: 'Ditolak', bg: '#fdebec', text: '#b3261e', icon: 'close-circle' };
    }
    return { label: 'Menunggu Verifikasi', bg: '#f0f1f2', text: '#555', icon: 'hourglass-outline' };
  };

  const badge = getStatusBadge();

  // Buka dokumen pendukung warga
  const handleOpenDokumenWarga = async (key, filename) => {
    try {
      setDownloadingDoc(key);
      await downloadAndOpenFile(
        `/permohonan/${item.id}/dokumen/${encodeURIComponent(key)}`,
        filename || `Dokumen_${key}_${item.id}.jpg`,
        `Dokumen ${key.toUpperCase()}`
      );
    } catch (err) {
      // Error sudah ditangani di downloadAndOpenFile
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Buka file surat masuk
  const handleOpenFileSuratMasuk = async () => {
    try {
      setDownloadingDoc('surat_masuk');
      await downloadAndOpenFile(
        `/surat-masuk/${item.id}/file`,
        `SuratMasuk_${item.no_agenda || item.id}.pdf`,
        'Dokumen Surat Masuk'
      );
    } catch (err) {
      // Handled
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Buka lampiran surat keluar
  const handleOpenLampiranSuratKeluar = async () => {
    try {
      setDownloadingDoc('surat_keluar');
      await downloadAndOpenFile(
        `/surat-keluar/${item.id}/lampiran`,
        `Lampiran_Keluar_${item.id}.pdf`,
        'Lampiran Surat Keluar'
      );
    } catch (err) {
      // Handled
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Eksekusi kirim alasan / catatan
  const handleKirimAlasan = () => {
    if (!alasanText.trim()) {
      Alert.alert('Perhatian', 'Catatan/alasan tidak boleh kosong.');
      return;
    }

    if (alasanMode === 'revisi' && onMintaRevisi) {
      onMintaRevisi(item.id, alasanText.trim());
    } else if (alasanMode === 'tolak' && onReject) {
      onReject(item.id, alasanText.trim());
    } else if (alasanMode === 'disposisi' && onBuatDisposisiPetugas) {
      onBuatDisposisiPetugas(item.id, alasanText.trim());
    }

    setModalAlasanVisible(false);
    setAlasanText('');
  };

  const bukaModalAlasan = (mode) => {
    setAlasanMode(mode);
    setAlasanText('');
    setModalAlasanVisible(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.title}>
                  {item.jenis_surat || item.perihal || item.nomor_surat || 'Detail Surat'}
                </Text>
                <View style={[styles.badge, { backgroundColor: badge.bg, marginTop: 4 }]}>
                  <Ionicons name={badge.icon} size={12} color={badge.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Body */}
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* TAMPILAN KHUSUS PERMOHONAN WARGA */}
              {(type === 'permohonan' || item.jenis_surat) && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informasi Surat</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Nomor Surat:</Text>
                      <Text style={[styles.infoVal, { fontWeight: '700', color: '#13545d' }]}>
                        {item.nomor_surat || 'Belum di-generate'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal Pengajuan:</Text>
                      <Text style={styles.infoVal}>
                        {formatTanggalIndo(item.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Data Pemohon */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Pemohon (Warga)</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Nama Pemohon:</Text>
                      <Text style={styles.infoVal}>{warga.nama || item.nik || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>NIK:</Text>
                      <Text style={styles.infoVal}>{item.nik || warga.nik || '-'}</Text>
                    </View>
                    {warga.alamat && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Alamat:</Text>
                        <Text style={styles.infoVal}>
                          {warga.alamat} (RT {warga.rt || '-'} / RW {warga.rw || '-'})
                        </Text>
                      </View>
                    )}
                    {warga.pekerjaan && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Pekerjaan:</Text>
                        <Text style={styles.infoVal}>{warga.pekerjaan}</Text>
                      </View>
                    )}
                  </View>

                  {/* Keperluan */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Keperluan / Keterangan</Text>
                    <View style={styles.keteranganBox}>
                      <Text style={styles.keteranganText}>{keterangan}</Text>
                    </View>
                  </View>

                  {/* DOKUMEN PENDUKUNG (KTP / KK) */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bukti Dokumen Pendukung</Text>
                    <View style={styles.docList}>
                      {/* KTP */}
                      <View style={styles.docRow}>
                        <View style={styles.docIconWrap}>
                          <Ionicons name="card-outline" size={20} color="#1b7480" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docName}>KTP (Kartu Tanda Penduduk)</Text>
                          <Text style={styles.docSub}>
                            {dokumenWarga.ktp || fileUpload.ktp ? 'Dokumen terlampir' : 'Tidak ada dokumen'}
                          </Text>
                        </View>
                        {(dokumenWarga.ktp || fileUpload.ktp) && (
                          <TouchableOpacity
                            style={styles.docActionBtn}
                            onPress={() => handlePreviewDokumenWarga('ktp', 'KTP (Kartu Tanda Penduduk)', `KTP_${item.nik || item.id}.jpg`)}
                            disabled={downloadingDoc === 'ktp'}
                          >
                            {downloadingDoc === 'ktp' ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="eye-outline" size={14} color="#fff" />
                                <Text style={styles.docActionText}>Lihat KTP</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* KK */}
                      <View style={[styles.docRow, { marginTop: 8 }]}>
                        <View style={styles.docIconWrap}>
                          <Ionicons name="people-outline" size={20} color="#1b7480" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docName}>KK (Kartu Keluarga)</Text>
                          <Text style={styles.docSub}>
                            {dokumenWarga.kk || fileUpload.kk ? 'Dokumen terlampir' : 'Tidak ada dokumen'}
                          </Text>
                        </View>
                        {(dokumenWarga.kk || fileUpload.kk) && (
                          <TouchableOpacity
                            style={styles.docActionBtn}
                            onPress={() => handlePreviewDokumenWarga('kk', 'KK (Kartu Keluarga)', `KK_${item.nik || item.id}.jpg`)}
                            disabled={downloadingDoc === 'kk'}
                          >
                            {downloadingDoc === 'kk' ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="eye-outline" size={14} color="#fff" />
                                <Text style={styles.docActionText}>Lihat KK</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Catatan Petugas / Penolakan */}
                  {(item.catatan_revisi || item.keterangan || item.catatan_penolakan) && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: '#b3261e' }]}>Catatan Petugas / Kades</Text>
                      <View style={styles.catatanBox}>
                        <Text style={styles.catatanText}>
                          {item.catatan_revisi || item.catatan_penolakan || item.keterangan}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* TAMPILAN KHUSUS SURAT MASUK */}
              {type === 'surat_masuk' && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detail Surat Masuk</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>No. Agenda:</Text>
                      <Text style={[styles.infoVal, { fontWeight: '700' }]}>{item.no_agenda || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>No. Surat Asal:</Text>
                      <Text style={styles.infoVal}>{item.no_surat_asal || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pengirim Eksternal:</Text>
                      <Text style={styles.infoVal}>{item.pengirim || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Perihal:</Text>
                      <Text style={styles.infoVal}>{item.perihal || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Sifat Surat:</Text>
                      <Text style={[styles.infoVal, { fontWeight: '600' }]}>{item.sifat_surat || 'Biasa'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal Surat:</Text>
                      <Text style={styles.infoVal}>{item.tanggal_surat || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal Diterima:</Text>
                      <Text style={styles.infoVal}>{item.tanggal_diterima || '-'}</Text>
                    </View>
                  </View>

                  {/* Dokumen Surat Masuk */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dokumen / Berkas Surat Masuk</Text>
                    {item.file_surat ? (
                      <TouchableOpacity
                        style={styles.unduhDokumenBtn}
                        onPress={handleOpenFileSuratMasuk}
                        disabled={downloadingDoc === 'surat_masuk'}
                      >
                        {downloadingDoc === 'surat_masuk' ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="document-text-outline" size={18} color="#fff" />
                            <Text style={styles.unduhDokumenText}>Buka Berkas Surat Masuk</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.emptyDocText}>Tidak ada file surat masuk yang dilampirkan.</Text>
                    )}
                  </View>

                  {/* Status Disposisi */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Status Disposisi Kepala Desa</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Instruksi Disposisi:</Text>
                      <Text style={styles.infoVal}>
                        {item.perlu_disposisi === null
                          ? 'Menunggu Keputusan Kades'
                          : item.perlu_disposisi
                          ? 'Perlu Disposisi ke Petugas'
                          : 'Tidak Perlu Disposisi (Langsung Arsip)'}
                      </Text>
                    </View>
                    {item.disposisi && (
                      <View style={[styles.keteranganBox, { marginTop: 8 }]}>
                        <Text style={[styles.infoLabel, { marginBottom: 4, fontWeight: '700' }]}>
                          Catatan Disposisi:
                        </Text>
                        <Text style={styles.keteranganText}>{item.disposisi.isi_disposisi}</Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* TAMPILAN KHUSUS SURAT KELUAR */}
              {type === 'surat_keluar' && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detail Surat Keluar</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>No. Surat:</Text>
                      <Text style={[styles.infoVal, { fontWeight: '700' }]}>{item.no_surat || 'Belum di-generate'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Perihal:</Text>
                      <Text style={styles.infoVal}>{item.perihal || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tujuan Penerima:</Text>
                      <Text style={styles.infoVal}>{item.tujuan || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal Surat:</Text>
                      <Text style={styles.infoVal}>{item.tanggal_surat || '-'}</Text>
                    </View>
                    {item.isi_ringkas && (
                      <View style={[styles.keteranganBox, { marginTop: 8 }]}>
                        <Text style={[styles.infoLabel, { marginBottom: 4, fontWeight: '700' }]}>
                          Isi Ringkas Surat:
                        </Text>
                        <Text style={styles.keteranganText}>{item.isi_ringkas}</Text>
                      </View>
                    )}
                  </View>

                  {/* Dokumen Lampiran Surat Keluar */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dokumen Pendukung / Lampiran Draf</Text>
                    {item.file_surat ? (
                      <TouchableOpacity
                        style={styles.unduhDokumenBtn}
                        onPress={handleOpenLampiranSuratKeluar}
                        disabled={downloadingDoc === 'surat_keluar'}
                      >
                        {downloadingDoc === 'surat_keluar' ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="attach-outline" size={18} color="#fff" />
                            <Text style={styles.unduhDokumenText}>Buka Lampiran Draf Surat</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.emptyDocText}>Tidak ada file lampiran.</Text>
                    )}
                  </View>
                </>
              )}

              {/* TAMPILAN KHUSUS ARSIP */}
              {type === 'arsip' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Informasi Arsip Desa</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nomor Surat:</Text>
                    <Text style={[styles.infoVal, { fontWeight: '700' }]}>{item.nomor_surat || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tanggal Selesai/Arsip:</Text>
                    <Text style={styles.infoVal}>{item.tanggal_selesai || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Perihal / Asal:</Text>
                    <Text style={styles.infoVal}>
                      {item.permohonan?.jenis_surat ||
                        item.surat_keluar?.perihal ||
                        item.surat_masuk?.perihal ||
                        'Dokumen Arsip'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer Actions Sesuai Role & Alur Persuratan */}
            <View style={styles.footer}>
              {/* Pratinjau Surat Jadi (Lihat Fisik Surat Dulu) */}
              {(item.status === 'selesai' || item.status === 'disetujui' || item.nomor_surat) && (type === 'permohonan' || item.jenis_surat) && (
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => setModalPreviewVisible(true)}
                >
                  <Ionicons name="eye-outline" size={16} color="#1b7480" />
                  <Text style={styles.previewBtnText}>Lihat Surat Jadi (Pratinjau Fisik)</Text>
                </TouchableOpacity>
              )}

              {/* Unduh Surat Jadi (Warga / Arsip) */}
              {onUnduh && (item.status === 'selesai' || item.status === 'disetujui' || item.nomor_surat || type === 'arsip') && (
                <TouchableOpacity
                  style={styles.unduhBtn}
                  onPress={() => onUnduh(item)}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={16} color="#fff" />
                      <Text style={styles.unduhBtnText}>Unduh Surat Resmi (.PDF)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Aksi Petugas pada Permohonan (Proses, Minta Revisi, Tolak, Arsipkan) */}
              {role === 'petugas' && (type === 'permohonan' || item.jenis_surat) && (
                <>
                  {(item.status === 'diajukan' || item.status === 'menunggu') && (
                    <View style={styles.staffActionRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => bukaModalAlasan('tolak')}
                        disabled={loadingAction}
                      >
                        <Ionicons name="close" size={15} color="#b3261e" />
                        <Text style={styles.rejectBtnText}>Tolak</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.revisiBtn}
                        onPress={() => bukaModalAlasan('revisi')}
                        disabled={loadingAction}
                      >
                        <Ionicons name="refresh" size={15} color="#d97706" />
                        <Text style={styles.revisiBtnText}>Revisi</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => onProses && onProses(item.id)}
                        disabled={loadingAction}
                      >
                        <Ionicons name="arrow-forward" size={15} color="#fff" />
                        <Text style={styles.approveBtnText}>Proses</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.status === 'disetujui' && onArsipkan && (
                    <TouchableOpacity
                      style={styles.arsipkanBtn}
                      onPress={() => onArsipkan(item.id)}
                      disabled={loadingAction}
                    >
                      <Ionicons name="archive-outline" size={16} color="#fff" />
                      <Text style={styles.arsipkanBtnText}>Arsipkan Surat ke Arsip Desa</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Aksi Kepala Desa pada Permohonan (Setujui, Tolak) */}
              {role === 'kepala_desa' && (type === 'permohonan' || item.jenis_surat) && item.status === 'diproses' && (
                <View style={styles.staffActionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => bukaModalAlasan('tolak')}
                    disabled={loadingAction}
                  >
                    <Ionicons name="close" size={16} color="#b3261e" />
                    <Text style={styles.rejectBtnText}>Tolak Surat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => onApprove && onApprove(item)}
                    disabled={loadingAction}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.approveBtnText}>Setujui Surat</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Aksi Kepala Desa pada Surat Masuk (Disposisi) */}
              {role === 'kepala_desa' && type === 'surat_masuk' && item.perlu_disposisi === null && onDisposisiKades && (
                <View style={styles.staffActionRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { backgroundColor: '#f0f4f4' }]}
                    onPress={() => onDisposisiKades(item.id, false)}
                    disabled={loadingAction}
                  >
                    <Text style={[styles.rejectBtnText, { color: '#555' }]}>Tanpa Disposisi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => onDisposisiKades(item.id, true)}
                    disabled={loadingAction}
                  >
                    <Ionicons name="git-branch-outline" size={16} color="#fff" />
                    <Text style={styles.approveBtnText}>Perlu Disposisi</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Aksi Petugas pada Surat Masuk (Catat Disposisi / Arsipkan) */}
              {role === 'petugas' && type === 'surat_masuk' && item.perlu_disposisi === true && (
                <>
                  {!item.disposisi && onBuatDisposisiPetugas && (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => bukaModalAlasan('disposisi')}
                      disabled={loadingAction}
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.approveBtnText}>Catat Isi Disposisi</Text>
                    </TouchableOpacity>
                  )}

                  {item.disposisi && onArsipkan && (
                    <TouchableOpacity
                      style={styles.arsipkanBtn}
                      onPress={() => onArsipkan(item.id)}
                      disabled={loadingAction}
                    >
                      <Ionicons name="archive-outline" size={16} color="#fff" />
                      <Text style={styles.arsipkanBtnText}>Arsipkan Surat Masuk</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Input Alasan (Tolak / Minta Revisi / Catat Disposisi) */}
      <Modal visible={modalAlasanVisible} transparent animationType="fade">
        <View style={styles.overlayCenter}>
          <View style={styles.alasanCard}>
            <View style={styles.alasanHeader}>
              <Text style={styles.alasanTitle}>
                {alasanMode === 'revisi'
                  ? 'Catatan Permintaan Revisi'
                  : alasanMode === 'disposisi'
                  ? 'Isi Instruksi Disposisi'
                  : 'Alasan Penolakan Surat'}
              </Text>
              <TouchableOpacity onPress={() => setModalAlasanVisible(false)}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.alasanHint}>
              {alasanMode === 'revisi'
                ? 'Jelaskan berkas atau data apa yang harus diperbaiki oleh warga:'
                : alasanMode === 'disposisi'
                ? 'Tuliskan catatan disposisi dan instruksi pelaksanaan untuk petugas:'
                : 'Jelaskan alasan permohonan surat ini ditolak:'}
            </Text>

            <TextInput
              style={styles.alasanInput}
              multiline
              numberOfLines={4}
              placeholder="Ketik catatan di sini..."
              value={alasanText}
              onChangeText={setAlasanText}
            />

            <View style={styles.alasanActionRow}>
              <TouchableOpacity
                style={styles.alasanBatalBtn}
                onPress={() => setModalAlasanVisible(false)}
              >
                <Text style={styles.alasanBatalText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.alasanKirimBtn,
                  alasanMode === 'tolak' && { backgroundColor: '#b3261e' },
                  alasanMode === 'revisi' && { backgroundColor: '#d97706' },
                ]}
                onPress={handleKirimAlasan}
              >
                <Text style={styles.alasanKirimText}>
                  {alasanMode === 'disposisi' ? 'Simpan Disposisi' : 'Kirim Catatan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal Pratinjau Surat Jadi */}
      <PreviewSuratModal
        visible={modalPreviewVisible}
        item={item}
        onClose={() => setModalPreviewVisible(false)}
      />

      {/* Modal Pratinjau Dokumen (KTP / KK) di dalam aplikasi */}
      <Modal
        visible={Boolean(docPreviewModal?.visible)}
        transparent
        animationType="fade"
        onRequestClose={() => setDocPreviewModal(null)}
      >
        <View style={styles.overlayCenter}>
          <View style={styles.docModalCard}>
            {/* Header Modal */}
            <View style={styles.docModalHeader}>
              <View style={styles.docModalHeaderLeft}>
                <View style={styles.docModalIconWrap}>
                  <Ionicons
                    name={docPreviewModal?.key === 'ktp' ? 'card-outline' : 'people-outline'}
                    size={20}
                    color="#187682"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docModalTitle}>{docPreviewModal?.title || 'Pratinjau Dokumen'}</Text>
                  <Text style={styles.docModalSubtitle} numberOfLines={1}>
                    {docPreviewModal?.filename || 'Dokumen Persyaratan'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.docModalCloseBtn}
                onPress={() => setDocPreviewModal(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#55646d" />
              </TouchableOpacity>
            </View>

            {/* Body Dokumen */}
            <View style={styles.docModalBody}>
              {docPreviewModal?.isPdf ? (
                <View style={styles.docPdfBox}>
                  <View style={styles.docPdfIconBig}>
                    <Ionicons name="document-text" size={54} color="#b3261e" />
                  </View>
                  <Text style={styles.docPdfName}>{docPreviewModal?.filename}</Text>
                  <Text style={styles.docPdfHint}>Dokumen ini berformat PDF.</Text>
                  <TouchableOpacity
                    style={styles.docPdfActionBtn}
                    onPress={() => {
                      const key = docPreviewModal?.key;
                      const fname = docPreviewModal?.filename;
                      setDocPreviewModal(null);
                      handleOpenDokumenWarga(key, fname);
                    }}
                  >
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={styles.docPdfActionText}>Buka Berkas PDF</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.docImageContainer}>
                  {docPreviewLoading && (
                    <View style={styles.docLoadingWrap}>
                      <ActivityIndicator size="large" color="#187682" />
                      <Text style={styles.docLoadingText}>Memuat gambar dokumen...</Text>
                    </View>
                  )}
                  {docPreviewError ? (
                    <View style={styles.docErrorWrap}>
                      <Ionicons name="alert-circle-outline" size={44} color="#b3261e" />
                      <Text style={styles.docErrorTitle}>Gagal Menampilkan Gambar</Text>
                      <Text style={styles.docErrorSub}>
                        Format gambar tidak didukung atau berkas belum dapat dimuat.
                      </Text>
                      <TouchableOpacity
                        style={styles.docRetryBtn}
                        onPress={() => {
                          const key = docPreviewModal?.key;
                          const fname = docPreviewModal?.filename;
                          setDocPreviewModal(null);
                          handleOpenDokumenWarga(key, fname);
                        }}
                      >
                        <Ionicons name="download-outline" size={15} color="#fff" />
                        <Text style={styles.docRetryBtnText}>Unduh Berkas</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <ScrollView
                      style={{ flex: 1, width: '100%' }}
                      contentContainerStyle={styles.docImageScroll}
                      maximumZoomScale={3}
                      minimumZoomScale={1}
                      showsVerticalScrollIndicator={false}
                    >
                      <Image
                        source={{
                          uri: docPreviewModal?.uri,
                          headers: docPreviewModal?.headers,
                        }}
                        style={styles.docImage}
                        resizeMode="contain"
                        onLoadStart={() => setDocPreviewLoading(true)}
                        onLoadEnd={() => setDocPreviewLoading(false)}
                        onError={() => {
                          setDocPreviewLoading(false);
                          setDocPreviewError(true);
                        }}
                      />
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            {/* Footer Modal */}
            <View style={styles.docModalFooter}>
              <TouchableOpacity
                style={styles.docModalTutupBtn}
                onPress={() => setDocPreviewModal(null)}
              >
                <Text style={styles.docModalTutupText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#13545d',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: 14,
  },
  section: {
    marginBottom: 14,
    backgroundColor: '#fbfdfd',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eef2f3',
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1b7480',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoVal: {
    fontSize: 12,
    color: '#222',
    maxWidth: '65%',
    textAlign: 'right',
  },
  keteranganBox: {
    backgroundColor: '#f8fbfc',
    padding: 10,
    borderRadius: 8,
  },
  keteranganText: {
    fontSize: 12.5,
    color: '#444',
    lineHeight: 18,
  },
  catatanBox: {
    backgroundColor: '#fdebec',
    padding: 10,
    borderRadius: 8,
  },
  catatanText: {
    fontSize: 12,
    color: '#b3261e',
    lineHeight: 17,
  },
  docList: {
    gap: 8,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3ecee',
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eaf4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#13545d',
  },
  docSub: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  docActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2a9fad',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  docActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  unduhDokumenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a9fad',
    paddingVertical: 10,
    borderRadius: 8,
  },
  unduhDokumenText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  emptyDocText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eaf4f5',
    borderWidth: 1.5,
    borderColor: '#bce0e4',
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 8,
  },
  previewBtnText: {
    color: '#1b7480',
    fontSize: 12.5,
    fontWeight: '800',
  },
  unduhBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2a9fad',
    paddingVertical: 12,
    borderRadius: 10,
  },
  unduhBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  staffActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fdebec',
    paddingVertical: 11,
    borderRadius: 10,
  },
  rejectBtnText: {
    color: '#b3261e',
    fontSize: 12.5,
    fontWeight: '700',
  },
  revisiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff5dc',
    paddingVertical: 11,
    borderRadius: 10,
  },
  revisiBtnText: {
    color: '#b77700',
    fontSize: 12.5,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#2a9fad',
    paddingVertical: 11,
    borderRadius: 10,
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  arsipkanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25804a',
    paddingVertical: 11,
    borderRadius: 10,
  },
  arsipkanBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal Alasan
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  alasanCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
  },
  alasanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  alasanTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#13545d',
  },
  alasanHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 8,
  },
  alasanInput: {
    backgroundColor: '#f8fbfc',
    borderWidth: 1,
    borderColor: '#cce2e6',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  alasanActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  alasanBatalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  alasanBatalText: {
    color: '#666',
    fontSize: 12.5,
    fontWeight: '600',
  },
  alasanKirimBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#1b7480',
  },
  alasanKirimText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  // Pratinjau Dokumen Modal (KTP / KK)
  docModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    alignSelf: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  docModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5edee',
    backgroundColor: '#f8fbfc',
  },
  docModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  docModalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#e6f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#13545d',
  },
  docModalSubtitle: {
    fontSize: 11,
    color: '#6e8588',
    marginTop: 1,
  },
  docModalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#edf3f4',
  },
  docModalBody: {
    minHeight: 280,
    maxHeight: 460,
    backgroundColor: '#1a2327',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImageContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImageScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docImage: {
    width: '100%',
    height: 340,
  },
  docLoadingWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  docLoadingText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 8,
  },
  docErrorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  docErrorTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  docErrorSub: {
    color: '#a0b0b3',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  docRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1b7480',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  docRetryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  docPdfBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  docPdfIconBig: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fdebec',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  docPdfName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  docPdfHint: {
    color: '#a0b0b3',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 16,
  },
  docPdfActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1b7480',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  docPdfActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  docModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5edee',
    backgroundColor: '#ffffff',
  },
  docModalTutupBtn: {
    backgroundColor: '#187682',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  docModalTutupText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
});