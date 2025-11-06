-- Script pour créer des utilisateurs fictifs dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer les utilisateurs fictifs existants (optionnel)
-- DELETE FROM users WHERE email LIKE '%@fictif.com';

-- Insérer des utilisateurs fictifs
INSERT INTO users (auth_user_id, email, name, bio, avatar, total_distance, total_time, sessions, average_pace, created_at)
VALUES
  -- Utilisateur 1
  (
    'fictif-001',
    'marie.laurent@fictif.com',
    'Marie Laurent',
    'Coureuse passionnée depuis 5 ans. J''aime les courses matinales et les trails en montagne.',
    'https://i.pravatar.cc/150?img=1',
    156.8,
    '14h 30min',
    32,
    '5:30 min/km',
    NOW() - INTERVAL '6 months'
  ),
  -- Utilisateur 2
  (
    'fictif-002',
    'thomas.rousseau@fictif.com',
    'Thomas Rousseau',
    'Runner amateur, toujours prêt pour un nouveau défi. Semi-marathon à venir !',
    'https://i.pravatar.cc/150?img=12',
    98.5,
    '9h 15min',
    21,
    '6:00 min/km',
    NOW() - INTERVAL '4 months'
  ),
  -- Utilisateur 3
  (
    'fictif-003',
    'sophie.martin@fictif.com',
    'Sophie Martin',
    'Débutante motivée ! Objectif : courir 10km sans m''arrêter.',
    'https://i.pravatar.cc/150?img=5',
    42.3,
    '4h 20min',
    15,
    '6:15 min/km',
    NOW() - INTERVAL '2 months'
  ),
  -- Utilisateur 4
  (
    'fictif-004',
    'lucas.petit@fictif.com',
    'Lucas Petit',
    'Coureur du dimanche qui essaie de courir tous les jours. En progression constante !',
    'https://i.pravatar.cc/150?img=13',
    124.7,
    '11h 05min',
    28,
    '5:45 min/km',
    NOW() - INTERVAL '5 months'
  ),
  -- Utilisateur 5
  (
    'fictif-005',
    'emma.wilson@fictif.com',
    'Emma Wilson',
    'Trail runner 🏃‍♀️ Amoureuse de la nature et des grands espaces.',
    'https://i.pravatar.cc/150?img=9',
    187.2,
    '18h 40min',
    41,
    '6:10 min/km',
    NOW() - INTERVAL '8 months'
  ),
  -- Utilisateur 6
  (
    'fictif-006',
    'olivier.bernard@fictif.com',
    'Olivier Bernard',
    'Marathon runner. PB : 3h42. Toujours à la recherche de nouveaux partenaires d''entraînement.',
    'https://i.pravatar.cc/150?img=14',
    312.6,
    '25h 15min',
    67,
    '5:20 min/km',
    NOW() - INTERVAL '1 year'
  ),
  -- Utilisateur 7
  (
    'fictif-007',
    'amelie.dubois@fictif.com',
    'Amélie Dubois',
    'Course à pied le matin, yoga le soir. Équilibre et bien-être !',
    'https://i.pravatar.cc/150?img=24',
    67.9,
    '7h 30min',
    18,
    '6:35 min/km',
    NOW() - INTERVAL '3 months'
  ),
  -- Utilisateur 8
  (
    'fictif-008',
    'julien.garcia@fictif.com',
    'Julien Garcia',
    'Ultra-trailer en préparation. 100km à venir en septembre !',
    'https://i.pravatar.cc/150?img=15',
    445.3,
    '42h 20min',
    89,
    '5:40 min/km',
    NOW() - INTERVAL '2 years'
  ),
  -- Utilisateur 9
  (
    'fictif-009',
    'camille.lefevre@fictif.com',
    'Camille Lefèvre',
    'Reconversion sportive après 10 ans sans sport. Motivée à 100% !',
    'https://i.pravatar.cc/150?img=47',
    28.4,
    '3h 10min',
    9,
    '6:45 min/km',
    NOW() - INTERVAL '1 month'
  ),
  -- Utilisateur 10
  (
    'fictif-010',
    'maxime.richard@fictif.com',
    'Maxime Richard',
    'Coureur du midi. Un peu de sport pendant la pause déjeuner !',
    'https://i.pravatar.cc/150?img=33',
    89.6,
    '8h 20min',
    24,
    '5:35 min/km',
    NOW() - INTERVAL '4 months'
  )
ON CONFLICT (email) DO NOTHING;

-- Message de confirmation
SELECT 'Utilisateurs fictifs créés avec succès !' as message;
SELECT COUNT(*) as nombre_utilisateurs FROM users WHERE email LIKE '%@fictif.com';

