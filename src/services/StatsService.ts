import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

export interface WeeklyStats {
  week: string;
  totalDistance: number;
  totalDuration: number;
  activitiesCount: number;
  averagePace: number;
}

export interface MonthlyStats {
  month: string;
  totalDistance: number;
  totalDuration: number;
  activitiesCount: number;
  averagePace: number;
}

export interface AdvancedStats {
  totalDistance: number;
  totalDuration: number;
  totalActivities: number;
  averagePace: number;
  bestPace: number;
  longestRun: number;
  currentStreak: number;
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  thisWeekDistance: number;
  lastWeekDistance: number;
  thisMonthDistance: number;
  lastMonthDistance: number;
}

export class StatsService {
  /**
   * Récupère toutes les statistiques avancées de l'utilisateur
   */
  static async getAdvancedStats(): Promise<AdvancedStats | null> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer toutes les activités de l'utilisateur
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      if (!activities || activities.length === 0) {
        return {
          totalDistance: 0,
          totalDuration: 0,
          totalActivities: 0,
          averagePace: 0,
          bestPace: 0,
          longestRun: 0,
          currentStreak: 0,
          weeklyStats: [],
          monthlyStats: [],
          thisWeekDistance: 0,
          lastWeekDistance: 0,
          thisMonthDistance: 0,
          lastMonthDistance: 0,
        };
      }

      // Calculer les stats globales
      const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0);
      const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
      const totalActivities = activities.length;

      // Calculer l'allure moyenne (en min/km)
      const averagePace = totalDistance > 0 ? (totalDuration / 60) / (totalDistance / 1000) : 0;

      // Meilleure allure
      const paces = activities
        .filter(act => act.distance > 0 && act.duration > 0)
        .map(act => (act.duration / 60) / (act.distance / 1000));
      const bestPace = paces.length > 0 ? Math.min(...paces) : 0;

      // Plus longue course
      const longestRun = Math.max(...activities.map(act => act.distance || 0));

      // Série en cours (jours consécutifs)
      const currentStreak = this.calculateCurrentStreak(activities);

      // Stats par semaine (8 dernières semaines)
      const weeklyStats = this.calculateWeeklyStats(activities, 8);

      // Stats par mois (6 derniers mois)
      const monthlyStats = this.calculateMonthlyStats(activities, 6);

      // Cette semaine vs semaine dernière
      const { thisWeek, lastWeek } = this.getWeekComparison(activities);

      // Ce mois vs mois dernier
      const { thisMonth, lastMonth } = this.getMonthComparison(activities);

      return {
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        totalActivities,
        averagePace: Math.round(averagePace * 100) / 100,
        bestPace: Math.round(bestPace * 100) / 100,
        longestRun: Math.round(longestRun),
        currentStreak,
        weeklyStats,
        monthlyStats,
        thisWeekDistance: Math.round(thisWeek),
        lastWeekDistance: Math.round(lastWeek),
        thisMonthDistance: Math.round(thisMonth),
        lastMonthDistance: Math.round(lastMonth),
      };
    } catch (error) {
      if (__DEV__) console.error('Stats load failed:', error);
      return null;
    }
  }

  /**
   * Calcule la série en cours (jours consécutifs avec activité)
   */
  private static calculateCurrentStreak(activities: any[]): number {
    if (!activities || activities.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDates = activities
      .map(act => {
        const date = new Date(act.started_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .filter((date, index, self) => self.indexOf(date) === index) // Unique dates
      .sort((a, b) => b - a); // Tri décroissant

    let streak = 0;
    let currentDate = today.getTime();

    for (const activityDate of activityDates) {
      const diffDays = Math.floor((currentDate - activityDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = activityDate;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calcule les stats par semaine
   */
  private static calculateWeeklyStats(activities: any[], weeksCount: number): WeeklyStats[] {
    const weeks: WeeklyStats[] = [];
    const today = new Date();

    for (let i = 0; i < weeksCount; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekActivities = activities.filter(act => {
        const actDate = new Date(act.started_at);
        return actDate >= weekStart && actDate <= weekEnd;
      });

      const totalDistance = weekActivities.reduce((sum, act) => sum + (act.distance || 0), 0);
      const totalDuration = weekActivities.reduce((sum, act) => sum + (act.duration || 0), 0);
      const averagePace = totalDistance > 0 ? (totalDuration / 60) / (totalDistance / 1000) : 0;

      // Format: "S47" pour semaine 47
      const weekNumber = this.getWeekNumber(weekStart);
      const weekLabel = `S${weekNumber}`;

      weeks.unshift({
        week: weekLabel,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        activitiesCount: weekActivities.length,
        averagePace: Math.round(averagePace * 100) / 100,
      });
    }

    return weeks;
  }

  /**
   * Calcule les stats par mois
   */
  private static calculateMonthlyStats(activities: any[], monthsCount: number): MonthlyStats[] {
    const months: MonthlyStats[] = [];
    const today = new Date();

    for (let i = 0; i < monthsCount; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthActivities = activities.filter(act => {
        const actDate = new Date(act.started_at);
        return actDate >= monthStart && actDate <= monthEnd;
      });

      const totalDistance = monthActivities.reduce((sum, act) => sum + (act.distance || 0), 0);
      const totalDuration = monthActivities.reduce((sum, act) => sum + (act.duration || 0), 0);
      const averagePace = totalDistance > 0 ? (totalDuration / 60) / (totalDistance / 1000) : 0;

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthLabel = monthNames[monthStart.getMonth()];

      months.unshift({
        month: monthLabel,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        activitiesCount: monthActivities.length,
        averagePace: Math.round(averagePace * 100) / 100,
      });
    }

    return months;
  }

  /**
   * Compare cette semaine vs semaine dernière
   */
  private static getWeekComparison(activities: any[]): { thisWeek: number; lastWeek: number } {
    const today = new Date();

    // Cette semaine
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisWeekActivities = activities.filter(act => {
      const actDate = new Date(act.started_at);
      return actDate >= thisWeekStart;
    });

    const thisWeek = thisWeekActivities.reduce((sum, act) => sum + (act.distance || 0), 0);

    // Semaine dernière
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1);

    const lastWeekActivities = activities.filter(act => {
      const actDate = new Date(act.started_at);
      return actDate >= lastWeekStart && actDate <= lastWeekEnd;
    });

    const lastWeek = lastWeekActivities.reduce((sum, act) => sum + (act.distance || 0), 0);

    return { thisWeek, lastWeek };
  }

  /**
   * Compare ce mois vs mois dernier
   */
  private static getMonthComparison(activities: any[]): { thisMonth: number; lastMonth: number } {
    const today = new Date();

    // Ce mois
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const thisMonthActivities = activities.filter(act => {
      const actDate = new Date(act.started_at);
      return actDate >= thisMonthStart;
    });

    const thisMonth = thisMonthActivities.reduce((sum, act) => sum + (act.distance || 0), 0);

    // Mois dernier
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setSeconds(lastMonthEnd.getSeconds() - 1);

    const lastMonthActivities = activities.filter(act => {
      const actDate = new Date(act.started_at);
      return actDate >= lastMonthStart && actDate <= lastMonthEnd;
    });

    const lastMonth = lastMonthActivities.reduce((sum, act) => sum + (act.distance || 0), 0);

    return { thisMonth, lastMonth };
  }

  /**
   * Obtient le numéro de semaine dans l'année
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
