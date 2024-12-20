import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp } from '../../../types/navigation';

export function Header() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <MaterialCommunityIcons name="cog" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Accueil</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
        <MaterialCommunityIcons name="message" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});