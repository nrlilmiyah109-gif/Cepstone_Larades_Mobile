import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';

export const LaradesMark = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 72 72">
    <Defs>
      <LinearGradient id="lrBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#2fb3c1" />
        <Stop offset="1" stopColor="#187682" />
      </LinearGradient>
      <LinearGradient id="lrBadge" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ffd24a" />
        <Stop offset="1" stopColor="#f4a915" />
      </LinearGradient>
    </Defs>

    {/* Badge putih */}
    <Rect
      x="4"
      y="4"
      width="64"
      height="64"
      rx="18"
      fill="#ffffff"
    />

    {/* Atap rumah */}
    <Path
      d="M15 33 L36 14 L57 33"
      fill="none"
      stroke="#187682"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Badan amplop */}
    <Rect
      x="19"
      y="31"
      width="34"
      height="25"
      rx="5"
      fill="url(#lrBody)"
    />

    {/* Lipatan amplop */}
    <Path
      d="M22.5 35.5 L36 46 L49.5 35.5"
      fill="none"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.95"
    />

    {/* Lencana centang */}
    <Circle
      cx="53"
      cy="53"
      r="10"
      fill="url(#lrBadge)"
      stroke="#ffffff"
      strokeWidth="3"
    />
    <Path
      d="M48.5 53.3 L51.7 56.5 L57.5 50"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function LaradesLogo({ size = 'normal', color = '#1f2d30' }) {
  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      <View style={styles.laradesMarkWrap}>
        <LaradesMark size={isLarge ? 72 : 52} />
      </View>
      <View style={styles.laradesTextWrap}>
        <Text style={[styles.laradesTitle, isLarge && styles.laradesTitleLarge, { color }]}>
          LARA<Text style={styles.laradesTitleHighlight}>DES</Text>
        </Text>
        <Text style={[styles.laradesSubtitle, isLarge && styles.laradesSubtitleLarge]}>
          Layanan Persuratan Desa
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  laradesMarkWrap: {
    marginBottom: 8,
    shadowColor: '#0b4a52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  laradesTextWrap: {
    alignItems: 'center',
  },
  laradesTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  laradesTitleLarge: {
    fontSize: 28,
  },
  laradesTitleHighlight: {
    color: '#2399a6',
  },
  laradesSubtitle: {
    fontSize: 12,
    color: '#5f7478',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  laradesSubtitleLarge: {
    fontSize: 13,
    color: '#5f7478',
  },
});
