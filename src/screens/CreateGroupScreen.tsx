import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { ContactsService } from '../services/ContactsService';
import { GroupChatsService } from '../services/GroupChatsService';
import { Contact } from '../types/contact';
import { COLORS } from '../constants/colors';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function CreateGroupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = useSubscription();
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [creating, setCreating] = useState(false);

  // Garde premium — sécurise en cas de navigation directe
  if (!isPremium) {
    return (
      <View style={styles.premiumGate}>
        <View style={styles.crownWrap}>
          <MaterialCommunityIcons name="crown" size={40} color="#FFD700" />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PREMIUM</Text>
        </View>
        <Text style={styles.premiumTitle}>Fonctionnalité{'\n'}exclusive</Text>
        <Text style={styles.premiumText}>
          La création de groupes est réservée aux abonnés Premium.{'\n'}
          Rejoignez Premium pour en profiter !
        </Text>
        <TouchableOpacity
          style={styles.premiumButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="crown-outline" size={18} color="white" />
          <Text style={styles.premiumButtonText}>Passer à Premium — 9.99€/mois</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    ContactsService.getContacts()
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, []);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canCreate = groupName.trim().length > 0 && selectedIds.size > 0;

  const handleCreate = async () => {
    if (!canCreate || creating) return;
    try {
      setCreating(true);
      const group = await GroupChatsService.createGroupChat(
        groupName.trim(),
        Array.from(selectedIds)
      );
      navigation.replace('GroupChat', { groupChatId: group.id, groupName: group.name });
    } catch (err) {
      if (__DEV__) console.error('Create group failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Nom du groupe */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOM DU GROUPE</Text>
        <TextInput
          style={styles.nameInput}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Ex : Team running 🏃"
          placeholderTextColor={COLORS.textLight}
          maxLength={50}
          autoFocus
        />
      </View>

      {/* Sélection des membres */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          MEMBRES ({selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''})
        </Text>
      </View>

      {loadingContacts ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.primary} />
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContacts}>
          <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Aucun contact disponible</Text>
          <Text style={styles.emptySubText}>Ajoutez des contacts pour créer un groupe</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.contactRow, selected && styles.contactRowSelected]}
                onPress={() => toggleContact(item.id)}
                activeOpacity={0.7}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
                  </View>
                )}
                <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && (
                    <MaterialCommunityIcons name="check" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.contactsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bouton créer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!canCreate || creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="white" />
              <Text style={styles.createButtonText}>Créer le groupe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  premiumGate: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  crownWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  premiumText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 21,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  backLink: {
    paddingVertical: 4,
  },
  backLinkText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emptyContacts: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
