import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatsService, AdvancedStats } from '../services/StatsService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const P = 16;

// ── Formatters ────────────────────────────────────────────────────────────────
const fDist  = (m: number) => m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${m} m`;
const fDur   = (s: number) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h${String(m).padStart(2,'0')}`:`${m} min`; };
const fPace  = (v: number) => { if(!v||!isFinite(v)) return '—'; const m=Math.floor(v),s=Math.round((v-m)*60); return `${m}'${String(s).padStart(2,'0')}"`;};
const pct    = (a: number, b: number) => b===0?(a>0?100:0):Math.round(((a-b)/b)*100);

// ── Micro components ──────────────────────────────────────────────────────────

function KpiCard({ icon, value, label, color = COLORS.primary }: { icon: string; value: string; label: string; color?: string }) {
  return (
    <View style={kpi.card}>
      <View style={[kpi.icon, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={kpi.val} numberOfLines={1}>{value}</Text>
      <Text style={kpi.lbl}>{label}</Text>
    </View>
  );
}
const kpi = StyleSheet.create({
  card: { flex:1, alignItems:'center', paddingVertical:12, paddingHorizontal:4 },
  icon: { width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center',marginBottom:8 },
  val:  { fontSize:16,fontWeight:'800',color:'#1a1a2e',letterSpacing:-0.3 },
  lbl:  { fontSize:10,color:'#999',marginTop:2,textAlign:'center' },
});

function SectionTitle({ children }: { children: string }) {
  return <Text style={st.t}>{children}</Text>;
}
const st = StyleSheet.create({ t: { fontSize:15,fontWeight:'800',color:'#1a1a2e',marginBottom:10,marginTop:4,letterSpacing:-0.2 } });

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[card.c, style]}>{children}</View>;
}
const card = StyleSheet.create({ c: { backgroundColor:'#fff',borderRadius:18,padding:16,marginBottom:12,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:2 } });

function DeltaBadge({ cur, prev }: { cur: number; prev: number }) {
  const p = pct(cur, prev);
  const up = p >= 0;
  if (prev === 0 && cur === 0) return null;
  return (
    <View style={[db.wrap, { backgroundColor: up ? '#e8f5e9' : '#ffeaea' }]}>
      <MaterialCommunityIcons name={up ? 'trending-up' : 'trending-down'} size={13} color={up ? '#2e7d32' : '#c62828'} />
      <Text style={[db.t, { color: up ? '#2e7d32' : '#c62828' }]}>{up?'+':''}{p}%</Text>
    </View>
  );
}
const db = StyleSheet.create({ wrap:{flexDirection:'row',alignItems:'center',gap:3,borderRadius:20,paddingHorizontal:9,paddingVertical:3,alignSelf:'flex-start'},t:{fontSize:12,fontWeight:'700'} });

// ── Bar chart (custom, no lib) ────────────────────────────────────────────────
function BarChart({ data, height = 110, color = COLORS.primary, valueKey, labelKey, fmt }:
  { data: any[]; height?: number; color?: string; valueKey: string; labelKey: string; fmt?: (v: number) => string }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const bW = Math.floor((width - P*4) / data.length) - 4;
  return (
    <View style={{ flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height }}>
      {data.map((d, i) => {
        const h = Math.max(4, Math.round((d[valueKey] / max) * (height - 24)));
        return (
          <View key={i} style={{ alignItems:'center', flex:1 }}>
            {d[valueKey] > 0 && fmt ? <Text style={{ fontSize:8,color:'#bbb',marginBottom:2 }}>{fmt(d[valueKey])}</Text> : <View style={{height:12}}/>}
            <View style={{ width: Math.max(bW, 6), height: h, backgroundColor: color, borderRadius: 5, opacity: 0.85 }} />
            <Text style={{ fontSize:9,color:'#aaa',marginTop:3 }}>{d[labelKey]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Pace trend (line-like bar chart) ─────────────────────────────────────────
function PaceChart({ data }: { data: { label: string; pace: number }[] }) {
  if (!data.length) return <Text style={{ color:'#bbb',fontSize:13,textAlign:'center',padding:16 }}>Pas assez de données</Text>;
  const max = Math.max(...data.map(d => d.pace), 1);
  const min = Math.min(...data.map(d => d.pace));
  const range = max - min || 1;
  const chartH = 90;
  return (
    <View>
      <View style={{ flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height: chartH + 20 }}>
        {data.map((d, i) => {
          const h = Math.max(6, Math.round(((max - d.pace) / range) * chartH * 0.7 + chartH * 0.15));
          const isLast = i === data.length - 1;
          return (
            <View key={i} style={{ alignItems:'center', flex:1 }}>
              <View style={{ width:8, height: h, backgroundColor: isLast ? '#10B981' : COLORS.primary, borderRadius:4, opacity:0.85 }} />
              <Text style={{ fontSize:8,color:'#bbb',marginTop:3,transform:[{rotate:'-30deg'}] }}>{d.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8 }}>
        <Text style={{ fontSize:11,color:'#bbb' }}>Plus vite — {fPace(min)}</Text>
        <Text style={{ fontSize:11,color:'#bbb' }}>Plus lent — {fPace(max)}</Text>
      </View>
    </View>
  );
}

// ── Feeling pills ─────────────────────────────────────────────────────────────
function FeelingPills({ data, total }: { data: { feeling: string; count: number; color: string }[]; total: number }) {
  if (!data.length) return null;
  return (
    <View style={{ gap:8 }}>
      {data.map((f, i) => {
        const p = total > 0 ? Math.round((f.count / total) * 100) : 0;
        return (
          <View key={i}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
              <Text style={{ fontSize:13,color:'#444',fontWeight:'600' }}>{f.feeling}</Text>
              <Text style={{ fontSize:13,color:'#888' }}>{f.count} sortie{f.count>1?'s':''} · {p}%</Text>
            </View>
            <View style={{ height:7,backgroundColor:'#f0f0f0',borderRadius:4,overflow:'hidden' }}>
              <View style={{ height:'100%',width:`${p}%`,backgroundColor:f.color,borderRadius:4 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Distance zones ────────────────────────────────────────────────────────────
function ZoneBars({ zones }: { zones: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...zones.map(z => z.count), 1);
  return (
    <View style={{ gap:10 }}>
      {zones.map((z, i) => (
        <View key={i}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
            <Text style={{ fontSize:13,color:'#444',fontWeight:'600' }}>{z.label}</Text>
            <Text style={{ fontSize:13,color:'#888' }}>{z.count} sortie{z.count>1?'s':''}</Text>
          </View>
          <View style={{ height:7,backgroundColor:'#f0f0f0',borderRadius:4,overflow:'hidden' }}>
            <View style={{ height:'100%',width:`${Math.round((z.count/max)*100)}%`,backgroundColor:z.color,borderRadius:4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Premium wall ──────────────────────────────────────────────────────────────
function PremiumWall() {
  const nav = useNavigation<NavigationProp>();
  const feats = [
    { icon:'chart-line', t:'Graphiques de progression sur 8 semaines' },
    { icon:'fire', t:'Séries de jours actifs (streak)' },
    { icon:'trophy', t:'Records personnels & tendance d\'allure' },
    { icon:'calendar-check', t:'Répartition par jour et par zone de distance' },
  ];
  return (
    <View style={pw.wrap}>
      <View style={pw.iconBg}><MaterialCommunityIcons name="chart-box" size={40} color={COLORS.primary} /></View>
      <Text style={pw.title}>Statistiques avancées</Text>
      <Text style={pw.sub}>Analysez vos performances en détail avec Premium.</Text>
      {feats.map((f,i) => (
        <View key={i} style={pw.feat}>
          <View style={pw.featIcon}><MaterialCommunityIcons name={f.icon as any} size={18} color={COLORS.primary} /></View>
          <Text style={pw.featT}>{f.t}</Text>
        </View>
      ))}
      <TouchableOpacity style={pw.btn} onPress={() => nav.navigate('Settings')}>
        <MaterialCommunityIcons name="crown" size={18} color="#fff" />
        <Text style={pw.btnT}>Passer à Premium</Text>
      </TouchableOpacity>
    </View>
  );
}
const pw = StyleSheet.create({
  wrap:{flex:1,padding:28,justifyContent:'center',alignItems:'center',gap:10},
  iconBg:{width:80,height:80,borderRadius:40,backgroundColor:COLORS.primary+'15',alignItems:'center',justifyContent:'center',marginBottom:4},
  title:{fontSize:22,fontWeight:'800',color:'#1a1a2e',textAlign:'center'},
  sub:{fontSize:14,color:'#888',textAlign:'center',lineHeight:20,marginBottom:8},
  feat:{flexDirection:'row',alignItems:'center',gap:12,alignSelf:'stretch'},
  featIcon:{width:36,height:36,borderRadius:10,backgroundColor:COLORS.primary+'15',alignItems:'center',justifyContent:'center'},
  featT:{flex:1,fontSize:13,color:'#444',fontWeight:'500'},
  btn:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:COLORS.primary,paddingVertical:14,paddingHorizontal:32,borderRadius:14,marginTop:12,shadowColor:COLORS.primary,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:10,elevation:6},
  btnT:{color:'#fff',fontSize:15,fontWeight:'700'},
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { isPremium } = useSubscription();
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => { setLoading(true); setStats(await StatsService.getAdvancedStats()); setLoading(false); };

  if (!isPremium) return <ScrollView style={s.bg} contentContainerStyle={{flexGrow:1}}><PremiumWall/></ScrollView>;
  if (loading) return <View style={[s.bg,s.center]}><ActivityIndicator size="large" color={COLORS.primary}/></View>;
  if (!stats || stats.totalActivities === 0) return (
    <View style={[s.bg,s.center]}>
      <MaterialCommunityIcons name="run-fast" size={60} color={COLORS.primary+'44'}/>
      <Text style={{fontSize:18,fontWeight:'700',color:'#1a1a2e',marginTop:12}}>Aucune activité</Text>
      <Text style={{fontSize:14,color:'#aaa',marginTop:6}}>Enregistrez vos courses pour voir vos stats.</Text>
    </View>
  );

  const hasWeek  = stats.weeklyStats.some(w => w.totalDistance > 0);
  const hasMonth = stats.monthlyStats.some(m => m.activitiesCount > 0);
  const feelingTotal = stats.feelingBreakdown.reduce((s,f) => s+f.count, 0);
  const hasWeekday = stats.weekdayDistrib.some(d => d.count > 0);

  return (
    <ScrollView style={s.bg} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <Card style={s.hero}>
        <Text style={s.heroLbl}>Distance totale</Text>
        <Text style={s.heroVal}>{fDist(stats.totalDistance)}</Text>
        <View style={s.kpiRow}>
          <KpiCard icon="clock-fast"      value={fDur(stats.totalDuration)}     label="Temps total" />
          <View style={s.div}/>
          <KpiCard icon="run"             value={String(stats.totalActivities)} label="Sorties" />
          <View style={s.div}/>
          <KpiCard icon="fire"            value={`${stats.currentStreak}j`}     label="Streak actuel" color="#EF4444" />
          <View style={s.div}/>
          <KpiCard icon="speedometer"     value={fPace(stats.averagePace)}      label="Allure moy." />
        </View>
      </Card>

      {/* ── 4 KPIs secondaires ── */}
      <View style={s.kpi4row}>
        {[
          { icon:'map-marker-distance', val:fDist(stats.avgDistancePerRun),     lbl:'Distance moy.',  color:'#7C3AED' },
          { icon:'clock-outline',       val:fDur(stats.avgDurationPerRun),      lbl:'Durée moy.',     color:'#0EA5E9' },
          { icon:'trophy',              val:fPace(stats.bestPace),              lbl:'Meilleure allure',color:'#F59E0B' },
          { icon:'map-marker-path',     val:fDist(stats.longestRun),            lbl:'Plus longue',    color:'#10B981' },
        ].map((k,i) => (
          <View key={i} style={s.kpi4card}>
            <View style={[s.kpi4icon,{backgroundColor:k.color+'18'}]}>
              <MaterialCommunityIcons name={k.icon as any} size={18} color={k.color}/>
            </View>
            <Text style={s.kpi4val}>{k.val}</Text>
            <Text style={s.kpi4lbl}>{k.lbl}</Text>
          </View>
        ))}
      </View>

      {/* ── Streaks ── */}
      <Card>
        <View style={{flexDirection:'row',gap:12}}>
          <View style={s.streakBox}>
            <MaterialCommunityIcons name="fire" size={28} color="#EF4444"/>
            <Text style={s.streakVal}>{stats.currentStreak}</Text>
            <Text style={s.streakLbl}>Jours consécutifs{'\n'}actuels</Text>
          </View>
          <View style={s.streakDivider}/>
          <View style={s.streakBox}>
            <MaterialCommunityIcons name="crown" size={28} color="#F59E0B"/>
            <Text style={s.streakVal}>{stats.longestStreak}</Text>
            <Text style={s.streakLbl}>Meilleur streak{'\n'}all-time</Text>
          </View>
          <View style={s.streakDivider}/>
          <View style={s.streakBox}>
            <MaterialCommunityIcons name="calendar-month" size={28} color={COLORS.primary}/>
            <Text style={s.streakVal}>{stats.thisMonthActivities}</Text>
            <Text style={s.streakLbl}>Sorties{'\n'}ce mois</Text>
          </View>
        </View>
      </Card>

      {/* ── Comparaisons ── */}
      <View style={{flexDirection:'row',gap:10,marginBottom:12}}>
        {[
          { title:'Cette semaine', cur:stats.thisWeekDistance, prev:stats.lastWeekDistance, icon:'calendar-week' },
          { title:'Ce mois', cur:stats.thisMonthDistance, prev:stats.lastMonthDistance, icon:'calendar-month' },
        ].map((c,i) => (
          <View key={i} style={[card.c,{flex:1,marginBottom:0}]}>
            <Text style={{fontSize:11,fontWeight:'700',color:'#aaa',textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{c.title}</Text>
            <Text style={{fontSize:20,fontWeight:'800',color:'#1a1a2e'}}>{fDist(c.cur)}</Text>
            <Text style={{fontSize:12,color:'#bbb',marginBottom:8}}>vs {fDist(c.prev)}</Text>
            <DeltaBadge cur={c.cur} prev={c.prev}/>
          </View>
        ))}
      </View>

      {/* ── Distance par semaine ── */}
      {hasWeek && (
        <>
          <SectionTitle>Distance par semaine (km)</SectionTitle>
          <Card>
            <BarChart data={stats.weeklyStats} valueKey="totalDistance" labelKey="week" fmt={v=>`${(v/1000).toFixed(0)}`} color={COLORS.primary}/>
          </Card>
        </>
      )}

      {/* ── Tendance allure ── */}
      {stats.paceTrend.length > 1 && (
        <>
          <SectionTitle>Tendance d'allure (10 dernières sorties)</SectionTitle>
          <Card>
            <PaceChart data={stats.paceTrend}/>
            <Text style={{fontSize:11,color:'#bbb',textAlign:'center',marginTop:6}}>Barre haute = allure rapide</Text>
          </Card>
        </>
      )}

      {/* ── Zones de distance ── */}
      <SectionTitle>Répartition par distance</SectionTitle>
      <Card>
        <ZoneBars zones={stats.distanceZones}/>
      </Card>

      {/* ── Jour préféré ── */}
      {hasWeekday && (
        <>
          <SectionTitle>Jours de sortie préférés</SectionTitle>
          <Card>
            <BarChart data={stats.weekdayDistrib} valueKey="count" labelKey="day" color="#7C3AED"/>
          </Card>
        </>
      )}

      {/* ── Feeling ── */}
      {stats.feelingBreakdown.length > 0 && (
        <>
          <SectionTitle>Comment vous vous sentiez</SectionTitle>
          <Card>
            <FeelingPills data={stats.feelingBreakdown} total={feelingTotal}/>
          </Card>
        </>
      )}

      {/* ── Activités par mois ── */}
      {hasMonth && (
        <>
          <SectionTitle>Sorties par mois</SectionTitle>
          <Card>
            <BarChart data={stats.monthlyStats} valueKey="activitiesCount" labelKey="month" color="#0EA5E9"/>
          </Card>
        </>
      )}

      <View style={{height:32}}/>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:'#F4F4F8' },
  content: { padding:P, paddingTop:20 },
  center: { justifyContent:'center', alignItems:'center' },
  hero: { marginBottom:10 },
  heroLbl: { fontSize:11,fontWeight:'700',color:'#aaa',textTransform:'uppercase',letterSpacing:0.8,marginBottom:4 },
  heroVal: { fontSize:40,fontWeight:'900',color:COLORS.primary,letterSpacing:-1,marginBottom:16 },
  kpiRow: { flexDirection:'row', alignItems:'center' },
  div: { width:1, height:40, backgroundColor:'#f0f0f0' },
  kpi4row: { flexDirection:'row', gap:8, marginBottom:12 },
  kpi4card: { flex:1, backgroundColor:'#fff', borderRadius:14, padding:12, alignItems:'center', shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.05,shadowRadius:4,elevation:1 },
  kpi4icon: { width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center',marginBottom:8 },
  kpi4val: { fontSize:14,fontWeight:'800',color:'#1a1a2e',textAlign:'center' },
  kpi4lbl: { fontSize:9,color:'#aaa',textAlign:'center',marginTop:2 },
  streakBox: { flex:1, alignItems:'center', gap:4 },
  streakDivider: { width:1, backgroundColor:'#f0f0f0', alignSelf:'stretch' },
  streakVal: { fontSize:28,fontWeight:'900',color:'#1a1a2e' },
  streakLbl: { fontSize:10,color:'#aaa',textAlign:'center',lineHeight:14 },
});
