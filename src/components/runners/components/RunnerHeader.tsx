import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface RunnerHeaderProps {
  name: string;
  avatar?: string;
}

export function RunnerHeader({ name, avatar }: RunnerHeaderProps) {
  return (
    <View style={styles.header}>
      <Image
        source={{ uri: avatar || 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
  },
});