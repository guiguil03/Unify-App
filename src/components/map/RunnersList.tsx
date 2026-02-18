import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, Image, FlatList, ListRenderItem, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Runner } from "../../types/runner";
import { formatDistance, formatRelativeTime } from "../../utils/format";
import { MAP_STYLES } from "../../services/map/config";
import { COLORS } from "../../constants/colors";

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
  isModalVisible?: boolean;
}

export function RunnersList({
  runners,
  onRunnerPress,
  selectedRunner,
  isExpanded = false,
  onCollapse,
  isModalVisible = false,
}: RunnersListProps) {
  const translateY = useSharedValue(MIN_TRANSLATE_Y);

  useEffect(() => {
    translateY.value = withSpring(
      isExpanded ? MAX_TRANSLATE_Y : MIN_TRANSLATE_Y,
      {
        damping: 80,
        stiffness: 200,
        overshootClamping: true,
      }
    );
  }, [isExpanded, translateY]);

  const startY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  
  // Gesture pour faire glisser le panneau (seulement depuis le header)
  const panGesture = Gesture.Pan()
    .enabled(!isModalVisible)
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onChange((event) => {
      // Ne permettre le glissement que si on est en haut du scroll ou si on scroll vers le bas
      if (scrollY.value <= 0 || event.translationY > 0) {
        translateY.value = startY.value + event.translationY;
        translateY.value = Math.max(
          MAX_TRANSLATE_Y,
          Math.min(0, translateY.value)
        );
      }
    })
    .onEnd((event) => {
      const shouldSnapClosed =
        event.velocityY > 500 ||
        (event.velocityY >= 0 && translateY.value > -SCREEN_HEIGHT / 2);

      translateY.value = withSpring(
        shouldSnapClosed ? MIN_TRANSLATE_Y : MAX_TRANSLATE_Y,
        {
          velocity: event.velocityY,
          damping: 80,
          stiffness: 200,
          overshootClamping: true,
        }
      );

      if (shouldSnapClosed && onCollapse) {
        runOnJS(onCollapse)();
      }
    });

  const rStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleRunnerPress = useCallback((runner: Runner) => {
    // Fermer la liste en animant vers la position minimale
    translateY.value = withSpring(MIN_TRANSLATE_Y, {
      damping: 80,
      stiffness: 200,
      overshootClamping: true,
    });
    // Appeler les callbacks
    onRunnerPress(runner);
    if (onCollapse) {
      onCollapse();
    }
  }, [onRunnerPress, onCollapse, translateY]);

  const renderRunnerItem: ListRenderItem<Runner> = useCallback(({ item: runner }) => {
    return (
      <TouchableOpacity
        style={[
          styles.runnerCard,
          selectedRunner?.id === runner.id && styles.selectedRunnerCard,
        ]}
        onPress={() => handleRunnerPress(runner)}
        activeOpacity={0.7}
      >
        <View style={styles.runnerInfo}>
          {runner.avatar && runner.avatar.trim() !== '' && !runner.avatar.startsWith('file://') ? (
            <Image 
              source={{ uri: runner.avatar }} 
              style={[
                styles.runnerAvatar,
                selectedRunner?.id === runner.id && styles.runnerAvatarSelected
              ]}
            />
          ) : (
            <View style={[
              styles.runnerAvatarPlaceholder,
              selectedRunner?.id === runner.id && styles.runnerAvatarPlaceholderSelected
            ]}>
              <MaterialCommunityIcons
                name="account"
                size={28}
                color={
                  selectedRunner?.id === runner.id
                    ? COLORS.primary
                    : COLORS.textLight
                }
              />
            </View>
          )}
          <View style={styles.runnerDetails}>
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
      </TouchableOpacity>
    );
  }, [selectedRunner, handleRunnerPress]);

  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="account-search-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>Aucun coureur à proximité</Text>
        <Text style={styles.emptySubtext}>
          Élargissez votre zone de recherche pour trouver plus de coureurs
        </Text>
      </View>
    );
  }, []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, rStyle]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Coureur(se)s à proximité</Text>
          <Text style={styles.count}>{runners.length} coureur(se)s</Text>
        </View>

        <FlatList
          data={runners}
          renderItem={renderRunnerItem}
          keyExtractor={(item) => item.id}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          nestedScrollEnabled={true}
          ListEmptyComponent={renderEmptyComponent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  runnerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedRunnerCard: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  runnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  runnerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  runnerAvatarSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  runnerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  runnerAvatarPlaceholderSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    backgroundColor: COLORS.primary + '15',
  },
  runnerDetails: {
    flex: 1,
  },
  runnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
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
