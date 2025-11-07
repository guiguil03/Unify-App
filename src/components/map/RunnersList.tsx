import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Runner } from "../../types/runner";
import { formatDistance, formatRelativeTime } from "../../utils/format";
import { MAP_STYLES } from "../../services/map/config";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const HEADER_HEIGHT = 64;
const MIN_TRANSLATE_Y = -HEADER_HEIGHT * 1.5;
const MAX_TRANSLATE_Y = -(SCREEN_HEIGHT - HEADER_HEIGHT * 4);

interface RunnersListProps {
  runners: Runner[];
  onRunnerPress: (runner: Runner) => void;
  selectedRunner: Runner | null;
  isExpanded?: boolean;
  onCollapse?: () => void;
}

export function RunnersList({
  runners,
  onRunnerPress,
  selectedRunner,
  isExpanded = false,
  onCollapse,
}: RunnersListProps) {
  const translateY = useSharedValue(MIN_TRANSLATE_Y);

  useEffect(() => {
    translateY.value = withSpring(
      isExpanded ? MAX_TRANSLATE_Y : MIN_TRANSLATE_Y,
      {
        damping: 50,
      }
    );
  }, [isExpanded, translateY]);

  const startY = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onChange((event) => {
      translateY.value = startY.value + event.translationY;
      translateY.value = Math.max(
        MAX_TRANSLATE_Y,
        Math.min(0, translateY.value)
      );
    })
    .onEnd((event) => {
      const shouldSnapClosed =
        event.velocityY > 500 ||
        (event.velocityY >= 0 && translateY.value > -SCREEN_HEIGHT / 2);

      translateY.value = withSpring(
        shouldSnapClosed ? MIN_TRANSLATE_Y : MAX_TRANSLATE_Y,
        {
          velocity: event.velocityY,
          damping: 50,
        }
      );

      if (shouldSnapClosed && onCollapse) {
        // Utiliser runOnJS pour appeler onCollapse depuis le thread UI
        onCollapse();
      }
    });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleRunnerPress = (runner: Runner) => {
    // Fermer la liste en animant vers la position minimale
    translateY.value = withSpring(MIN_TRANSLATE_Y, {
      damping: 50,
    });
    // Appeler les callbacks
    onRunnerPress(runner);
    if (onCollapse) {
      onCollapse();
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, rStyle]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Coureurs à proximité</Text>
          <Text style={styles.count}>{runners.length} coureurs</Text>
        </View>

        <View style={styles.emptySpace} />

        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {runners.map((runner) => (
            <Animated.View
              key={runner.id}
              style={[
                styles.runnerCard,
                selectedRunner?.id === runner.id && styles.selectedRunnerCard,
              ]}
              onTouchEnd={() => handleRunnerPress(runner)}
            >
              <View style={styles.runnerInfo}>
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color={
                    selectedRunner?.id === runner.id
                      ? MAP_STYLES.SELECTED_MARKER
                      : runner.isActive === false
                      ? MAP_STYLES.INACTIVE_MARKER
                      : MAP_STYLES.DEFAULT_MARKER
                  }
                />
                <View>
                  <Text style={styles.runnerName}>{runner.name}</Text>
                  <Text style={styles.runnerDistance}>
                    à {formatDistance(runner.distance)}
                  </Text>
                  <Text
                    style={[
                      styles.runnerStatus,
                      runner.isActive ? styles.statusOnline : styles.statusOffline,
                    ]}
                  >
                    {runner.isActive
                      ? "Connecté(e)"
                      : runner.lastSeen
                      ? `Hors ligne · ${formatRelativeTime(runner.lastSeen)}`
                      : "Hors ligne"}
                  </Text>
                </View>
              </View>

              <View style={styles.runnerStats}>
                <View style={styles.stat}>
                  <MaterialCommunityIcons
                    name="speedometer"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.statText}>{runner.pace}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#666"
                />
              </View>
            </Animated.View>
          ))}
        </Animated.ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -SCREEN_HEIGHT + 120,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT - 120,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  count: {
    color: "#666",
  },
  emptySpace: {
    height: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  runnerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedRunnerCard: {
    backgroundColor: "#e6f3ff",
    borderColor: "#E83D4D",
    borderWidth: 1,
  },
  runnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  runnerName: {
    fontSize: 16,
    fontWeight: "500",
  },
  runnerDistance: {
    color: "#666",
    fontSize: 14,
  },
  runnerStatus: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
  },
  statusOnline: {
    color: "#2E7D32",
  },
  statusOffline: {
    color: "#757575",
  },
  runnerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statText: {
    color: "#666",
    fontSize: 14,
  },
});
