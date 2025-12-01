import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
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
      <ScrollView style={styles.scrollView}>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onPress={handleActivityPress}
            onDelete={deleteActivity}
          />
        ))}
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
