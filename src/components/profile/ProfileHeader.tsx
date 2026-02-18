import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Profile } from '../../types/profile';
import { NavigationProp } from '../../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = useSubscription();
  const [photoVisible, setPhotoVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const openPhoto = () => {
    if (!profile.avatar) return;
    setPhotoVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closePhoto = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 160, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setPhotoVisible(false);
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={openPhoto} activeOpacity={profile.avatar ? 0.85 : 1}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={60} color="#999" />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{profile.name}</Text>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <MaterialCommunityIcons name="crown" size={13} color="#FFD700" />
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        )}
      </View>

      {profile.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.addBio}>+ Ajouter une biographie</Text>
        </TouchableOpacity>
      )}

      {/* Viewer plein écran */}
      <Modal visible={photoVisible} transparent statusBarTranslucent animationType="none" onRequestClose={closePhoto}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <StatusBar hidden />
          <Pressable style={styles.backdropPress} onPress={closePhoto} />

          <Animated.Image
            source={{ uri: profile.avatar! }}
            style={[styles.fullImage, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 12 }]}
            onPress={closePhoto}
          >
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7D80F4',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
  },
  bio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  addBio: {
    fontSize: 14,
    color: '#7D80F4',
    fontStyle: 'italic',
  },
  // Viewer
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
