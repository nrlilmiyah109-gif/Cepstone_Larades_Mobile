import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import ServerConfigModal from '../../components/ServerConfigModal';
import DetailSuratModal from '../../components/DetailSuratModal';
import PreviewSuratModal from '../../components/PreviewSuratModal';
import AppSidebarDrawer from '../../components/AppSidebarDrawer';
import AppTopHeader from '../../components/AppTopHeader';
import AppFooter from '../../components/AppFooter';
import AjukanSuratView from './AjukanSuratView';
import PermohonanSayaView from './PermohonanSayaView';
import ProfilWargaView from './ProfilWargaView';
import { downloadAndOpenFile } from '../../utils/fileDownloader';

const FILTERS = [
  { value: 'semua', label: 'Semua' },
  { value: 'diajukan', label: 'Diajukan' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'revisi', label: 'Revisi' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
];

const getSalamWaktu = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
};

export default function WargaHomeScreen() {
  const { user, logout } = useAuth();
  const nama = user?.warga?.nama || user?.nama || user?.name || user?.username || 'Warga';

  // Active view: 'dashboard' | 'ajukan_surat' | 'permohonan_saya' | 'profil'
  const [currentView, setCurrentView] = useState('dashboard');

  const [permohonan, setPermohonan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('semua');

  // Modals & Sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [previewSuratItem, setPreviewSuratItem] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/permohonan');
      setPermohonan(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
    } catch (err) {
      Alert.alert('Gagal Memuat Data', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Statistik persis Web (WargaDashboard.jsx)
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

  // Filter & Pencarian persis Web
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return permohonan.filter((d) => {
      const s = (d.status || 'diajukan').toLowerCase();
      let matchFilter = filter === 'semua';
      if (filter === 'diajukan') matchFilter = s === 'diajukan' || s === 'menunggu';
      else if (filter === 'diproses') matchFilter = s === 'diproses';
      else if (filter === 'revisi') matchFilter = s === 'revisi';
      else if (filter === 'selesai') matchFilter = s === 'selesai' || s === 'disetujui';
      else if (filter === 'ditolak') matchFilter = s === 'ditolak';

      const matchSearch =
        !q ||
        (d.jenis_surat && d.jenis_surat.toLowerCase().includes(q)) ||
        (d.nomor_surat && d.nomor_surat.toLowerCase().includes(q));

      return matchFilter && matchSearch;
    });
  }, [permohonan, search, filter]);

  const handleUnduhSurat = async (item) => {
    try {
      setDownloadingId(item.id);
      const safeNomor = (item.nomor_surat || `surat_${item.id}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const endpoint = item.arsip?.id
        ? `/arsip/${item.arsip.id}/unduh`
        : `/permohonan/${item.id}/download`;

      await downloadAndOpenFile(
        endpoint,
        `Surat_${safeNomor}.pdf`,
        `Dokumen Surat Resmi ${item.jenis_surat}`
      );
    } catch (err) {
      // Handled
    } finally {
      setDownloadingId(null);
    }
  };

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

  return (
    <View style={styles.container}>
      {/* 1. Header Atas persis Web (warga-header) */}
      <AppTopHeader
        onOpenSidebar={() => setSidebarVisible(true)}
        onOpenProfil={() => setCurrentView('profil')}
        onOpenServer={() => setServerModalVisible(true)}
      />

      {/* 2. Main Content Routing */}
      {currentView === 'ajukan_surat' && (
        <AjukanSuratView
          onCancel={() => setCurrentView('dashboard')}
          onSuccess={() => {
            loadData();
            setCurrentView('permohonan_saya');
          }}
          onNavigateProfil={() => setCurrentView('profil')}
        />
      )}

      {currentView === 'permohonan_saya' && (
        <PermohonanSayaView
          permohonan={permohonan}
          loading={loading}
          onRefresh={loadData}
          onSelectDetail={(item) => setSelectedSurat(item)}
          onSelectPreview={(item) => setPreviewSuratItem(item)}
          onUnduhSurat={handleUnduhSurat}
          downloadingId={downloadingId}
          onNavigateAjukan={() => setCurrentView('ajukan_surat')}
        />
      )}

      {currentView === 'profil' && <ProfilWargaView />}

      {currentView === 'dashboard' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2a9fad']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Sambutan persis Web (.wd-welcome) */}
          <View style={styles.wdWelcome}>
            <View style={styles.welcomeInfo}>
              <Text style={styles.welcomeTag}>DASHBOARD WARGA</Text>
              <Text style={styles.welcomeTitle}>
                {getSalamWaktu()}, {nama}!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {loading
                  ? 'Memuat data permohonan Anda...'
                  : stats.total === 0
                  ? 'Anda belum memiliki permohonan surat aktif saat ini.'
                  : stats.revisi > 0 ? `Perhatian: Ada ${stats.revisi} berkas surat yang perlu Anda revisi.` : `Anda memiliki ${stats.proses} surat yang sedang diproses desa.`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnAjukanWelcome}
              onPress={() => setCurrentView('ajukan_surat')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={17} color="#1b7480" />
              <Text style={styles.btnAjukanWelcomeText}>Ajukan Surat</Text>
            </TouchableOpacity>
          </View>

          {/* Grid Statistik 6 Status Warga (.wd-stat-grid) */}
          <View style={styles.wdStatGrid}>
            {/* Card 1: Total */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, styles.statIconTeal]}>
                <Ionicons name="document-text-outline" size={17} color="#187682" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>TOTAL</Text>
                <Text style={styles.statNumber}>{loading ? '–' : stats.total}</Text>
                <Text style={styles.statHelper} numberOfLines={1}>Semua surat</Text>
              </View>
            </View>

            {/* Card 2: Diajukan */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, styles.statIconBlue]}>
                <Ionicons name="paper-plane-outline" size={17} color="#2474a8" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>DIAJUKAN</Text>
                <Text style={styles.statNumber}>{loading ? '–' : stats.diajukan}</Text>
                <Text style={styles.statHelper} numberOfLines={1}>Menunggu proses</Text>
              </View>
            </View>

            {/* Card 3: Diproses */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, styles.statIconOrange]}>
                <Ionicons name="time-outline" size={17} color="#b77700" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>DIPROSES</Text>
                <Text style={styles.statNumber}>{loading ? '–' : stats.proses}</Text>
                <Text style={styles.statHelper} numberOfLines={1}>Sedang diperiksa</Text>
              </View>
            </View>

            {/* Card 4: Revisi */}
            <View style={[styles.statCard, stats.revisi > 0 && styles.statCardWarning]}>
              <View style={[styles.statIconBox, styles.statIconAmber]}>
                <Ionicons name="alert-circle-outline" size={17} color="#d97706" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>REVISI</Text>
                <Text
                  style={[
                    styles.statNumber,
                    stats.revisi > 0 && { color: '#d97706' },
                  ]}
                >
                  {loading ? '–' : stats.revisi}
                </Text>
                <Text style={styles.statHelper} numberOfLines={1}>
                  {stats.revisi > 0 ? 'Perlu perbaikan' : 'Tidak ada revisi'}
                </Text>
              </View>
            </View>

            {/* Card 5: Selesai */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, styles.statIconGreen]}>
                <Ionicons name="checkmark-done-circle-outline" size={17} color="#25804a" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>SELESAI</Text>
                <Text style={styles.statNumber}>{loading ? '–' : stats.selesai}</Text>
                <Text style={styles.statHelper} numberOfLines={1}>Siap diunduh</Text>
              </View>
            </View>

            {/* Card 6: Ditolak */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, styles.statIconRed]}>
                <Ionicons name="close-circle-outline" size={17} color="#b3261e" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>DITOLAK</Text>
                <Text style={styles.statNumber}>
                  {loading ? '–' : stats.ditolak}
                </Text>
                <Text style={styles.statHelper} numberOfLines={1}>
                  {stats.ditolak > 0 ? 'Perlu dicek' : 'Tidak ada ditolak'}
                </Text>
              </View>
            </View>
          </View>

          {/* Panel Histori Pengajuan persis Web (.wd-panel) */}
          <View style={styles.wdPanel}>
            <View style={styles.panelHead}>
              <View>
                <Text style={styles.panelTitle}>Histori Pengajuan</Text>
                <Text style={styles.panelSubtitle}>
                  Riwayat surat yang pernah Anda ajukan
                </Text>
              </View>

              <TouchableOpacity
                style={styles.panelViewAllBtn}
                onPress={() => setCurrentView('permohonan_saya')}
              >
                <Text style={styles.panelViewAllBtnText}>Lihat Semua</Text>
                <Ionicons name="chevron-forward" size={14} color="#187682" />
              </TouchableOpacity>
            </View>

            {/* Toolbar: Pencarian + Chip Filters */}
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

            {/* Daftar Riwayat */}
            {loading ? (
              <View style={styles.stateCenter}>
                <ActivityIndicator size="small" color="#2a9fad" />
                <Text style={styles.stateText}>Memuat data surat...</Text>
              </View>
            ) : filteredList.length === 0 ? (
              <View style={styles.stateEmpty}>
                <Ionicons name="document-text-outline" size={36} color="#9bb4b8" />
                <Text style={styles.emptyTitle}>Belum Ada Pengajuan Surat</Text>
                <Text style={styles.emptySub}>
                  {search || filter !== 'semua'
                    ? 'Tidak ada permohonan yang sesuai kriteria pencarian.'
                    : 'Gunakan tombol di atas untuk mengajukan permohonan surat desa Anda.'}
                </Text>
              </View>
            ) : (
              filteredList.map((item, index) => {
                const badge = getStatusBadge(item.status);
                const sudahJadi =
                  item.status === 'selesai' ||
                  item.status === 'disetujui' ||
                  Boolean(item.nomor_surat);

                return (
                  <View key={item.id ? `warga-histori-${item.id}` : `warga-histori-idx-${index}`} style={styles.historyCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardHeaderLeft}>
                        <Text style={styles.cardNomorUrut}>{index + 1}.</Text>
                        <Text style={styles.cardJenisSurat}>{item.jenis_surat}</Text>
                      </View>
                      <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgePillText, { color: badge.text }]}>
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
                        <Text style={styles.metaLabel}>Tanggal:</Text>
                        <Text style={styles.metaValue}>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </Text>
                      </View>

                      {(item.catatan_revisi || item.keterangan) && (
                        <View
                          style={[
                            styles.noticeBox,
                            item.status === 'revisi'
                              ? styles.noticeRevisi
                              : styles.noticeTolak,
                          ]}
                        >
                          <Ionicons
                            name={
                              item.status === 'revisi'
                                ? 'alert-circle'
                                : 'close-circle'
                            }
                            size={14}
                            color={item.status === 'revisi' ? '#b77700' : '#b3261e'}
                          />
                          <Text
                            style={[
                              styles.noticeText,
                              item.status === 'revisi'
                                ? styles.noticeTextRevisi
                                : styles.noticeTextTolak,
                            ]}
                            numberOfLines={2}
                          >
                            {item.catatan_revisi || item.keterangan}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Actions row */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => setSelectedSurat(item)}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={13}
                          color="#187682"
                        />
                        <Text style={styles.detailBtnText}>Lihat Detail</Text>
                      </TouchableOpacity>

                      <View style={styles.actionBtnGroup}>
                        {sudahJadi && (
                          <TouchableOpacity
                            style={styles.iconActionBtn}
                            onPress={() => setPreviewSuratItem(item)}
                          >
                            <Ionicons name="eye-outline" size={14} color="#1b7480" />
                          </TouchableOpacity>
                        )}

                        {sudahJadi && (
                          <TouchableOpacity
                            style={[
                              styles.downloadActionBtn,
                              downloadingId === item.id && styles.btnLoading,
                            ]}
                            disabled={downloadingId === item.id}
                            onPress={() => handleUnduhSurat(item)}
                          >
                            {downloadingId === item.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons
                                  name="download-outline"
                                  size={13}
                                  color="#fff"
                                />
                                <Text style={styles.downloadActionBtnText}>PDF</Text>
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

          {/* Footer Persis Web */}
          <AppFooter />
        </ScrollView>
      )}

      {/* MODALS */}
      <PreviewSuratModal
        visible={Boolean(previewSuratItem)}
        item={previewSuratItem}
        onClose={() => setPreviewSuratItem(null)}
      />

      <DetailSuratModal
        visible={Boolean(selectedSurat)}
        item={selectedSurat}
        type="permohonan"
        role="warga"
        onClose={() => setSelectedSurat(null)}
        onUnduh={handleUnduhSurat}
        loadingAction={Boolean(downloadingId)}
      />

      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
        onSaved={loadData}
      />

      {/* Sidebar Drawer yang bisa dibuka & ditutup persis Web */}
      <AppSidebarDrawer
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        role="warga"
        user={user}
        activeKey={currentView}
        onSelectMenu={(key) => {
          setCurrentView(key);
        }}
        onLogout={logout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0eeef', // var(--w-soft)
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 24,
  },
  /* Banner Sambutan (.wd-welcome) */
  wdWelcome: {
    backgroundColor: '#2a9fad',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  welcomeInfo: {
    marginBottom: 12,
  },
  welcomeTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#e0eeef',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 16,
  },
  btnAjukanWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAjukanWelcomeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#187682',
  },
  /* Grid Statistik (.wd-stat-grid) */
  wdStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    width: '48.6%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cfe2e4',
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
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIconTeal: {
    backgroundColor: '#dff2f5',
  },
  statIconBlue: {
    backgroundColor: '#eaf5fc',
  },
  statIconOrange: {
    backgroundColor: '#fff5dc',
  },
  statIconAmber: {
    backgroundColor: '#fef3c7',
  },
  statIconGreen: {
    backgroundColor: '#eaf8ef',
  },
  statIconRed: {
    backgroundColor: '#fdebec',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#718c90',
    letterSpacing: 0.4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2d30',
    lineHeight: 24,
  },
  statHelper: {
    fontSize: 10,
    color: '#7a969a',
  },
  /* Panel Histori (.wd-panel) */
  wdPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cfe2e4',
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2d30',
  },
  panelSubtitle: {
    fontSize: 10.5,
    color: '#718c90',
    marginTop: 1,
  },
  panelViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e0eeef',
    borderRadius: 6,
  },
  panelViewAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#187682',
  },
  /* Toolbar */
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
  /* History Card */
  historyCard: {
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
  cardNomorUrut: {
    fontSize: 12,
    fontWeight: '700',
    color: '#187682',
  },
  cardJenisSurat: {
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
  badgePillText: {
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
  noticeText: {
    fontSize: 10.5,
    flex: 1,
  },
  noticeTextRevisi: {
    color: '#b77700',
  },
  noticeTextTolak: {
    color: '#b3261e',
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
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#e0eeef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2a9fad',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  downloadActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnLoading: {
    opacity: 0.6,
  },
  stateCenter: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stateText: {
    fontSize: 11,
    color: '#658185',
  },
  stateEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34474a',
  },
  emptySub: {
    fontSize: 11,
    color: '#849c9f',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
});
