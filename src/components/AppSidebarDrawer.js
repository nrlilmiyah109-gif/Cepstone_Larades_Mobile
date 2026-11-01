import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LaradesMark } from './LaradesLogo';

export default function AppSidebarDrawer({
  visible,
  onClose,
  role = 'petugas', // 'petugas' | 'kepala_desa' | 'warga'
  user,
  activeKey = 'dashboard',
  onSelectMenu,
  onLogout,
}) {
  if (!visible) return null;

  const nama =
    user?.warga?.nama ||
    user?.nama ||
    user?.name ||
    user?.username ||
    (role === 'kepala_desa'
      ? 'Kepala Desa'
      : role === 'petugas'
      ? 'Petugas'
      : 'Warga');
  const inisial = nama.charAt(0).toUpperCase();

  const roleLabel =
    role === 'kepala_desa'
      ? 'Kepala Desa'
      : role === 'petugas'
      ? 'Petugas Desa'
      : 'Warga Pengguna';

  // Menu Groups untuk Warga Mobile (Staf diarahkan ke Web)
  const menuGroups = [
    {
      title: 'MENU UTAMA',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
      ],
    },
    {
      title: 'LAYANAN',
      items: [
        { key: 'ajukan_surat', label: 'Ajukan Surat', icon: 'document-text-outline' },
        { key: 'permohonan_saya', label: 'Permohonan Saya', icon: 'time-outline' },
      ],
    },
    {
      title: 'PENGATURAN',
      items: [
        { key: 'profil', label: 'Profil Saya', icon: 'person-circle-outline' },
      ],
    },
  ];

  const handleItemPress = (key) => {
    onSelectMenu(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop di sisi kanan untuk menutup drawer */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sidebar Panel persis Web (.warga-sidebar) */}
        <View style={styles.sidebarPanel}>
          {/* Brand Row */}
          <View style={styles.brandRow}>
            <View style={styles.brandInfo}>
              <LaradesMark size={40} />
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>
                  LARA<Text style={styles.brandTitleAccent}>DES</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeDrawerBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Line separator (.warga-sidebar-line) */}
          <View style={styles.sidebarLine} />

          {/* User Box (.warga-sidebar-user) */}
          <View style={styles.sidebarUser}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{inisial}</Text>
            </View>
            <View style={styles.userTextWrap}>
              <Text style={styles.userName} numberOfLines={1}>
                {nama}
              </Text>
              <Text style={styles.userRole}>{roleLabel}</Text>
            </View>
          </View>

          {/* Menu Nav Groups persis Web (.warga-nav) */}
          <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
            {menuGroups.map((group, gIdx) => (
              <View key={group.title} style={styles.navGroup}>
                <Text style={styles.navGroupTitle}>{group.title}</Text>
                {group.items.map((item) => {
                  const isActive = activeKey === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.navLink, isActive && styles.navLinkActive]}
                      onPress={() => handleItemPress(item.key)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isActive ? '#1b7480' : '#ffffff'}
                      />
                      <Text
                        style={[styles.navLinkLabel, isActive && styles.navLinkLabelActive]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Bottom Area persis Web (.warga-sidebar-bottom) */}
          <View style={styles.sidebarBottom}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={17} color="#1b7480" />
              <Text style={styles.logoutBtnText}>Keluar</Text>
            </TouchableOpacity>

            <Text style={styles.sidebarVersion}>
              LARADES • Pemerintah Kabupaten Bojonegoro
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 38, 44, 0.6)',
  },
  sidebarPanel: {
    width: 275,
    height: '100%',
    backgroundColor: '#2a9fad', // var(--w-primary) persis Web
    paddingTop: Platform.OS === 'ios' ? 48 : 34,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: '#e0eeef', // var(--w-soft)
  },
  closeDrawerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  sidebarLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 14,
  },
  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 16,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1b7480',
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  navScroll: {
    flex: 1,
  },
  navGroup: {
    marginBottom: 14,
  },
  navGroupTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  navLink: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navLinkActive: {
    backgroundColor: '#e0eeef', // var(--w-soft) persis Web
  },
  navLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  navLinkLabelActive: {
    color: '#1b7480', // var(--w-primary-dark) persis Web
    fontWeight: '750',
  },
  sidebarBottom: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  logoutBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1b7480',
  },
  sidebarVersion: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 12,
  },
});
