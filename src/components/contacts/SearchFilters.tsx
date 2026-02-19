import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface SearchFilterState {
  level: string;
  preferredTime: string;
}

interface SearchFiltersProps {
  filters: SearchFilterState;
  onFiltersChange: (filters: SearchFilterState) => void;
  activeCount: number;
}

const LEVELS = ['Tous', 'Débutant', 'Intermédiaire', 'Avancé'];
const TIMES = ['Tous', 'Matin', 'Midi', 'Soir'];

export function SearchFilters({ filters, onFiltersChange, activeCount }: SearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 140;
    Animated.spring(heightAnim, {
      toValue,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
    setOpen(prev => !prev);
  };

  const setLevel = (level: string) => {
    onFiltersChange({ ...filters, level: level === 'Tous' ? '' : level });
  };

  const setTime = (time: string) => {
    onFiltersChange({ ...filters, preferredTime: time === 'Tous' ? '' : time });
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={toggle} activeOpacity={0.7}>
        <MaterialCommunityIcons name="filter-variant" size={20} color={activeCount > 0 ? '#fff' : '#7D80F4'} />
        {activeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Animated.View style={[styles.panel, { height: heightAnim, overflow: 'hidden' }]}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Niveau</Text>
          <View style={styles.pills}>
            {LEVELS.map(l => {
              const active = l === 'Tous' ? !filters.level : filters.level === l;
              return (
                <TouchableOpacity
                  key={l}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setLevel(l)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Horaire</Text>
          <View style={styles.pills}>
            {TIMES.map(t => {
              const active = t === 'Tous' ? !filters.preferredTime : filters.preferredTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setTime(t)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7D80F415',
    borderWidth: 1,
    borderColor: '#7D80F440',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7D80F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  filterSection: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  pillActive: {
    backgroundColor: '#7D80F426',
    borderColor: '#7D80F4',
  },
  pillText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#7D80F4',
    fontWeight: '700',
  },
});
