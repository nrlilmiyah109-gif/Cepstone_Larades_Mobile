import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Pilih tanggal...',
  disabled = false,
  error = '',
  maximumDate,
  minimumDate,
  style,
  buttonStyle,
}) {
  const formatDateString = (d) => {
    if (!d) return undefined;
    if (typeof d === 'string') return d;
    if (d instanceof Date && !isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return undefined;
  };

  const maxStr = formatDateString(maximumDate);
  const minStr = formatDateString(minimumDate);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.webWrapper}>
        <input
          type="date"
          value={value || ''}
          disabled={disabled}
          max={maxStr}
          min={minStr}
          placeholder={placeholder}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: error ? '#b3261e' : '#cfe2e4',
            borderRadius: '8px',
            backgroundColor: disabled ? '#f0f4f5' : '#fbfcfc',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '9px',
            paddingBottom: '9px',
            fontSize: '12px',
            color: value ? '#1f2d30' : '#9db0b3',
            width: '100%',
            height: '38px',
            boxSizing: 'border-box',
            outline: 'none',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2a3b3e',
    marginBottom: 5,
  },
  webWrapper: {
    width: '100%',
  },
  errorText: {
    fontSize: 10.5,
    color: '#b3261e',
    marginTop: 4,
  },
});
