import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ActivityCard } from "../components/activities/ActivityCard";
import { AddActivityModal } from "../components/activities/AddActivityModal";
import { LiveActivity } from "../components/activities/LiveActivity";
import { Activity } from "../types/activity";
import { useActivitiesManager } from "../hooks/useActivitiesManager";
import { NavigationProp } from "../types/navigation";
import { BottomNav } from "../components/common/BottomNav";

export default function ActivitiesScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLiveActivityActive, setIsLiveActivityActive] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { activities, addActivity, deleteActivity } = useActivitiesManager();

  const handleActivityPress = (activity: Activity) => {
    navigation.navigate("ActivityDetail", {
      activityId: activity.id,
    });
  };

  const handleAddManualActivity = async (newActivity: {
    distance: number;
    duration: string;
    date: string;
  }) => {
    try {
      await addActivity({
        distance: newActivity.distance,
        duration: newActivity.duration,
        date: newActivity.date,
      });
      setIsModalVisible(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'activité:', error);
    }
  };

  const handleFinishLiveActivity = async (newActivity: {
    distance: number;
    duration: string;
    date: string;
  }) => {
    try {
      await addActivity({
        distance: newActivity.distance,
        duration: newActivity.duration,
        date: newActivity.date,
      });
      setIsLiveActivityActive(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    }
  };


  if (isLiveActivityActive) {
    return (
      <LiveActivity
        onFinish={handleFinishLiveActivity}
        onCancel={() => setIsLiveActivityActive(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}>
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="run" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucune activité</Text>
            <Text style={styles.emptySubtext}>
              Commencez votre première course en appuyant sur le bouton +
            </Text>
          </View>
        ) : (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={handleActivityPress}
              onDelete={deleteActivity}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>

      <AddActivityModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onStartLiveActivity={() => setIsLiveActivityActive(true)}
        onAddManualActivity={handleAddManualActivity}
      />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 90,
    backgroundColor: "#7D80F4",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
