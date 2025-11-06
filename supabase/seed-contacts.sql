-- Script pour créer des relations de contacts entre utilisateurs fictifs
-- À exécuter APRÈS seed-users.sql

-- Récupérer l'ID de l'utilisateur réel (remplacer par votre email)
DO $$
DECLARE
  real_user_id UUID;
  fictif_user_ids UUID[];
  user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur réel
  SELECT id INTO real_user_id FROM users WHERE email = 'guillaumel1103@gmail.com' LIMIT 1;
  
  IF real_user_id IS NULL THEN
    RAISE NOTICE 'Utilisateur réel non trouvé. Assurez-vous d''être inscrit.';
    RETURN;
  END IF;
  
  -- Récupérer les IDs des utilisateurs fictifs
  SELECT ARRAY_AGG(id) INTO fictif_user_ids FROM users WHERE email LIKE '%@fictif.com';
  
  -- Créer des contacts entre l'utilisateur réel et les utilisateurs fictifs
  FOREACH user_id IN ARRAY fictif_user_ids
  LOOP
    -- Ajouter en tant qu'ami (statut accepted)
    INSERT INTO contacts (user_id, contact_id, status, created_at)
    VALUES (real_user_id, user_id, 'accepted', NOW() - (RANDOM() * INTERVAL '30 days'))
    ON CONFLICT DO NOTHING;
    
    -- Ajouter la relation inverse
    INSERT INTO contacts (user_id, contact_id, status, created_at)
    VALUES (user_id, real_user_id, 'accepted', NOW() - (RANDOM() * INTERVAL '30 days'))
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Contacts créés avec succès pour l''utilisateur %', real_user_id;
END $$;

-- Créer quelques demandes en attente (pending)
DO $$
DECLARE
  real_user_id UUID;
  pending_user_ids UUID[];
  user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur réel
  SELECT id INTO real_user_id FROM users WHERE email = 'guillaumel1103@gmail.com' LIMIT 1;
  
  IF real_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Sélectionner 2-3 utilisateurs pour des demandes en attente
  SELECT ARRAY_AGG(id) INTO pending_user_ids 
  FROM users 
  WHERE email LIKE '%@fictif.com' 
  ORDER BY RANDOM() 
  LIMIT 3;
  
  -- Créer des demandes en attente
  FOREACH user_id IN ARRAY pending_user_ids
  LOOP
    -- Demande envoyée par un utilisateur fictif
    INSERT INTO contacts (user_id, contact_id, status, created_at)
    VALUES (user_id, real_user_id, 'pending', NOW() - (RANDOM() * INTERVAL '7 days'))
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Demandes de contact en attente créées';
END $$;

-- Afficher le résultat
SELECT 
  'Contacts créés avec succès !' as message,
  COUNT(*) as nombre_contacts 
FROM contacts 
WHERE user_id IN (SELECT id FROM users WHERE email = 'guillaumel1103@gmail.com')
   OR contact_id IN (SELECT id FROM users WHERE email = 'guillaumel1103@gmail.com');

