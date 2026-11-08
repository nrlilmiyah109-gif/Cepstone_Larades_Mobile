import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

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
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'year' | 'month'

  // Parse value string 'YYYY-MM-DD'
  const parseDate = (val) => {
    if (!val) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      };
    }
    if (typeof val === 'string') {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return { year: y, month: m, day: d };
        }
      }
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
      };
    }
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
  };

  const initial = useMemo(() => parseDate(value), [value]);

  const [currentYear, setCurrentYear] = useState(initial.year);
  const [currentMonth, setCurrentMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(value ? initial.day : null);

  const formatDisplay = (val) => {
    if (!val) return '';
    const p = parseDate(val);
    if (p && p.month >= 0 && p.month < 12) {
      return `${p.day} ${MONTH_NAMES[p.month]} ${p.year}`;
    }
    return val;
  };

  const handleOpen = () => {
    if (disabled) return;
    const p = parseDate(value);
    setCurrentYear(p.year);
    setCurrentMonth(p.month);
    setSelectedDay(value ? p.day : null);
    setViewMode('calendar');
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${mStr}-${dStr}`;
    if (onChange) onChange(dateStr);
    setModalVisible(false);
  };

  const handleSetToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDay(d);
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${y}-${mStr}-${dStr}`;
    if (onChange) onChange(dateStr);
    setModalVisible(false);
  };

  // Generate days in month
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null); // empty slots for days before 1st of month
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [currentYear, currentMonth]);

  // Year options (1940 sampai tahun sekarang + 2)
  const currentMaxYear = new Date().getFullYear() + 2;
  const yearsList = useMemo(() => {
    const arr = [];
    for (let y = currentMaxYear; y >= 1940; y--) {
      arr.push(y);
    }
    return arr;
  }, [currentMaxYear]);

  // Support Web native input fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.webInputWrap}>
          <input
            type="date"
            value={value || ''}
            disabled={disabled}
            onChange={(e) => {
              if (onChange) onChange(e.target.value);
            }}
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: error ? '#b3261e' : '#cfe2e4',
              borderRadius: 8,
              backgroundColor: disabled ? '#f0f4f5' : '#fbfcfc',
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              fontSize: 12,
              color: value ? '#1f2d30' : '#9db0b3',
              width: '100%',
              height: 38,
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

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[
          styles.inputBox,
          buttonStyle,
          error ? styles.inputBoxError : null,
          disabled ? styles.inputBoxDisabled : null,
        ]}
        onPress={handleOpen}
        activeOpacity={disabled ? 1 : 0.75}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={value ? '#187682' : '#9db0b3'}
          style={styles.icon}
        />
        <Text
          style={[
            styles.valueText,
            !value && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {value ? `${formatDisplay(value)}` : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#9db0b3" />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* MODAL DATE PICKER KALENDER INTERAKTIF */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>PILIH TANGGAL</Text>
                <Text style={styles.modalTitle}>
                  {selectedDay
                    ? `${selectedDay} ${MONTH_NAMES[currentMonth]} ${currentYear}`
                    : `${MONTH_NAMES[currentMonth]} ${currentYear}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color="#475559" />
              </TouchableOpacity>
            </View>

            {/* Navigasi Bulan & Tahun */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handlePrevMonth}
              >
                <Ionicons name="chevron-back" size={18} color="#187682" />
              </TouchableOpacity>

              <View style={styles.navSelectGroup}>
                <TouchableOpacity
                  style={[
                    styles.navSelectorBtn,
                    viewMode === 'month' && styles.navSelectorActive,
                  ]}
                  onPress={() =>
                    setViewMode((m) => (m === 'month' ? 'calendar' : 'month'))
                  }
                >
                  <Text
                    style={[
                      styles.navSelectorText,
                      viewMode === 'month' && styles.navSelectorTextActive,
                    ]}
                  >
                    {MONTH_NAMES[currentMonth]}
                  </Text>
                  <Ionicons
                    name={viewMode === 'month' ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={viewMode === 'month' ? '#187682' : '#72898d'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.navSelectorBtn,
                    viewMode === 'year' && styles.navSelectorActive,
                  ]}
                  onPress={() =>
                    setViewMode((m) => (m === 'year' ? 'calendar' : 'year'))
                  }
                >
                  <Text
                    style={[
                      styles.navSelectorText,
                      viewMode === 'year' && styles.navSelectorTextActive,
                    ]}
                  >
                    {currentYear}
                  </Text>
                  <Ionicons
                    name={viewMode === 'year' ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={viewMode === 'year' ? '#187682' : '#72898d'}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handleNextMonth}
              >
                <Ionicons name="chevron-forward" size={18} color="#187682" />
              </TouchableOpacity>
            </View>

            {/* BODY TAMPILAN: KALENDER, PILIH BULAN, ATAU PILIH TAHUN */}
            {viewMode === 'month' && (
              <View style={styles.gridPickerWrap}>
                <Text style={styles.gridPickerHint}>Pilih Bulan:</Text>
                <View style={styles.monthsGrid}>
                  {MONTH_NAMES.map((mName, idx) => {
                    const isCur = idx === currentMonth;
                    return (
                      <TouchableOpacity
                        key={mName}
                        style={[
                          styles.monthItem,
                          isCur && styles.monthItemActive,
                        ]}
                        onPress={() => {
                          setCurrentMonth(idx);
                          setViewMode('calendar');
                        }}
                      >
                        <Text
                          style={[
                            styles.monthItemText,
                            isCur && styles.monthItemTextActive,
                          ]}
                        >
                          {mName.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {viewMode === 'year' && (
              <View style={styles.gridPickerWrap}>
                <Text style={styles.gridPickerHint}>Pilih Tahun:</Text>
                <ScrollView
                  style={{ maxHeight: 220 }}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.yearsGrid}>
                    {yearsList.map((yVal) => {
                      const isCur = yVal === currentYear;
                      return (
                        <TouchableOpacity
                          key={yVal}
                          style={[
                            styles.yearItem,
                            isCur && styles.yearItemActive,
                          ]}
                          onPress={() => {
                            setCurrentYear(yVal);
                            setViewMode('calendar');
                          }}
                        >
                          <Text
                            style={[
                              styles.yearItemText,
                              isCur && styles.yearItemTextActive,
                            ]}
                          >
                            {yVal}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {viewMode === 'calendar' && (
              <View style={styles.calendarWrap}>
                {/* Header Hari: Min, Sen, Sel, ... */}
                <View style={styles.dayNamesRow}>
                  {DAY_LABELS.map((dLabel, i) => (
                    <Text
                      key={dLabel}
                      style={[
                        styles.dayNameText,
                        i === 0 && { color: '#b3261e' }, // Minggu warna merah
                      ]}
                    >
                      {dLabel}
                    </Text>
                  ))}
                </View>

                {/* Grid Tanggal */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <View key={`empty-${idx}`} style={styles.dayCell} />;
                    }

                    const isSelected =
                      selectedDay === dayNum &&
                      initial.year === currentYear &&
                      initial.month === currentMonth;

                    return (
                      <TouchableOpacity
                        key={`day-${dayNum}`}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellActive,
                        ]}
                        onPress={() => handleSelectDay(dayNum)}
                        activeOpacity={0.65}
                      >
                        <Text
                          style={[
                            styles.dayCellText,
                            isSelected && styles.dayCellTextActive,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Footer Modal: Tombol Hari Ini & Batal */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={handleSetToday}
              >
                <Ionicons name="time-outline" size={14} color="#187682" />
                <Text style={styles.todayBtnText}>Hari Ini</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfe2e4',
    borderRadius: 8,
    backgroundColor: '#fbfcfc',
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 38,
  },
  inputBoxError: {
    borderColor: '#b3261e',
    backgroundColor: '#fffbfa',
  },
  inputBoxDisabled: {
    backgroundColor: '#f0f4f5',
    borderColor: '#e1eaec',
  },
  icon: {
    marginRight: 8,
  },
  valueText: {
    flex: 1,
    fontSize: 12,
    color: '#1f2d30',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9db0b3',
    fontWeight: '400',
  },
  webInputWrap: {
    width: '100%',
  },
  errorText: {
    fontSize: 10.5,
    color: '#b3261e',
    marginTop: 4,
  },
  /* Modal Overlay & Card */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#187682',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#a3d9df',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Month & Year Navigation */
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf3f4',
    backgroundColor: '#f8fafb',
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSelectGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d2e5e7',
  },
  navSelectorActive: {
    backgroundColor: '#e6f3f4',
    borderColor: '#187682',
  },
  navSelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2d30',
  },
  navSelectorTextActive: {
    color: '#187682',
  },
  /* Calendar Grid */
  calendarWrap: {
    padding: 12,
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f5',
  },
  dayNameText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#71898e',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellActive: {
    backgroundColor: '#187682',
  },
  dayCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2a3b3e',
  },
  dayCellTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  /* Month & Year Pickers */
  gridPickerWrap: {
    padding: 14,
  },
  gridPickerHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#657e82',
    marginBottom: 10,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthItem: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5fafb',
    borderWidth: 1,
    borderColor: '#e2eff0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthItemActive: {
    backgroundColor: '#187682',
    borderColor: '#187682',
  },
  monthItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2b3f42',
  },
  monthItemTextActive: {
    color: '#ffffff',
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearItem: {
    width: '30%',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f5fafb',
    borderWidth: 1,
    borderColor: '#e2eff0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearItemActive: {
    backgroundColor: '#187682',
    borderColor: '#187682',
  },
  yearItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2b3f42',
  },
  yearItemTextActive: {
    color: '#ffffff',
  },
  /* Footer */
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf3f4',
    backgroundColor: '#f8fafb',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#e6f3f4',
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#187682',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 11,
    color: '#657e82',
    fontWeight: '600',
  },
});
