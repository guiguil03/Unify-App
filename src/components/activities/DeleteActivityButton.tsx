import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DeleteActivityButtonProps {
  onDelete: () => void;
  style?: object;
}

export function DeleteActivityButton({ onDelete, style }: DeleteActivityButtonProps) {
  const handlePress = () => {
    Alert.alert(
      'Supprimer l\'activité',
      'Êtes-vous sûr de vouloir supprimer cette activité ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: onDelete,
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={[styles.deleteButton, style]}
      onPress={handlePress}
    >
      <MaterialCommunityIcons name="delete" size={24} color="#ff4444" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    padding: 8,
  },
});