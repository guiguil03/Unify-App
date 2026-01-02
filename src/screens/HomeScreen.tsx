import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
import { SubscriptionService } from "../services/SubscriptionService";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { posts, loading, error, refetch, handleLike, handleDelete } = usePosts();
  const [refreshing, setRefreshing] = React.useState(false);
  const [isPremium, setIsPremium] = React.useState(false);

  React.useEffect(() => {
    checkPremiumStatus();
  }, [user]);

  const checkPremiumStatus = async () => {
    if (user) {
      try {
        const premium = await SubscriptionService.isPremium();
        setIsPremium(premium);
      } catch (error) {
        console.error('Erreur vérification premium:', error);
        setIsPremium(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreatePost = () => {
    navigation.navigate("CreatePost");
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Stories Row */}
        <StoriesRow />

        {/* Carte Parcours */}
        <TouchableOpacity
          style={styles.routesCard}
          onPress={() => navigation.navigate("Routes")}
          activeOpacity={0.8}
        >
          <View style={styles.routesCardContent}>
            <View style={styles.routesIconContainer}>
              <MaterialCommunityIcons name="map-marker-path" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.routesTextContainer}>
              <Text style={styles.routesTitle}>Mes Parcours</Text>
              <Text style={styles.routesSubtitle}>
                {isPremium 
                  ? "Créez et partagez vos parcours personnalisés" 
                  : "Passez à Premium pour créer des parcours"}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </View>
        </TouchableOpacity>

        {/* Posts Feed */}
        {loading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Aucun post pour le moment</Text>
            <Text style={styles.emptySubtext}>Soyez le premier à publier quelque chose !</Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                isOwnPost={post.userId === user?.id}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB pour créer un post */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.background} />
      </TouchableOpacity>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
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
  },
  postsContainer: {
    paddingBottom: 100,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  routesCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  routesTextContainer: {
    flex: 1,
  },
  routesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  routesSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
