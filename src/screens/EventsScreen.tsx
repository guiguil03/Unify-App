import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { EventCard } from '../components/events/EventCard';
import { Event } from '../types/event';

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Course matinale en groupe',
    date: '25 Mars 2024 - 7h00',
    location: 'Parc central',
    participants: 10,
    description: 'Rejoignez-nous pour une course matinale en groupe !',
  },
  {
    id: '2',
    title: 'Marathon des débutants',
    date: '1 Avril 2024 - 9h00',
    location: 'Centre-ville',
    participants: 20,
    description: 'Un marathon adapté aux coureurs débutants.',
  },
];

export default function EventsScreen() {
  return (
    <ScrollView style={styles.container}>
      {MOCK_EVENTS.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
});