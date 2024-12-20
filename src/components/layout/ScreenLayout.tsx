import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';

interface ScreenLayoutProps {
  children: React.ReactNode;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
});