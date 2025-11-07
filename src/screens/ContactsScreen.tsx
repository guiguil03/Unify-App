import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContacts } from '../hooks/useContacts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ContactCard } from '../components/contacts/ContactCard';
import { ContactsService } from '../services/ContactsService';
import { Contact } from '../types/contact';
import { showSuccessToast, showErrorToast } from '../utils/errorHandler';

type Tab = 'friends' | 'requests' | 'search';

export default function ContactsScreen() {
  const { contacts, loading, error, refetch } = useContacts();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Charger les demandes en attente
  useEffect(() => {
    if (activeTab === 'requests') {
      loadPendingRequests();
    }
  }, [activeTab]);

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

  const loadPendingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const requests = await ContactsService.getPendingRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

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

  const handleAddContact = async (contactId: string) => {
    try {
      await ContactsService.addContact(contactId);
      showSuccessToast('Demande d\'ami envoyée ! 🎉');
      setSearchResults(prev => prev.filter(c => c.id !== contactId));
    } catch (error) {
      showErrorToast('Impossible d\'envoyer la demande');
    }
  };

  const handleAcceptRequest = async (senderId: string) => {
    try {
      await ContactsService.acceptContactRequest(senderId);
      showSuccessToast('Demande acceptée ! 🎉');
      setPendingRequests(prev => prev.filter(c => c.id !== senderId));
      refetch();
    } catch (error) {
      showErrorToast('Impossible d\'accepter la demande');
    }
  };

  const handleRejectRequest = async (senderId: string) => {
    try {
      await ContactsService.rejectContactRequest(senderId);
      showSuccessToast('Demande refusée');
      setPendingRequests(prev => prev.filter(c => c.id !== senderId));
    } catch (error) {
      showErrorToast('Impossible de refuser la demande');
    }
  };

  const handleChatPress = (contactId: string) => {
    // À implémenter: navigation vers la conversation
    console.log('Chat with contact:', contactId);
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await ContactsService.removeContact(contactId);
      showSuccessToast('Contact supprimé');
      refetch();
    } catch (error) {
      showErrorToast('Impossible de supprimer le contact');
    }
  };

  if (loading && activeTab === 'friends') {
    return <LoadingSpinner message="Chargement des contacts..." />;
  }

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
            Mes amis ({contacts.length})
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
            Demandes ({pendingRequests.length})
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
      <ScrollView style={styles.scrollView}>
        {/* Mes amis */}
        {activeTab === 'friends' && (
          <View>
            {contacts.length === 0 ? (
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
                  onRemove={handleRemoveContact}
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
            ) : pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-clock-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Aucune demande en attente</Text>
              </View>
            ) : (
              pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    {request.avatar ? (
                      <Image source={{ uri: request.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <MaterialCommunityIcons name="account" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.requestDetails}>
                      <Text style={styles.requestName}>{request.name}</Text>
                      <Text style={styles.requestStatus}>Demande d'ami</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(request.id)}
                    >
                      <MaterialCommunityIcons name="check" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(request.id)}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
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
              searchResults.map((user) => (
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
                  <TouchableOpacity
                    style={styles.addContactButton}
                    onPress={() => handleAddContact(user.id)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                    <Text style={styles.addContactButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              ))
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
});