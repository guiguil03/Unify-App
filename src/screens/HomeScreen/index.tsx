import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Header } from './components/Header';
import { Content } from './components/Content';
import { BottomNavigation } from './components/BottomNavigation';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <Content />
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});