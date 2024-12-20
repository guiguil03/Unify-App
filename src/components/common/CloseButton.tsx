import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CloseButtonProps {
  onPress: () => void;
}

export function CloseButton({ onPress }: CloseButtonProps) {
  return (
    <TouchableOpacity style={styles.closeButton} onPress={onPress}>
      <MaterialCommunityIcons name="close" size={24} color="#666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
    padding: 4,
  },
});