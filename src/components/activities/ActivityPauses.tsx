import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityRoute } from '../../types/activity';
import { formatDuration } from '../../utils/format';

interface ActivityPausesProps {
  pauses: ActivityRoute['pauses'];
}

export function ActivityPauses({ pauses }: ActivityPausesProps) {
  if (!pauses.length) return null;

  return (
    <View style={styles.pausesSection}>
      <Text style={styles.subtitle}>Pauses</Text>
      {pauses.map((pause, index) => (
        <View key={index} style={styles.pause}>
          <MaterialCommunityIcons name="pause-circle" size={20} color="#ff4444" />
          <Text style={styles.pauseText}>
            Pause {index + 1}: {formatDuration((pause.endTime - pause.startTime) / 1000)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pausesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  pause: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pauseText: {
    fontSize: 14,
    color: '#666',
  },
});