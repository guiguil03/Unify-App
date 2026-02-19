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

export interface PaceTrend {
  label: string;  // date courte ex: "12 jan"
  pace: number;   // min/km
  distance: number;
}

export interface DistanceZone {
  label: string;
  min: number;
  max: number;
  count: number;
  color: string;
}

export interface WeekdayDistrib {
  day: string;
  count: number;
}

export interface FeelingBreakdown {
  feeling: string;
  count: number;
  color: string;
}

export interface AdvancedStats {
  // Totaux
  totalDistance: number;      // mètres
  totalDuration: number;      // secondes
  totalActivities: number;
  averagePace: number;        // min/km
  bestPace: number;
  longestRun: number;
  currentStreak: number;
  longestStreak: number;
  // Comparaisons
  thisWeekDistance: number;
  lastWeekDistance: number;
  thisMonthDistance: number;
  lastMonthDistance: number;
  thisMonthActivities: number;
  lastMonthActivities: number;
  // Graphiques
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  paceTrend: PaceTrend[];
  distanceZones: DistanceZone[];
  weekdayDistrib: WeekdayDistrib[];
  feelingBreakdown: FeelingBreakdown[];
  // Moyenne distance par sortie
  avgDistancePerRun: number;
  avgDurationPerRun: number;
}

