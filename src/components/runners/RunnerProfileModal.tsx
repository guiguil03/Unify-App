import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '../common/Modal';
import { Runner } from '../../types/runner';
import { RunnerHeader } from './components/RunnerHeader';
import { RunnerStats } from './components/RunnerStats';
import { ConnectButton } from './components/ConnectButton';

interface RunnerProfileModalProps {
  visible: boolean;
  runner: Runner | null;
  onClose: () => void;
  onConnect: (runnerId: string) => void;
  isConnected: boolean;
}

export function RunnerProfileModal({
  visible,
  runner,
  onClose,
  onConnect,
  isConnected,
}: RunnerProfileModalProps) {
  if (!runner) return null;

  return (
    <Modal visible={visible} onClose={onClose}>
      <RunnerHeader name={runner.name} avatar={runner.avatar} />
      <RunnerStats pace={runner.pace} distance={runner.distance} />
      
      <View style={styles.bio}>
        <Text style={styles.bioTitle}>À propos</Text>
        <Text style={styles.bioText}>{runner.bio || "Pas de description"}</Text>
      </View>

      <ConnectButton
        isConnected={isConnected}
        onConnect={() => onConnect(runner.id)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  bio: {
    marginBottom: 24,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});