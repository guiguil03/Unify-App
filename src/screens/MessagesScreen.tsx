import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMessages } from '../hooks/useMessages';
import { useGroupChats } from '../hooks/useGroupChats';
import { MessagePreview } from '../components/messages/MessagePreview';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { COLORS } from '../constants/colors';
import { GroupChatPreview } from '../types/groupChat';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PremiumModal } from '../components/common/PremiumModal';

type Tab = 'messages' | 'groupes';

export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { messages, loading: loadingMessages, error: errorMessages } = useMessages();
  const { groupChats, loading: loadingGroups, error: errorGroups, refetch } = useGroupChats();
  const navigation = useNavigation<NavigationProp>();
  const { isPremium } = useSubscription();

  const handleMessagePress = (contactId: string, contactName: string, contactAvatar?: string) => {
    navigation.navigate('Chat', { contactId, contactName, contactAvatar });
  };

  const handleGroupPress = (groupChatId: string, groupName: string) => {
    navigation.navigate('GroupChat', { groupChatId, groupName });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec back + titre */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groupes' && styles.tabActive]}
          onPress={() => setActiveTab('groupes')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'groupes' && styles.tabTextActive]}>
            Groupes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      {activeTab === 'messages' ? (
        loadingMessages ? (
          <LoadingSpinner message="Chargement des messages..." />
        ) : errorMessages ? (
          <ErrorMessage message={errorMessages} />
        ) : !messages || messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="message-outline" size={64} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.emptyText}>
              Vos conversations s'afficheront ici.{'\n'}
              Commencez une nouvelle conversation avec vos contacts !
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessagePreview
                message={item}
                onPress={() => handleMessagePress(item.contactId, item.contactName, item.contactAvatar)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        /* Onglet Groupes */
        loadingGroups ? (
          <LoadingSpinner message="Chargement des groupes..." />
        ) : errorGroups ? (
          <ErrorMessage message={errorGroups} />
        ) : groupChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={64} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Aucun groupe</Text>
            <Text style={styles.emptyText}>
              Créez un groupe pour discuter avec plusieurs contacts en même temps !
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupChats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <GroupChatCard group={item} onPress={() => handleGroupPress(item.id, item.name)} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={loadingGroups}
          />
        )
      )}

      {/* FAB sur l'onglet Groupes */}
      {activeTab === 'groupes' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (!isPremium) {
              setShowPremiumModal(true);
              return;
            }
            navigation.navigate('CreateGroup');
          }}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}

      <PremiumModal
        visible={showPremiumModal}
        feature="La création de groupes"
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          setShowPremiumModal(false);
          navigation.navigate('Settings');
        }}
      />
    </SafeAreaView>
  );
}

function GroupChatCard({ group, onPress }: { group: GroupChatPreview; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.groupCard} onPress={onPress} activeOpacity={0.7}>
      {/* Avatars empilés */}
      <View style={styles.groupAvatarStack}>
        {group.memberAvatars.length > 0 ? (
          group.memberAvatars.slice(0, 2).map((avatar, i) => (
            <View key={i} style={[styles.stackedAvatar, { left: i * 16, zIndex: 10 - i }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.stackedAvatarImg} />
              ) : (
                <View style={[styles.stackedAvatarImg, styles.stackedAvatarPlaceholder]}>
                  <MaterialCommunityIcons name="account" size={16} color={COLORS.primary} />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={[styles.stackedAvatar, { left: 0 }]}>
            <View style={[styles.stackedAvatarImg, styles.stackedAvatarPlaceholder]}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.groupTime}>{group.time}</Text>
        </View>
        <View style={styles.groupMeta}>
          <Text style={styles.groupLastMessage} numberOfLines={1}>
            {group.lastMessage || 'Aucun message'}
          </Text>
          <View style={styles.memberCountBadge}>
            <MaterialCommunityIcons name="account-multiple" size={12} color={COLORS.primary} />
            <Text style={styles.memberCount}>{group.memberCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  list: {
    padding: 16,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Group card
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  groupAvatarStack: {
    width: 52,
    height: 44,
    position: 'relative',
  },
  stackedAvatar: {
    position: 'absolute',
    top: 0,
  },
  stackedAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  stackedAvatarPlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  groupTime: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupLastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
  },
  memberCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
