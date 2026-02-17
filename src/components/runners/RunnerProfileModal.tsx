import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '../common/Modal';
import { Runner } from '../../types/runner';
import { RunnerHeader } from './components/RunnerHeader';
import { RunnerStats } from './components/RunnerStats';
import { ConnectButton } from './components/ConnectButton';
import { ContactRelationshipStatus } from '../../types/contact';

interface RunnerProfileModalProps {
  visible: boolean;
  runner: Runner | null;
  onClose: () => void;
  onConnect: (runnerId: string) => void;
  relationshipStatus?: ContactRelationshipStatus | 'none';
}

export function RunnerProfileModal({
  visible,
  runner,
  onClose,
  onConnect,
  relationshipStatus,
}: RunnerProfileModalProps) {
  // Ne pas rendre le modal si runner est null ou si visible est false
  if (!visible || !runner) return null;

  const handleClose = () => {
    // S'assurer que runner existe avant de fermer
    onClose();
  };

  // Vérifications de sécurité pour éviter les crashes
  const safePace = runner.pace || 'N/A';
  const safeDistance = runner.distance ?? 0;
  const safeName = runner.name || 'Utilisateur';
  const safeBio = runner.bio || "Pas de description";

  return (
    <Modal visible={visible} onClose={handleClose}>
      <RunnerHeader name={safeName} avatar={runner.avatar} />
      <RunnerStats pace={safePace} distance={safeDistance} />
      
      <View style={styles.bio}>
        <Text style={styles.bioTitle}>À propos</Text>
        <Text style={styles.bioText}>{safeBio}</Text>
      </View>

      <ConnectButton
        status={relationshipStatus}
        onConnect={() => {
          if (runner?.id) {
            onConnect(runner.id);
          }
        }}
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