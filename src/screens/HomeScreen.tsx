import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StoriesRow } from "../components/stories/StoriesRow";
import { BottomNav } from "../components/common/BottomNav";
import { PostCard } from "../components/posts/PostCard";
import { usePosts } from "../hooks/usePosts";
import { useAuth } from "../contexts/AuthContext";
import { NavigationProp } from "../types/navigation";
import { COLORS } from "../constants/colors";

function AnimatedPost({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 60, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { posts, loading, error, refetch, handleLike, handleDelete } = usePosts();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => { refetch(); }, [refetch])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <StoriesRow />

        {loading && posts.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="wifi-off" size={48} color={COLORS.textLight} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Aucun post pour le moment</Text>
            <Text style={styles.emptySubtext}>Soyez le premier à publier !</Text>
          </View>
        ) : (
          <View style={styles.feed}>
            {posts.map((post, index) => (
              <AnimatedPost key={post.id} index={index}>
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  isOwnPost={post.userId === user?.id}
                />
              </AnimatedPost>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreatePost")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="white" />
      </TouchableOpacity>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },

  // States
  center: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  errorText: { fontSize: 15, color: COLORS.error, textAlign: "center" },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: "white", fontWeight: "600" },
  emptyText: { fontSize: 17, fontWeight: "600", color: COLORS.text, textAlign: "center" },
  emptySubtext: { fontSize: 14, color: COLORS.textLight, textAlign: "center" },

  // Feed
  feed: { paddingBottom: 100 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
});
