import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ActivityCard } from "../components/activities/ActivityCard";
import { AddActivityModal } from "../components/activities/AddActivityModal";
import { LiveActivity } from "../components/activities/LiveActivity";
import { Activity } from "../types/activity";
import { useActivitiesManager } from "../hooks/useActivitiesManager";
import { NavigationProp } from "../types/navigation";
import { useRoute } from "@react-navigation/native";
import { BottomNav } from "../components/common/BottomNav";
import { COLORS } from "../constants/colors";
import { SubscriptionService } from "../services/SubscriptionService";
import { useAuth } from "../contexts/AuthContext";
import { Route } from "../types/route";

export default function ActivitiesScreen() {
  const route = useRoute();
  const routeToFollow = (route.params as any)?.routeToFollow as Route | undefined;
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLiveActivityActive, setIsLiveActivityActive] = useState(!!routeToFollow);
  const navigation = useNavigation<NavigationProp>();
  const { activities, addActivity, deleteActivity } = useActivitiesManager();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  const checkPremiumStatus = async () => {
    if (user) {
      try {
        const premium = await SubscriptionService.isPremium();
        setIsPremium(premium);
      } catch (error) {
        if (__DEV__) console.error('Premium check failed:', error);
        setIsPremium(false);
      }
    }
  };

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
      if (__DEV__) console.error('Activity addition failed:', error);
    }
  };

  const handleFinishLiveActivity = async (newActivity: {
    distance: number;
    duration: string;
    date: string;
    trackedPath?: Array<{ latitude: number; longitude: number }>;
  }) => {
    try {
      // Convertir le tracé en format ActivityRoute avec timestamps
      // On utilise des timestamps approximatifs basés sur l'ordre des points
      const route = newActivity.trackedPath && newActivity.trackedPath.length > 0
        ? {
            coordinates: newActivity.trackedPath.map((point, index) => {
              // Estimer le timestamp en fonction de la position dans le parcours
              // On suppose que les points sont espacés d'environ 10 secondes
              const estimatedTimestamp = index * 10;
              return {
                latitude: point.latitude,
                longitude: point.longitude,
                timestamp: estimatedTimestamp,
              };
            }),
            pauses: [],
          }
        : undefined;

      await addActivity({
        distance: newActivity.distance,
        duration: newActivity.duration,
        date: newActivity.date,
        route,
      });
      setIsLiveActivityActive(false);
    } catch (error) {
      if (__DEV__) console.error('Activity save failed:', error);
    }
  };


  if (isLiveActivityActive) {
    return (
      <LiveActivity
        onFinish={handleFinishLiveActivity}
        onCancel={() => setIsLiveActivityActive(false)}
        route={routeToFollow}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}>
        {/* Carte Parcours */}
        <TouchableOpacity
          style={styles.routesCard}
          onPress={() => navigation.navigate("Routes")}
          activeOpacity={0.8}
        >
          <View style={styles.routesCardContent}>
            <View style={styles.routesIconContainer}>
              <MaterialCommunityIcons name="map-marker-path" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.routesTextContainer}>
              <Text style={styles.routesTitle}>Mes Parcours</Text>
              <Text style={styles.routesSubtitle}>
                {isPremium 
                  ? "Créez et partagez vos parcours" 
                  : "Passez à Premium pour créer des parcours"}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </View>
        </TouchableOpacity>

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
  routesCard: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  routesCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  routesIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  routesTextContainer: {
    flex: 1,
  },
  routesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  routesSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
});
