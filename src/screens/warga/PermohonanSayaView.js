import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { SURAT_CONFIG } from '../../data/suratConfig';
import { apiFetch } from '../../config/api';


const NAMA_BULAN_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const formatTanggalSingkat = (val) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = d.getDate() < 10 ? '0' + d.getDate() : String(d.getDate());
    const mon = NAMA_BULAN_SHORT[d.getMonth()] || '';
    const yr = String(d.getFullYear());
    return day + ' ' + mon + ' ' + yr;
  } catch {
    return String(val);
  }
};

const FILTERS = [
  { value: 'semua', label: 'Semua' },
  { value: 'diajukan', label: 'Diajukan' },
  { value: 'revisi', label: 'Revisi' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
];

export default function PermohonanSayaView({
  permohonan = [],
  loading = false,
  onRefresh,
  onSelectDetail,
  onSelectPreview,
  onUnduhSurat,
  downloadingId,
  onNavigateAjukan,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('semua');

  // Modal Revisi
  const [revisiItem, setRevisiItem] = useState(null);
  const [isiRevisi, setIsiRevisi] = useState('');
  const [revisiData, setRevisiData] = useState({});
  const [revisiFiles, setRevisiFiles] = useState({});
  const [revisiLoading, setRevisiLoading] = useState(false);

  // 6 Statistik persis Web (PermohonanSaya.jsx)
  const stats = useMemo(() => {
    return {
      total: permohonan.length,
      diajukan: permohonan.filter(
        (d) => d.status === 'diajukan' || d.status === 'menunggu'
      ).length,
      proses: permohonan.filter((d) => d.status === 'diproses').length,
      revisi: permohonan.filter((d) => d.status === 'revisi').length,
      selesai: permohonan.filter(
        (d) => d.status === 'selesai' || d.status === 'disetujui'
      ).length,
      ditolak: permohonan.filter((d) => d.status === 'ditolak').length,
    };
  }, [permohonan]);

  // Filter list
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return permohonan.filter((d) => {
      const s = (d.status || 'diajukan').toLowerCase();
      let matchFilter = filter === 'semua';
      if (filter === 'diajukan') matchFilter = s === 'diajukan' || s === 'menunggu';
      else if (filter === 'revisi') matchFilter = s === 'revisi';
      else if (filter === 'diproses') matchFilter = s === 'diproses';
      else if (filter === 'selesai') matchFilter = s === 'selesai' || s === 'disetujui';
      else if (filter === 'ditolak') matchFilter = s === 'ditolak';

      const matchSearch =
        !q ||
        (d.jenis_surat && d.jenis_surat.toLowerCase().includes(q)) ||
        (d.nomor_surat && d.nomor_surat.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }, [permohonan, search, filter]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'selesai' || s === 'disetujui') {
      return { label: 'Selesai', bg: '#eaf8ef', text: '#25804a' };
    }
    if (s === 'revisi') {
      return { label: 'Perlu Revisi', bg: '#fff5dc', text: '#b77700' };
    }
    if (s === 'diproses') {
      return { label: 'Diproses', bg: '#e6f4f5', text: '#187682' };
    }
    if (s === 'ditolak') {
      return { label: 'Ditolak', bg: '#fdebec', text: '#b3261e' };
    }
    return { label: 'Diajukan', bg: '#eaf5fc', text: '#2474a8' };
  };

  // Mulai Revisi
  const handleStartRevisi = (item) => {
    setRevisiItem(item);
    setIsiRevisi(item?.isi_permohonan?.keterangan || item?.keterangan || '');
    setRevisiData(item?.isi_permohonan?.data_surat || {});
    setRevisiFiles({});
  };

  const handlePickRevisiFile = async (key) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setRevisiFiles((prev) => ({
          ...prev,
          [key]: {
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

  const handleSubmitRevisi = async () => {
    if (!isiRevisi.trim()) {
      Alert.alert('Perhatian', 'Catatan perbaikan / keperluan wajib diisi.');
      return;
    }

    try {
      setRevisiLoading(true);

      const payload = new FormData();
      payload.append(
        'isi_permohonan',
        JSON.stringify({
          keterangan: isiRevisi.trim(),
          data_surat: revisiData,
        })
      );

      Object.entries(revisiFiles).forEach(([key, file]) => {
        if (file && file.uri) {
          payload.append(`file_upload[${key}]`, {
            uri: file.uri,
            name: file.name,
            type: file.type,
          });
        }
      });

      await apiFetch(`/permohonan/${revisiItem.id}/revisi`, {
        method: 'POST',
        headers: {
          'X-HTTP-Method-Override': 'PUT',
        },
        body: payload,
      });

      Alert.alert('Berhasil', 'Revisi permohonan berhasil dikirim ulang ke petugas.');
      setRevisiItem(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      Alert.alert('Gagal Mengirim Revisi', err.message);
    } finally {
      setRevisiLoading(false);
    }
  };

  const configRevisi = revisiItem
    ? SURAT_CONFIG[revisiItem.jenis_surat] || { fields: [], files: [] }
    : { fields: [], files: [] };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Banner persis Web */}
      <View style={styles.bannerHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagWrap}>
            <Text style={styles.tagText}>WARGA DESA</Text>
          </View>
          <Text style={styles.bannerTitle}>Permohonan Saya</Text>
          <Text style={styles.bannerDesc}>
            Daftar dan status seluruh permohonan surat yang telah Anda ajukan.
          </Text>
        </View>

        {onNavigateAjukan && (
          <TouchableOpacity
            style={styles.ajukanBtnPrimary}
            onPress={onNavigateAjukan}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.ajukanBtnPrimaryText}>Ajukan Baru</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. 6 Stat Cards persis Web (PermohonanSaya.jsx) */}
      <View style={styles.statGrid}>
        {/* Card 1: Total */}
        <TouchableOpacity
          style={[styles.statCard, filter === 'semua' && styles.statCardActive]}
          onPress={() => setFilter('semua')}
          activeOpacity={0.75}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#dff2f5' }]}>
            <Ionicons name="document-text-outline" size={17} color="#187682" />
          </View>
          <Text style={styles.statNum}>{loading ? '–' : stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL</Text>
        </TouchableOpacity>

        {/* Card 2: Diajukan */}
        <TouchableOpacity
          style={[styles.statCard, filter === 'diajukan' && styles.statCardActive]}
          onPress={() => setFilter('diajukan')}
          activeOpacity={0.75}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#eaf5fc' }]}>
            <Ionicons name="paper-plane-outline" size={17} color="#2474a8" />
          </View>
          <Text style={styles.statNum}>{loading ? '–' : stats.diajukan}</Text>
          <Text style={styles.statLabel}>DIAJUKAN</Text>
        </TouchableOpacity>

        {/* Card 3: Diproses */}
        <TouchableOpacity
          style={[styles.statCard, filter === 'diproses' && styles.statCardActive]}
          onPress={() => setFilter('diproses')}
          activeOpacity={0.75}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#fff5dc' }]}>
            <Ionicons name="time-outline" size={17} color="#b77700" />
          </View>
          <Text style={styles.statNum}>{loading ? '–' : stats.proses}</Text>
          <Text style={styles.statLabel}>DIPROSES</Text>
        </TouchableOpacity>

        {/* Card 4: Revisi */}
        <TouchableOpacity
          style={[
            styles.statCard,
            filter === 'revisi' && styles.statCardActive,
            stats.revisi > 0 && styles.statCardWarning,
          ]}
          onPress={() => setFilter('revisi')}
          activeOpacity={0.75}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="alert-circle-outline" size={17} color="#d97706" />
          </View>
          <Text
            style={[
              styles.statNum,
              stats.revisi > 0 && { color: '#d97706' },
            ]}
          >
            {loading ? '–' : stats.revisi}
          </Text>
          <Text style={styles.statLabel}>REVISI</Text>
        </TouchableOpacity>

        {/* Card 5: Selesai */}
        <TouchableOpacity
          style={[styles.statCard, filter === 'selesai' && styles.statCardActive]}
          onPress={() => setFilter('selesai')}
          activeOpacity={0.75}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#eaf8ef' }]}>
            <Ionicons name="checkmark-done-circle-outline" size={17} color="#25804a" />
          </View>
          <Text style={styles.statNum}>{loading ? '–' : stats.selesai}</Text>
          <Text style={styles.statLabel}>SELESAI</Text>
        </TouchableOpacity>

        {/* Card 6: Ditolak */}
        <TouchableOpacity
          style={[
            styles.statCard,
            filter === 'ditolak' && styles.statCardActive,
            stats.ditolak > 0 && styles.statCardDanger,
          ]}
          onPress={() => setFilter('ditolak')}
          activeOpacity={0.75}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#fdebec' }]}>
            <Ionicons name="close-circle-outline" size={17} color="#b3261e" />
          </View>
          <Text
            style={[
              styles.statNum,
              stats.ditolak > 0 && { color: '#b3261e' },
            ]}
          >
            {loading ? '–' : stats.ditolak}
          </Text>
          <Text style={styles.statLabel}>DITOLAK</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Panel List Permohonan (.wd-panel) */}
      <View style={styles.panel}>
        {/* Toolbar: Cari + Filter */}
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#7a9a9f" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari jenis atau nomor surat..."
              placeholderTextColor="#9ab0b4"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9ab0b4" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, filter === f.value && styles.chipActive]}
                onPress={() => setFilter(f.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    filter === f.value && styles.chipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List data */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#2a9fad" />
            <Text style={styles.loadingText}>Memuat permohonan...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={38} color="#b2c6c9" />
            <Text style={styles.emptyTitle}>Belum Ada Permohonan</Text>
            <Text style={styles.emptySub}>
              {search || filter !== 'semua'
                ? 'Tidak ada permohonan yang sesuai kriteria pencarian.'
                : 'Anda belum pernah mengajukan surat. Tekan "Ajukan Baru" untuk membuat permohonan.'}
            </Text>
          </View>
        ) : (
          filteredList.map((item, index) => {
            const badge = getStatusBadge(item.status);
            const sudahJadi =
              item.status === 'selesai' ||
              item.status === 'disetujui' ||
              Boolean(item.nomor_surat);
            const isRevisi = item.status === 'revisi';

            return (
              <View key={item.id ? `permohonan-${item.id}` : `permohonan-idx-${index}`} style={styles.cardItem}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardIndex}>{index + 1}.</Text>
                    <Text style={styles.cardTitle}>{item.jenis_surat}</Text>
                  </View>
                  <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>No. Surat:</Text>
                    <Text style={styles.metaValue}>{item.nomor_surat || '-'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Tanggal Diajukan:</Text>
                    <Text style={styles.metaValue}>
                      {formatTanggalSingkat(item.created_at)}
                    </Text>
                  </View>

                  {/* Notice Revisi / Tolak */}
                  {(item.catatan_revisi || item.keterangan) && (
                    <View
                      style={[
                        styles.noticeBox,
                        isRevisi ? styles.noticeRevisi : styles.noticeTolak,
                      ]}
                    >
                      <Ionicons
                        name={isRevisi ? 'alert-circle' : 'close-circle'}
                        size={15}
                        color={isRevisi ? '#b77700' : '#b3261e'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.noticeTitle,
                            isRevisi ? styles.noticeTitleRevisi : styles.noticeTitleTolak,
                          ]}
                        >
                          {isRevisi ? 'Catatan Revisi Petugas:' : 'Alasan Penolakan:'}
                        </Text>
                        <Text
                          style={[
                            styles.noticeText,
                            isRevisi ? styles.noticeTextRevisi : styles.noticeTextTolak,
                          ]}
                        >
                          {item.catatan_revisi || item.keterangan}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Actions row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => onSelectDetail && onSelectDetail(item)}
                  >
                    <Ionicons name="document-text-outline" size={13} color="#187682" />
                    <Text style={styles.detailBtnText}>Lihat Detail</Text>
                  </TouchableOpacity>

                  <View style={styles.actionGroup}>
                    {/* Tombol Revisi jika status revisi */}
                    {isRevisi && (
                      <TouchableOpacity
                        style={styles.revisiBtn}
                        onPress={() => handleStartRevisi(item)}
                      >
                        <Ionicons name="create-outline" size={13} color="#ffffff" />
                        <Text style={styles.revisiBtnText}>Revisi</Text>
                      </TouchableOpacity>
                    )}

                    {/* Tombol Preview Surat jika sudah jadi */}
                    {sudahJadi && (
                      <TouchableOpacity
                        style={styles.previewBtn}
                        onPress={() => onSelectPreview && onSelectPreview(item)}
                      >
                        <Ionicons name="eye-outline" size={14} color="#1b7480" />
                      </TouchableOpacity>
                    )}

                    {/* Tombol Unduh PDF jika sudah jadi */}
                    {sudahJadi && (
                      <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={() => onUnduhSurat && onUnduhSurat(item)}
                        disabled={downloadingId === item.id}
                      >
                        {downloadingId === item.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="download-outline" size={13} color="#ffffff" />
                            <Text style={styles.downloadBtnText}>PDF</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* MODAL REVISI PERMOHONAN */}
      {revisiItem && (
        <Modal
          visible={Boolean(revisiItem)}
          transparent
          animationType="slide"
          onRequestClose={() => setRevisiItem(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Revisi Permohonan</Text>
                  <Text style={styles.modalSub}>{revisiItem.jenis_surat}</Text>
                </View>
                <TouchableOpacity onPress={() => setRevisiItem(null)}>
                  <Ionicons name="close" size={22} color="#444" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Catatan Petugas */}
                {(revisiItem.catatan_revisi || revisiItem.keterangan) && (
                  <View style={styles.revisiReasonBox}>
                    <Text style={styles.revisiReasonTitle}>Catatan Petugas:</Text>
                    <Text style={styles.revisiReasonText}>
                      {revisiItem.catatan_revisi || revisiItem.keterangan}
                    </Text>
                  </View>
                )}

                {/* Isian Data Surat */}
                {configRevisi.fields?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.sectionHeaderTitle}>Data Surat</Text>
                    {configRevisi.fields.map((field) => (
                      <View key={field.name} style={{ marginBottom: 10 }}>
                        <Text style={styles.fieldLabel}>{field.label}</Text>
                        <TextInput
                          style={styles.input}
                          value={revisiData[field.name] || ''}
                          onChangeText={(t) =>
                            setRevisiData((prev) => ({ ...prev, [field.name]: t }))
                          }
                        />
                      </View>
                    ))}
                  </View>
                )}

                {/* Upload Ulang Dokumen */}
                {configRevisi.files?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.sectionHeaderTitle}>Dokumen Pendukung</Text>
                    {configRevisi.files.map((file) => {
                      const baru = revisiFiles[file.name];
                      return (
                        <View key={file.name} style={styles.revisiFileRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.uploadLabel}>{file.label}</Text>
                            {baru ? (
                              <Text style={styles.uploadedFileName} numberOfLines={1}>
                                ✓ File Baru: {baru.name}
                              </Text>
                            ) : (
                              <Text style={styles.uploadHelper}>
                                Dokumen saat ini tersimpan di sistem
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.revisiPickBtn}
                            onPress={() => handlePickRevisiFile(file.name)}
                          >
                            <Ionicons name="cloud-upload-outline" size={14} color="#187682" />
                            <Text style={styles.revisiPickBtnText}>Ganti</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Isi Keperluan Revisi */}
                <Text style={styles.fieldLabel}>Isi / Catatan Perbaikan *</Text>
                <TextInput
                  style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                  multiline
                  numberOfLines={3}
                  value={isiRevisi}
                  onChangeText={setIsiRevisi}
                />

                <TouchableOpacity
                  style={[styles.submitRevisiBtn, revisiLoading && styles.btnDisabled]}
                  onPress={handleSubmitRevisi}
                  disabled={revisiLoading}
                >
                  {revisiLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.submitRevisiBtnText}>Kirim Revisi</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  /* Banner Header */
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
    gap: 10,
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
  ajukanBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2a9fad',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
  },
  ajukanBtnPrimaryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  /* Stat Grid (4 items) */
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    width: '48.6%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#cfe2e4',
    alignItems: 'center',
    shadowColor: '#1b7480',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardActive: {
    borderColor: '#2a9fad',
    backgroundColor: '#f4fafb',
    borderWidth: 1.5,
  },
  statCardWarning: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  statCardDanger: {
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2d30',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6e858a',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  /* Panel */
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cfe2e4',
  },
  toolbar: {
    marginBottom: 12,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f9f9',
    borderWidth: 1,
    borderColor: '#cfe2e4',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    color: '#1f2d30',
  },
  filterScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f0f5f6',
    borderWidth: 1,
    borderColor: '#d4e2e4',
  },
  chipActive: {
    backgroundColor: '#2a9fad',
    borderColor: '#2a9fad',
  },
  chipText: {
    fontSize: 10.5,
    color: '#556d71',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 11.5,
    color: '#668286',
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2a3b3e',
  },
  emptySub: {
    fontSize: 11,
    color: '#849c9f',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  /* Card items */
  cardItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d7e6e8',
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f6f7',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: '#187682',
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1f2d30',
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    paddingVertical: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#6c8588',
  },
  metaValue: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1f2d30',
  },
  noticeBox: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 7,
    marginTop: 4,
  },
  noticeRevisi: {
    backgroundColor: '#fff5dc',
  },
  noticeTolak: {
    backgroundColor: '#fdebec',
  },
  noticeTitle: {
    fontSize: 10,
    fontWeight: '700',
  },
  noticeTitleRevisi: {
    color: '#b77700',
  },
  noticeTitleTolak: {
    color: '#b3261e',
  },
  noticeText: {
    fontSize: 10,
    marginTop: 2,
  },
  noticeTextRevisi: {
    color: '#9e6700',
  },
  noticeTextTolak: {
    color: '#991e17',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f2f6f7',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef7f8',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#187682',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revisiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b77700',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  revisiBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#e0eeef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2a9fad',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  /* Modal Revisi */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f3',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2d30',
  },
  modalSub: {
    fontSize: 11,
    color: '#6d868a',
  },
  revisiReasonBox: {
    backgroundColor: '#fff5dc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  revisiReasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b77700',
  },
  revisiReasonText: {
    fontSize: 11,
    color: '#845700',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#187682',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2a3b3e',
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
  revisiFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f6f7',
    gap: 8,
  },
  uploadLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#243336',
  },
  uploadHelper: {
    fontSize: 10,
    color: '#8c9ea2',
    marginTop: 1,
  },
  uploadedFileName: {
    fontSize: 10,
    color: '#25804a',
    fontWeight: '600',
    marginTop: 1,
  },
  revisiPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0eeef',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  revisiPickBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#187682',
  },
  submitRevisiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2a9fad',
    borderRadius: 8,
    paddingVertical: 11,
    marginTop: 14,
    marginBottom: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitRevisiBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
});
