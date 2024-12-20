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

  const handleAddManualActivity = (newActivity: {
    distance: number;
    duration: string;
    date: string;
  }) => {
    const activity: Activity = {
      id: Date.now().toString(),
      ...newActivity,
      pace: calculatePace(newActivity.distance, newActivity.duration),
    };
    addActivity(activity);
  };

  const handleFinishLiveActivity = (newActivity: {
    distance: number;
    duration: string;
    date: string;
  }) => {
    const activity: Activity = {
      id: Date.now().toString(),
      ...newActivity,
      pace: calculatePace(newActivity.distance, newActivity.duration),
    };
    addActivity(activity);
    setIsLiveActivityActive(false);
  };

  const calculatePace = (distance: number, duration: string): string => {
    const [minutes, seconds] = duration.split(":").map(Number);
    const totalMinutes = minutes + seconds / 60;
    const pace = totalMinutes / distance;
    const paceMinutes = Math.floor(pace);
    const paceSeconds = Math.round((pace - paceMinutes) * 60);
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")} min/km`;
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
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#E83D4D",
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
