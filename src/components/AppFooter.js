import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © 2026 LARADES • Sistem Layanan Persuratan Desa • Versi 1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(35, 153, 166, 0.12)',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#658186',
    textAlign: 'center',
    fontWeight: '500',
  },
});
