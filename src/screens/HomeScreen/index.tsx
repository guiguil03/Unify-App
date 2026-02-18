import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Content } from './components/Content';
import { BottomNavigation } from './components/BottomNavigation';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Content />
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});