import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ActivityMap } from '../components/activities/ActivityMap';
import { ActivityStats } from '../components/activities/ActivityStats';
import { ActivityPauses } from '../components/activities/ActivityPauses';
import { DeleteActivityButton } from '../components/activities/DeleteActivityButton';
import { NavigationProp } from '../types/navigation';
import { useActivitiesManager } from '../hooks/useActivitiesManager';

interface ActivityDetailScreenProps {
  route: {
    params: {
      activityId: string;
    };
  };
}

export default function ActivityDetailScreen({ route }: ActivityDetailScreenProps) {
  const { activityId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { activities, deleteActivity } = useActivitiesManager();
  
  const activity = activities.find(a => a.id === activityId);

  if (!activity) {
    return null;
  }

  const initialRegion = activity.route?.coordinates[0] ? {
    latitude: activity.route.coordinates[0].latitude,
    longitude: activity.route.coordinates[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : null;

  const handleDelete = () => {
    deleteActivity(activity.id);
    navigation.goBack();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <DeleteActivityButton
          onDelete={handleDelete}
          style={styles.headerButton}
        />
      ),
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      {activity.route && initialRegion && (
        <ActivityMap route={activity.route} initialRegion={initialRegion} />
      )}

      <View style={styles.details}>
        <View style={styles.statCard}>
          <Text style={styles.title}>Détails de l'activité</Text>
          <ActivityStats activity={activity} />
          {activity.route && <ActivityPauses pauses={activity.route.pauses} />}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerButton: {
    marginRight: 8,
  },
  details: {
    padding: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});