import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RealtimeIndicatorProps {
  isActive: boolean;
}

export function RealtimeIndicator({ isActive }: RealtimeIndicatorProps) {
  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.pulse} />
        <MaterialCommunityIcons 
          name="broadcast" 
          size={14} 
          color="#2E7D32" 
        />
        <Text style={styles.text}>Temps réel</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
});

