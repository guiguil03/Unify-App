import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Runner } from '../../types/runner';
import { RunnerCluster } from '../../utils/map/clustering';
import { MAP_STYLES } from '../../services/map/config';

interface ClusterMarkerProps {
  cluster: RunnerCluster;
  onPress: (runners: Runner[]) => void;
  maxAvatars?: number;
}

export function ClusterMarker({ cluster, onPress, maxAvatars = 3 }: ClusterMarkerProps) {
  const { runners, location } = cluster;
  const count = runners.length;
  // Nombre d'avatars à afficher selon le zoom courant (1 à 5)
  const visibleAvatars = runners.slice(0, Math.max(1, maxAvatars));
  const stackWidth = 36 + (visibleAvatars.length - 1) * 18;

  const handlePress = (e: any) => {
    e?.stopPropagation?.();
    if (onPress && typeof onPress === 'function') {
      onPress(runners);
    }
  };

  return (
    <Marker
      coordinate={location}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      zIndex={2000}
      tappable={true}
    >
      <View style={styles.wrapper} pointerEvents="box-none">
        {/* Bulle principale avec avatars empilés */}
        <View style={[styles.bubble, { width: stackWidth + 24 }]}>
          <View style={[styles.avatarStack, { width: stackWidth }]}>
            {visibleAvatars.map((runner, i) => (
              <View
                key={runner.id}
                style={[
                  styles.avatarRing,
                  {
                    left: i * 18,
                    zIndex: visibleAvatars.length - i,
                  },
                ]}
              >
                {runner.avatar ? (
                  <Image source={{ uri: runner.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.initials}>
                      {runner.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Badge count violet */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>

        {/* Petite pointe en bas */}
        <View style={styles.pointer} />
      </View>
    </Marker>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    minWidth: 60,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: MAP_STYLES.SELECTED_MARKER,
  },
  avatarStack: {
    height: AVATAR_SIZE,
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: MAP_STYLES.SELECTED_MARKER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: MAP_STYLES.SELECTED_MARKER,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  countText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
  pointer: {
    width: 12,
    height: 12,
    backgroundColor: MAP_STYLES.SELECTED_MARKER,
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
    borderRadius: 2,
  },
});
