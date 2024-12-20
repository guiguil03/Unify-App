import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <Text style={styles.error}>{message}</Text>
);

const styles = StyleSheet.create({
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 8,
    textAlign: 'center',
  },
});