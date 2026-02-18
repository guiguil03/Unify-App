import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Runner } from '../../types/runner';
import { ContactRelationshipStatus } from '../../types/contact';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface ClusterCarouselProps {
  visible: boolean;
  runners: Runner[];
  relationships: Record<string, ContactRelationshipStatus>;
  onClose: () => void;
  onRunnerPress: (runner: Runner) => void;
  onConnect: (runnerId: string) => void;
  onMessage: (runnerId: string, runnerName: string, avatar?: string) => void;
}

export function ClusterCarousel({
  visible,
  runners,
  relationships,
  onClose,
  onRunnerPress,
  onConnect,
  onMessage,
}: ClusterCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!visible || runners.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
          <Text style={styles.title}>
            {runners.length} coureur{runners.length > 1 ? 's' : ''} à proximité
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <FlatList
        data={runners}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          setActiveIndex(Math.max(0, Math.min(index, runners.length - 1)));
        }}
        renderItem={({ item }) => (
          <RunnerCard
            runner={item}
            status={relationships[item.id] ?? 'none'}
            onPress={() => onRunnerPress(item)}
            onConnect={() => onConnect(item.id)}
            onMessage={() => onMessage(item.id, item.name, item.avatar)}
          />
        )}
      />

      {/* Dots indicateurs */}
      {runners.length > 1 && (
        <View style={styles.dots}>
          {runners.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function RunnerCard({
  runner,
  status,
  onPress,
  onConnect,
  onMessage,
}: {
  runner: Runner;
  status: ContactRelationshipStatus | 'none';
  onPress: () => void;
  onConnect: () => void;
  onMessage: () => void;
}) {
  const isFriends = status === 'friends';
  const isIncoming = status === 'incoming';
  const showConnect = status === 'none';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Avatar + dot statut */}
      <View style={styles.avatarContainer}>
        {runner.avatar ? (
          <Image source={{ uri: runner.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>
              {runner.name
                .split(' ')
                .map((w) => w[0] ?? '')
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.statusDot,
            { backgroundColor: runner.isActive !== false ? COLORS.success : '#9E9E9E' },
          ]}
        />
      </View>

      {/* Nom */}
      <Text style={styles.runnerName} numberOfLines={1}>
        {runner.name}
      </Text>

      {/* Stats */}
      <View style={styles.stats}>
        {runner.pace ? (
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="speedometer" size={13} color={COLORS.textLight} />
            <Text style={styles.statText}>{runner.pace}</Text>
          </View>
        ) : null}
        {runner.distance != null && runner.distance > 0 ? (
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={13} color={COLORS.textLight} />
            <Text style={styles.statText}>{runner.distance.toFixed(1)} km</Text>
          </View>
        ) : null}
      </View>

      {/* Badge relation */}
      {status !== 'none' && (
        <View style={[styles.statusBadge, statusBadgeStyle[status]]}>
          <Text style={[styles.statusBadgeText, statusTextStyle[status]]}>
            {statusLabel[status]}
          </Text>
        </View>
      )}

      {/* Boutons d'action */}
      <View style={styles.actions}>
        {showConnect && (
          <TouchableOpacity style={styles.connectBtn} onPress={onConnect} activeOpacity={0.8}>
            <MaterialCommunityIcons name="account-plus" size={17} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {isIncoming && (
          <TouchableOpacity style={styles.acceptBtn} onPress={onConnect} activeOpacity={0.8}>
            <MaterialCommunityIcons name="account-check" size={17} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.messageBtn, isFriends && styles.messageBtnFriends]}
          onPress={onMessage}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="message-text" size={16} color="white" />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Hint "Voir le profil" */}
      <Text style={styles.viewProfile}>Appuyer pour voir le profil complet</Text>
    </TouchableOpacity>
  );
}

const statusLabel: Record<string, string> = {
  friends: 'Amis',
  pending: 'En attente',
  incoming: 'Demande reçue',
};

const statusBadgeStyle: Record<string, object> = {
  friends: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  pending: { backgroundColor: '#FFF8E1', borderColor: '#FFE082' },
  incoming: { backgroundColor: '#E1F5FE', borderColor: '#B3E5FC' },
};

const statusTextStyle: Record<string, object> = {
  friends: { color: '#2E7D32' },
  pending: { color: '#FF8F00' },
  incoming: { color: '#0288D1' },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  runnerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  connectBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageBtnFriends: {
    backgroundColor: COLORS.primaryDark,
  },
  messageBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  viewProfile: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 18,
    borderRadius: 3,
  },
});
