import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Event } from "../../types/event";
import { COLORS } from "../../constants/colors";

interface EventCardProps {
  event: Event;
  onToggleParticipation?: () => void;
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const DIFFICULTY = {
  easy:   { label: 'Facile',          color: '#10B981', bg: '#D1FAE5' },
  medium: { label: 'Intermédiaire',   color: '#F59E0B', bg: '#FEF3C7' },
  hard:   { label: 'Difficile',       color: '#EF4444', bg: '#FEE2E2' },
};

export function EventCard({ event, onToggleParticipation }: EventCardProps) {
  const raw = new Date(event.rawDate);
  const day     = raw.getDate();
  const month   = MONTHS[raw.getMonth()];
  const hours   = raw.getHours().toString().padStart(2, '0');
  const minutes = raw.getMinutes().toString().padStart(2, '0');
  const time    = `${hours}:${minutes}`;

  const diff = event.difficulty ? DIFFICULTY[event.difficulty] : null;
  const ratio = event.maxParticipants ? event.participants / event.maxParticipants : null;
  const isFull = event.maxParticipants != null && event.participants >= event.maxParticipants && !event.isParticipating;

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.dateBadge}>
          <Text style={styles.dayText}>{day}</Text>
          <Text style={styles.monthText}>{month}</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>

        {event.isParticipating && (
          <View style={styles.registeredBadge}>
            <MaterialCommunityIcons name="check-circle" size={14} color="#fff" />
            <Text style={styles.registeredText}>Inscrit</Text>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Location */}
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={15} color="#888" />
          <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
        </View>

        {/* Badges */}
        {(event.distance != null || diff) && (
          <View style={styles.badges}>
            {event.distance != null && (
              <View style={[styles.badge, { backgroundColor: '#EEF0FF' }]}>
                <MaterialCommunityIcons name="run" size={12} color={COLORS.primary} />
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>{event.distance} km</Text>
              </View>
            )}
            {diff && (
              <View style={[styles.badge, { backgroundColor: diff.bg }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={12} color={diff.color} />
                <Text style={[styles.badgeText, { color: diff.color }]}>{diff.label}</Text>
              </View>
            )}
          </View>
        )}

        {/* Participants */}
        <View style={styles.participantsSection}>
          <View style={styles.participantsHeader}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group-outline" size={15} color="#888" />
              <Text style={styles.infoText}>
                {event.participants}
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} participants
              </Text>
            </View>
            {isFull && (
              <View style={styles.fullBadge}>
                <Text style={styles.fullText}>Complet</Text>
              </View>
            )}
          </View>
          {ratio != null && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(ratio * 100, 100)}%` as any,
                    backgroundColor: ratio >= 1 ? '#EF4444' : ratio >= 0.8 ? '#F59E0B' : COLORS.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Description */}
        {!!event.description && (
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.btn,
            event.isParticipating ? styles.btnLeave : isFull ? styles.btnFull : styles.btnJoin,
          ]}
          onPress={onToggleParticipation}
          disabled={isFull}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={event.isParticipating ? 'exit-run' : 'plus-circle-outline'}
            size={16}
            color="white"
          />
          <Text style={styles.btnText}>
            {event.isParticipating ? 'Se désinscrire' : isFull ? 'Complet' : "S'inscrire"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Header ──────────────────────────────────────
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 44,
  },
  dayText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
  },
  monthText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  registeredBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  registeredText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },

  // ── Body ────────────────────────────────────────
  body: {
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EEF0FF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Participants ─────────────────────────────────
  participantsSection: {
    gap: 6,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  fullBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fullText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },

  // ── Description ─────────────────────────────────
  description: {
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },

  // ── Button ──────────────────────────────────────
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 2,
  },
  btnJoin: {
    backgroundColor: COLORS.primary,
  },
  btnLeave: {
    backgroundColor: '#EF4444',
  },
  btnFull: {
    backgroundColor: '#9CA3AF',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