export class StatsService {
  static async getAdvancedStats(): Promise<AdvancedStats | null> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, date, distance, duration_seconds, pace_seconds, feeling')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const empty: AdvancedStats = {
        totalDistance: 0, totalDuration: 0, totalActivities: 0,
        averagePace: 0, bestPace: 0, longestRun: 0,
        currentStreak: 0, longestStreak: 0,
        thisWeekDistance: 0, lastWeekDistance: 0,
        thisMonthDistance: 0, lastMonthDistance: 0,
        thisMonthActivities: 0, lastMonthActivities: 0,
        weeklyStats: [], monthlyStats: [], paceTrend: [],
        distanceZones: this.emptyZones(),
        weekdayDistrib: this.emptyWeekdays(),
        feelingBreakdown: [],
        avgDistancePerRun: 0, avgDurationPerRun: 0,
      };

      if (!activities || activities.length === 0) return empty;

      const totalDistance = activities.reduce((s, a) => s + (a.distance || 0), 0);
      const totalDuration = activities.reduce((s, a) => s + (a.duration_seconds || 0), 0);
      const totalActivities = activities.length;
      const averagePace = totalDistance > 0 ? (totalDuration / 60) / totalDistance : 0;
      const paces = activities.filter(a => a.distance > 0 && a.duration_seconds > 0)
        .map(a => (a.duration_seconds / 60) / a.distance);
      const bestPace = paces.length > 0 ? Math.min(...paces) : 0;
      const longestRun = Math.max(...activities.map(a => a.distance || 0));
      const avgDistancePerRun = totalActivities > 0 ? totalDistance / totalActivities : 0;
      const avgDurationPerRun = totalActivities > 0 ? totalDuration / totalActivities : 0;

      const { thisWeek, lastWeek } = this.getWeekComparison(activities);
      const { thisMonth, lastMonth, thisMonthCount, lastMonthCount } = this.getMonthComparison(activities);

      return {
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        totalActivities,
        averagePace: Math.round(averagePace * 100) / 100,
        bestPace: Math.round(bestPace * 100) / 100,
        longestRun: Math.round(longestRun),
        currentStreak: this.calculateCurrentStreak(activities),
        longestStreak: this.calculateLongestStreak(activities),
        thisWeekDistance: Math.round(thisWeek),
        lastWeekDistance: Math.round(lastWeek),
        thisMonthDistance: Math.round(thisMonth),
        lastMonthDistance: Math.round(lastMonth),
        thisMonthActivities: thisMonthCount,
        lastMonthActivities: lastMonthCount,
        weeklyStats: this.calcWeeklyStats(activities, 8),
        monthlyStats: this.calcMonthlyStats(activities, 6),
        paceTrend: this.calcPaceTrend(activities),
        distanceZones: this.calcDistanceZones(activities),
        weekdayDistrib: this.calcWeekdayDistrib(activities),
        feelingBreakdown: this.calcFeelingBreakdown(activities),
        avgDistancePerRun: Math.round(avgDistancePerRun),
        avgDurationPerRun: Math.round(avgDurationPerRun),
      };
    } catch (error) {
      if (__DEV__) console.error('Stats load failed:', error);
      return null;
    }
  }

  // ── Helpers date ─────────────────────────────────────────────────────────────

  private static d(act: any): Date { return new Date(act.date); }

  // ── Streak ───────────────────────────────────────────────────────────────────

  private static calculateCurrentStreak(acts: any[]): number {
    if (!acts.length) return 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const dates = [...new Set(acts.map(a => { const d=this.d(a); d.setHours(0,0,0,0); return d.getTime(); }))].sort((a,b)=>b-a);
    let streak = 0, cur = today.getTime();
    for (const d of dates) {
      const diff = Math.floor((cur - d) / 86400000);
      if (diff === 0 || diff === 1) { streak++; cur = d; } else break;
    }
    return streak;
  }

  private static calculateLongestStreak(acts: any[]): number {
    if (!acts.length) return 0;
    const dates = [...new Set(acts.map(a => { const d=this.d(a); d.setHours(0,0,0,0); return d.getTime(); }))].sort((a,b)=>a-b);
    let best = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.floor((dates[i] - dates[i-1]) / 86400000);
      if (diff === 1) { cur++; best = Math.max(best, cur); } else cur = 1;
    }
    return best;
  }

  // ── Weekly / Monthly ─────────────────────────────────────────────────────────

  private static calcWeeklyStats(acts: any[], n: number): WeeklyStats[] {
    const today = new Date();
    return Array.from({ length: n }, (_, i) => {
      const ws = new Date(today); ws.setDate(today.getDate() - today.getDay() - 7*i); ws.setHours(0,0,0,0);
      const we = new Date(ws); we.setDate(ws.getDate()+6); we.setHours(23,59,59,999);
      const wa = acts.filter(a => { const d=this.d(a); return d>=ws && d<=we; });
      const dist = wa.reduce((s,a)=>s+(a.distance||0),0);
      const dur = wa.reduce((s,a)=>s+(a.duration_seconds||0),0);
      return { week:`S${this.weekNum(ws)}`, totalDistance:Math.round(dist*10)/10, totalDuration:Math.round(dur), activitiesCount:wa.length, averagePace:dist>0?Math.round((dur/60)/dist*100)/100:0 };
    }).reverse();
  }

  private static calcMonthlyStats(acts: any[], n: number): MonthlyStats[] {
    const today = new Date();
    const names = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    return Array.from({ length: n }, (_, i) => {
      const s = new Date(today.getFullYear(), today.getMonth()-i, 1);
      const e = new Date(today.getFullYear(), today.getMonth()-i+1, 0, 23,59,59,999);
      const ma = acts.filter(a => { const d=this.d(a); return d>=s && d<=e; });
      const dist = ma.reduce((s,a)=>s+(a.distance||0),0);
      const dur = ma.reduce((s,a)=>s+(a.duration_seconds||0),0);
      return { month:names[s.getMonth()], totalDistance:Math.round(dist*10)/10, totalDuration:Math.round(dur), activitiesCount:ma.length, averagePace:dist>0?Math.round((dur/60)/dist*100)/100:0 };
    }).reverse();
  }

  // ── Pace trend (10 dernières activités avec distance > 0) ────────────────────

  private static calcPaceTrend(acts: any[]): PaceTrend[] {
    const months = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    return acts
      .filter(a => a.distance > 0 && a.duration_seconds > 0)
      .slice(0, 10)
      .reverse()
      .map(a => {
        const d = this.d(a);
        return {
          label: `${d.getDate()} ${months[d.getMonth()]}`,
          pace: Math.round(((a.duration_seconds/60)/a.distance)*100)/100,
          distance: a.distance,
        };
      });
  }

  // ── Distance zones ────────────────────────────────────────────────────────────

  private static emptyZones(): DistanceZone[] {
    return [
      { label:'< 5 km',   min:0,      max:5,        count:0, color:'#A78BFA' },
      { label:'5–10 km',  min:5,      max:10,       count:0, color:'#7D80F4' },
      { label:'10–21 km', min:10,     max:21.097,   count:0, color:'#4F46E5' },
      { label:'> 21 km',  min:21.097, max:Infinity, count:0, color:'#1D1D8F' },
    ];
  }

  private static calcDistanceZones(acts: any[]): DistanceZone[] {
    const zones = this.emptyZones();
    for (const a of acts) {
      const d = a.distance || 0;
      const z = zones.find(z => d >= z.min && d < z.max);
      if (z) z.count++;
    }
    return zones;
  }

  // ── Weekday distribution ──────────────────────────────────────────────────────

  private static emptyWeekdays(): WeekdayDistrib[] {
    return ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(day => ({ day, count: 0 }));
  }

  private static calcWeekdayDistrib(acts: any[]): WeekdayDistrib[] {
    const days = this.emptyWeekdays();
    for (const a of acts) {
      const dow = (this.d(a).getDay() + 6) % 7; // 0=Lun..6=Dim
      days[dow].count++;
    }
    return days;
  }

  // ── Feeling breakdown ─────────────────────────────────────────────────────────

  private static calcFeelingBreakdown(acts: any[]): FeelingBreakdown[] {
    const map: Record<string, { label: string; color: string; count: number }> = {
      excellent: { label:'Excellent', color:'#10B981', count:0 },
      good:      { label:'Bien',      color:'#7D80F4', count:0 },
      ok:        { label:'Moyen',     color:'#F59E0B', count:0 },
      tough:     { label:'Difficile', color:'#EF4444', count:0 },
    };
    for (const a of acts) {
      if (a.feeling && map[a.feeling]) map[a.feeling].count++;
    }
    return Object.values(map).filter(f => f.count > 0);
  }

  // ── Week / Month comparisons ──────────────────────────────────────────────────

  private static getWeekComparison(acts: any[]) {
    const today = new Date();
    const wStart = new Date(today); wStart.setDate(today.getDate()-today.getDay()); wStart.setHours(0,0,0,0);
    const lwStart = new Date(wStart); lwStart.setDate(wStart.getDate()-7);
    const lwEnd = new Date(wStart); lwEnd.setSeconds(lwEnd.getSeconds()-1);
    const thisWeek = acts.filter(a=>this.d(a)>=wStart).reduce((s,a)=>s+(a.distance||0),0);
    const lastWeek = acts.filter(a=>{const d=this.d(a);return d>=lwStart&&d<=lwEnd;}).reduce((s,a)=>s+(a.distance||0),0);
    return { thisWeek, lastWeek };
  }

  private static getMonthComparison(acts: any[]) {
    const today = new Date();
    const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lmStart = new Date(today.getFullYear(), today.getMonth()-1, 1);
    const lmEnd = new Date(mStart); lmEnd.setSeconds(lmEnd.getSeconds()-1);
    const thisMonthActs = acts.filter(a=>this.d(a)>=mStart);
    const lastMonthActs = acts.filter(a=>{const d=this.d(a);return d>=lmStart&&d<=lmEnd;});
    return {
      thisMonth: thisMonthActs.reduce((s,a)=>s+(a.distance||0),0),
      lastMonth: lastMonthActs.reduce((s,a)=>s+(a.distance||0),0),
      thisMonthCount: thisMonthActs.length,
      lastMonthCount: lastMonthActs.length,
    };
  }

  private static weekNum(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime()-y.getTime())/86400000)+1)/7);
  }
}
