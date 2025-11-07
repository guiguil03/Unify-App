import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useContacts } from '../hooks/useContacts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ContactCard } from '../components/contacts/ContactCard';
import { ContactsService } from '../services/ContactsService';
import { Contact, ContactRequest, ContactRelationshipStatus } from '../types/contact';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/errorHandler';
import { NavigationProp } from '../types/navigation';
import { supabase } from '../config/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

type Tab = 'friends' | 'requests' | 'search';

export default function ContactsScreen() {
  const { contacts, loading, error, refetch, addContact: addContactAction, removeContact, relationships } = useContacts();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ContactRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ContactRequest[]>([]);
  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      const { incoming, outgoing } = await ContactsService.getPendingRequests();
      setRequestsCount((incoming?.length || 0) + (outgoing?.length || 0));
    } catch (e) {
      setRequestsCount(0);
    }
  }, []);

  const loadPendingRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const { incoming, outgoing } = await ContactsService.getPendingRequests();
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setRequestsCount((incoming?.length || 0) + (outgoing?.length || 0));
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      loadPendingRequests();
    } else if (activeTab === 'friends') {
      // Rafraîchir uniquement au changement d'onglet avec loading
      setIsLoadingFriends(true);
      refetch().finally(() => setIsLoadingFriends(false));
    }
  }, [activeTab]); // Ne pas inclure loadPendingRequests ou refetch dans les dépendances

  useFocusEffect(
    useCallback(() => {
      loadCounts();
      if (activeTab === 'requests') {
        loadPendingRequests();
      }
    }, [activeTab, loadCounts, loadPendingRequests])
  );

  // Mettre à jour le compteur d'amis quand contacts change
  useEffect(() => {
    setFriendsCount(contacts.length);
  }, [contacts]);

  // Realtime subscription pour les demandes de contacts
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeForRequests = async () => {
      try {
        const currentUser = await getCurrentUserFromDB();
        if (!currentUser) return;

        console.log('🟢 Setting up realtime subscription for requests');

        channel = supabase
          .channel('requests-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'contacts',
              filter: `contact_id=eq.${currentUser.id}`,
            },
            async (payload: RealtimePostgresChangesPayload<any>) => {
              console.log('🟢 Received realtime event for requests:', payload.eventType, payload);

              // Rafraîchir les demandes et les compteurs
              await loadPendingRequests();
              await loadCounts();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'contacts',
              filter: `user_id=eq.${currentUser.id}`,
            },
            async (payload: RealtimePostgresChangesPayload<any>) => {
              console.log('🟢 Received realtime event for sent requests:', payload.eventType, payload);

              // Rafraîchir les demandes et les compteurs
              await loadPendingRequests();
              await loadCounts();
            }
          )
          .subscribe((status) => {
            console.log('🟢 Requests subscription status:', status);
          });
      } catch (error) {
        console.error('Error setting up realtime:', error);
      }
    };

    setupRealtimeForRequests();

    return () => {
      if (channel) {
        console.log('🟢 Cleaning up requests realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Rechercher des utilisateurs
  useEffect(() => {
    if (activeTab === 'search' && searchQuery.trim().length > 2) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const results = await ContactsService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    setIncomingRequests(prev => prev.filter(req => {
      const status = relationships[req.id];
      return !status || status === 'incoming';
    }));

    setOutgoingRequests(prev => prev.filter(req => {
      const status = relationships[req.id];
      return !status || status === 'pending';
    }));
  }, [relationships]);

  useEffect(() => {
    setRequestsCount(incomingRequests.length + outgoingRequests.length);
  }, [incomingRequests, outgoingRequests]);

  const handleAddContact = async (contactId: string) => {
    const result = await addContactAction(contactId);

    if (result.success) {
      showSuccessToast('Demande d\'ami envoyée ! 🎉');
      setSearchResults(prev => prev.filter(c => c.id !== contactId));
      loadPendingRequests();
      // Mettre à jour le compteur immédiatement
      setRequestsCount(prev => prev + 1);
      return;
    }

    switch (result.reason) {
      case 'already_friends':
        showInfoToast('Vous êtes déjà amis.');
        break;
      case 'already_sent':
        showInfoToast('Vous avez déjà envoyé une demande à cet utilisateur.');
        break;
      case 'incoming_request':
        showInfoToast('Cette personne vous a déjà envoyé une demande. Consultez vos demandes.');
        setActiveTab('requests');
        break;
      case 'blocked':
        showErrorToast('Vous ne pouvez pas envoyer de demande à cet utilisateur.');
        break;
      default:
        showErrorToast('Impossible d\'envoyer la demande');
        break;
    }
  };

  const handleAcceptRequest = async (senderId: string) => {
    try {
      await ContactsService.acceptContactRequest(senderId);
      showSuccessToast('Demande acceptée ! 🎉');
      setIncomingRequests(prev => prev.filter(c => c.id !== senderId));

      // Rafraîchir immédiatement les contacts et les compteurs
      await refetch();
      await loadPendingRequests();

      // Mettre à jour les compteurs instantanément
      setRequestsCount(prev => Math.max(0, prev - 1));
      setFriendsCount(prev => prev + 1);
    } catch (error) {
      showErrorToast('Impossible d\'accepter la demande');
    }
  };

  const handleRejectRequest = async (senderId: string) => {
    try {
      await ContactsService.rejectContactRequest(senderId);
      showSuccessToast('Demande refusée');
      setIncomingRequests(prev => prev.filter(c => c.id !== senderId));
      loadPendingRequests();
      setRequestsCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      showErrorToast('Impossible de refuser la demande');
    }
  };

  const handleChatPress = (contact: Contact) => {
    navigation.navigate('Chat', {
      contactId: contact.id,
      contactName: contact.name,
    });
  };

  const handleRemoveContact = async (contactId: string) => {
    const success = await removeContact(contactId);
    if (success) {
      showSuccessToast('Contact supprimé');
      refetch();
      setIncomingRequests(prev => prev.filter(req => req.id !== contactId));
      setOutgoingRequests(prev => prev.filter(req => req.id !== contactId));
      loadPendingRequests();
      // Mettre à jour le compteur d'amis instantanément
      setFriendsCount(prev => Math.max(0, prev - 1));
    } else {
      showErrorToast('Impossible de supprimer le contact');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadCounts();
      if (activeTab === 'friends') {
        await refetch();
      } else if (activeTab === 'requests') {
        await loadPendingRequests();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Supprimer le spinner full-screen pour permettre le chargement en arrière-plan
  // Le loading sera géré par le RefreshControl à la place

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <MaterialCommunityIcons 
            name="account-group" 
            size={20} 
            color={activeTab === 'friends' ? '#E83D4D' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Mes amis ({friendsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <MaterialCommunityIcons 
            name="account-clock" 
            size={20} 
            color={activeTab === 'requests' ? '#E83D4D' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Demandes ({requestsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <MaterialCommunityIcons 
            name="account-plus" 
            size={20} 
            color={activeTab === 'search' ? '#E83D4D' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Ajouter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#E83D4D']}
            tintColor="#E83D4D"
          />
        }
      >
        {/* Mes amis */}
        {activeTab === 'friends' && (
          <View>
            {isLoadingFriends ? (
              <ActivityIndicator size="large" color="#E83D4D" style={{ marginTop: 32 }} />
            ) : contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Aucun ami pour le moment</Text>
                <Text style={styles.emptySubtext}>
                  Recherchez des coureurs pour commencer à échanger !
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setActiveTab('search')}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Ajouter des amis</Text>
                </TouchableOpacity>
              </View>
            ) : (
              contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onChatPress={handleChatPress}
                  onRemove={(c) => handleRemoveContact(c.id)}
                  relationshipStatus="friends"
                />
              ))
            )}
          </View>
        )}

        {/* Demandes en attente */}
        {activeTab === 'requests' && (
          <View>
            {isLoadingRequests ? (
              <ActivityIndicator size="large" color="#E83D4D" style={{ marginTop: 32 }} />
            ) : incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-clock-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Aucune demande en attente</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {incomingRequests.length > 0 && (
                  <View style={styles.requestsSection}>
                    <Text style={styles.sectionTitle}>Demandes reçues</Text>
                    {incomingRequests.map((request) => (
                      <ContactCard
                        key={`incoming-${request.id}`}
                        contact={request}
                        onChatPress={handleChatPress}
                        onRemove={(contact) => handleRejectRequest(contact.id)}
                        onAcceptRequest={(contact) => handleAcceptRequest(contact.id)}
                        relationshipStatus="incoming"
                      />
                    ))}
                  </View>
                )}

                {outgoingRequests.length > 0 && (
                  <View style={styles.requestsSection}>
                    <Text style={styles.sectionTitle}>Demandes envoyées</Text>
                    {outgoingRequests.map((request) => (
                      <ContactCard
                        key={`outgoing-${request.id}`}
                        contact={request}
                        onChatPress={handleChatPress}
                        onRemove={(contact) => handleRemoveContact(contact.id)}
                        relationshipStatus="pending"
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Recherche */}
        {activeTab === 'search' && (
          <View>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher des coureurs..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {isSearching ? (
              <ActivityIndicator size="large" color="#E83D4D" style={{ marginTop: 32 }} />
            ) : searchQuery.trim().length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Recherchez des coureurs</Text>
                <Text style={styles.emptySubtext}>
                  Tapez un nom pour trouver de nouveaux amis
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-off-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Aucun résultat</Text>
              </View>
            ) : (
              searchResults.map((user) => {
                const relationshipStatus = relationships[user.id] ?? 'none';

                return (
                  <View key={user.id} style={styles.searchResultCard}>
                    <View style={styles.resultInfo}>
                      {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <MaterialCommunityIcons name="account" size={24} color="#999" />
                        </View>
                      )}
                      <Text style={styles.resultName}>{user.name}</Text>
                    </View>

                    {relationshipStatus === 'none' ? (
                      <TouchableOpacity
                        style={styles.addContactButton}
                        onPress={() => handleAddContact(user.id)}
                      >
                        <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                        <Text style={styles.addContactButtonText}>Ajouter</Text>
                      </TouchableOpacity>
                    ) : relationshipStatus === 'friends' ? (
                      <View style={[styles.statusPill, styles.friendsPill]}>
                        <MaterialCommunityIcons name="check-circle" size={18} color="#2E7D32" />
                        <Text style={[styles.statusPillText, styles.friendsPillText]}>Déjà amis</Text>
                      </View>
                    ) : relationshipStatus === 'pending' ? (
                      <View style={[styles.statusPill, styles.pendingPill]}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#FF8F00" />
                        <Text style={[styles.statusPillText, styles.pendingPillText]}>Demande envoyée</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.statusPill, styles.incomingPill]}
                        onPress={() => setActiveTab('requests')}
                      >
                        <MaterialCommunityIcons name="account-clock" size={18} color="#0288D1" />
                        <Text style={[styles.statusPillText, styles.incomingPillText]}>Demande reçue</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#E83D4D',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#E83D4D',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E83D4D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF5252',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestsList: {
    gap: 24,
  },
  requestsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E83D4D',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  addContactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  friendsPill: {
    borderColor: '#C8E6C9',
    backgroundColor: '#E8F5E9',
  },
  friendsPillText: {
    color: '#2E7D32',
  },
  pendingPill: {
    borderColor: '#FFE082',
    backgroundColor: '#FFF8E1',
  },
  pendingPillText: {
    color: '#FF8F00',
  },
  incomingPill: {
    borderColor: '#B3E5FC',
    backgroundColor: '#E1F5FE',
  },
  incomingPillText: {
    color: '#0288D1',
  },
});