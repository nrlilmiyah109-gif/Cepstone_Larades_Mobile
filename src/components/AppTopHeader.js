import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LaradesMark } from './LaradesLogo';
import { useAuth } from '../context/AuthContext';

export default function AppTopHeader({
  onOpenSidebar,
  onOpenProfil,
  onOpenServer,
  title = 'Sistem Layanan Persuratan Desa',
}) {
  const { user, logout } = useAuth();
  const nama =
    user?.warga?.nama ||
    user?.nama ||
    user?.name ||
    user?.username ||
    'Pengguna';
  const inisial = nama.charAt(0).toUpperCase();

  return (
    <View style={styles.header}>
      {/* Kiri: Hamburger + Logo + Brand Text */}
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={onOpenSidebar}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={26} color="#ffffff" />
        </TouchableOpacity>

        <LaradesMark size={32} />

        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle}>
            LARA<Text style={styles.brandTitleAccent}>DES</Text>
          </Text>
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      {/* Kanan: Status Online + Avatar + Settings + Logout */}
      <View style={styles.headerRight}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Sistem Online</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={onOpenProfil}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarInitial}>{inisial}</Text>
        </TouchableOpacity>

        {onOpenServer && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenServer}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={17} color="#ffffff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={17} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2a9fad', // var(--w-primary)
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hamburgerBtn: {
    padding: 4,
    marginRight: 2,
  },
  brandTextWrap: {
    flexShrink: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  brandTitleAccent: {
    color: '#e0eeef',
  },
  brandSubtitle: {
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7dffa8',
  },
  statusText: {
    fontSize: 9.5,
    color: '#ffffff',
    fontWeight: '600',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1b7480',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
