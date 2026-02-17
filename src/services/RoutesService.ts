import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { SubscriptionService } from './SubscriptionService';
import { Route, CreateRouteData, RoutePoint } from '../types/route';

export class RoutesService {
  /**
   * Vérifie si l'utilisateur est premium (nécessaire pour créer des parcours)
   */
  static async checkPremiumAccess(): Promise<void> {
    const isPremium = await SubscriptionService.isPremium();
    if (!isPremium) {
      throw new Error('Cette fonctionnalité est réservée aux utilisateurs premium. Passez à Premium pour créer et partager des parcours.');
    }
  }

  /**
   * Génère un code de partage unique
   */
  private static generateShareCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans caractères ambigus
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Crée un nouveau parcours (réservé aux utilisateurs premium)
   */
  static async createRoute(routeData: CreateRouteData): Promise<Route> {
    // Vérifier que l'utilisateur est premium
    await this.checkPremiumAccess();

    const currentUser = await getCurrentUserFromDB();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      // Générer un code de partage si le parcours est partagé
      let shareCode: string | undefined;
      if (routeData.isShared) {
        shareCode = this.generateShareCode();
        // Vérifier que le code n'existe pas déjà
        const { data: existing } = await supabase
          .from('routes')
          .select('id')
          .eq('share_code', shareCode)
          .single();
        
        if (existing) {
          // Si le code existe, en générer un nouveau
          shareCode = this.generateShareCode();
        }
      }

      // Créer le parcours
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .insert({
          user_id: currentUser.id,
          title: routeData.title,
          description: routeData.description || null,
          distance: routeData.distance,
          duration_estimate: routeData.durationEstimate || null,
          difficulty: routeData.difficulty || null,
          is_public: routeData.isPublic,
          is_shared: routeData.isShared,
          share_code: shareCode || null,
        })
        .select()
        .single();

      if (routeError) throw routeError;
      if (!route) throw new Error('Erreur lors de la création du parcours');

      // Ajouter les points GPS du parcours
      if (routeData.points.length > 0) {
        const pointsToInsert = routeData.points.map((point, index) => ({
          route_id: route.id,
          latitude: point.latitude,
          longitude: point.longitude,
          elevation: point.elevation || null,
          order_index: index,
        }));

        const { error: pointsError } = await supabase
          .from('route_points')
          .insert(pointsToInsert);

        if (pointsError) throw pointsError;
      }

      // Récupérer le parcours complet avec les points
      return await this.getRouteById(route.id);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Récupère un parcours par son ID
   */
  static async getRouteById(routeId: string): Promise<Route> {
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select(`
        *,
        creator:users!routes_user_id_fkey (
          id,
          name,
          avatar
        )
      `)
      .eq('id', routeId)
      .single();

    if (routeError) throw routeError;
    if (!route) throw new Error('Parcours non trouvé');

    // Récupérer les points du parcours
    const { data: points, error: pointsError } = await supabase
      .from('route_points')
      .select('*')
      .eq('route_id', routeId)
      .order('order_index', { ascending: true });

    if (pointsError) throw pointsError;

    return {
      id: route.id,
      userId: route.user_id,
      title: route.title,
      description: route.description || undefined,
      distance: Number(route.distance),
      durationEstimate: route.duration_estimate || undefined,
      difficulty: route.difficulty || undefined,
      isPublic: route.is_public,
      isShared: route.is_shared,
      shareCode: route.share_code || undefined,
      points: (points || []).map((p) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        elevation: p.elevation ? Number(p.elevation) : undefined,
        orderIndex: p.order_index,
      })),
      createdAt: route.created_at,
      updatedAt: route.updated_at,
      creatorName: route.creator?.name || undefined,
      creatorAvatar: route.creator?.avatar || undefined,
    };
  }

  /**
   * Récupère un parcours par son code de partage
   */
  static async getRouteByShareCode(shareCode: string): Promise<Route> {
    const { data: route, error } = await supabase
      .from('routes')
      .select('id')
      .eq('share_code', shareCode)
      .eq('is_shared', true)
      .single();

    if (error || !route) {
      throw new Error('Parcours non trouvé ou non partagé');
    }

    return await this.getRouteById(route.id);
  }

  /**
   * Récupère tous les parcours publics
   */
  static async getPublicRoutes(): Promise<Route[]> {
    const { data: routes, error } = await supabase
      .from('routes')
      .select(`
        *,
        creator:users!routes_user_id_fkey (
          id,
          name,
          avatar
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Récupérer les points pour chaque parcours
    const routesWithPoints = await Promise.all(
      (routes || []).map(async (route) => {
        const { data: points } = await supabase
          .from('route_points')
          .select('*')
          .eq('route_id', route.id)
          .order('order_index', { ascending: true })
          .limit(1); // On prend juste le premier point pour l'aperçu

        return {
          id: route.id,
          userId: route.user_id,
          title: route.title,
          description: route.description || undefined,
          distance: Number(route.distance),
          durationEstimate: route.duration_estimate || undefined,
          difficulty: route.difficulty || undefined,
          isPublic: route.is_public,
          isShared: route.is_shared,
          shareCode: route.share_code || undefined,
          points: (points || []).map((p) => ({
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            elevation: p.elevation ? Number(p.elevation) : undefined,
            orderIndex: p.order_index,
          })),
          createdAt: route.created_at,
          updatedAt: route.updated_at,
          creatorName: route.creator?.name || undefined,
          creatorAvatar: route.creator?.avatar || undefined,
        };
      })
    );

    return routesWithPoints;
  }

  /**
   * Récupère les parcours créés par l'utilisateur actuel
   */
  static async getMyRoutes(): Promise<Route[]> {
    await this.checkPremiumAccess();

    const currentUser = await getCurrentUserFromDB();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: routes, error } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Récupérer les points pour chaque parcours
    const routesWithPoints = await Promise.all(
      (routes || []).map(async (route) => {
        const { data: points } = await supabase
          .from('route_points')
          .select('*')
          .eq('route_id', route.id)
          .order('order_index', { ascending: true });

        return {
          id: route.id,
          userId: route.user_id,
          title: route.title,
          description: route.description || undefined,
          distance: Number(route.distance),
          durationEstimate: route.duration_estimate || undefined,
          difficulty: route.difficulty || undefined,
          isPublic: route.is_public,
          isShared: route.is_shared,
          shareCode: route.share_code || undefined,
          points: (points || []).map((p) => ({
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            elevation: p.elevation ? Number(p.elevation) : undefined,
            orderIndex: p.order_index,
          })),
          createdAt: route.created_at,
          updatedAt: route.updated_at,
        };
      })
    );

    return routesWithPoints;
  }

  /**
   * Sauvegarde un parcours pour l'utilisateur actuel
   */
  static async saveRoute(routeId: string): Promise<void> {
    const currentUser = await getCurrentUserFromDB();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    const { error } = await supabase
      .from('saved_routes')
      .insert({
        user_id: currentUser.id,
        route_id: routeId,
      });

    if (error) {
      if (error.code === '23505') {
        // Duplicate key - le parcours est déjà sauvegardé
        throw new Error('Ce parcours est déjà dans vos favoris');
      }
      throw error;
    }
  }

  /**
   * Récupère les parcours sauvegardés par l'utilisateur actuel
   */
  static async getSavedRoutes(): Promise<Route[]> {
    const currentUser = await getCurrentUserFromDB();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: savedRoutes, error } = await supabase
      .from('saved_routes')
      .select(`
        route_id,
        routes:routes!saved_routes_route_id_fkey (
          *,
          creator:users!routes_user_id_fkey (
            id,
            name,
            avatar
          )
        )
      `)
      .eq('user_id', currentUser.id)
      .order('saved_at', { ascending: false });

    if (error) throw error;

    const routes = (savedRoutes || [])
      .map((sr: any) => sr.routes)
      .filter(Boolean);

    // Récupérer les points pour chaque parcours
    const routesWithPoints = await Promise.all(
      routes.map(async (route: any) => {
        const { data: points } = await supabase
          .from('route_points')
          .select('*')
          .eq('route_id', route.id)
          .order('order_index', { ascending: true });

        return {
          id: route.id,
          userId: route.user_id,
          title: route.title,
          description: route.description || undefined,
          distance: Number(route.distance),
          durationEstimate: route.duration_estimate || undefined,
          difficulty: route.difficulty || undefined,
          isPublic: route.is_public,
          isShared: route.is_shared,
          shareCode: route.share_code || undefined,
          points: (points || []).map((p) => ({
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            elevation: p.elevation ? Number(p.elevation) : undefined,
            orderIndex: p.order_index,
          })),
          createdAt: route.created_at,
          updatedAt: route.updated_at,
          creatorName: route.creator?.name || undefined,
          creatorAvatar: route.creator?.avatar || undefined,
        };
      })
    );

    return routesWithPoints;
  }

  /**
   * Supprime un parcours (seulement si c'est le créateur)
   */
  static async deleteRoute(routeId: string): Promise<void> {
    await this.checkPremiumAccess();

    const currentUser = await getCurrentUserFromDB();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier que l'utilisateur est le créateur
    const { data: route, error: checkError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single();

    if (checkError || !route) {
      throw new Error('Parcours non trouvé');
    }

    if (route.user_id !== currentUser.id) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer ce parcours');
    }

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (error) throw error;
  }
}

