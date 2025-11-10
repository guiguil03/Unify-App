-- ============================================
-- Fonction PostGIS pour récupérer les runners à proximité
-- Optimisation : Utilise l'index GIST spatial au lieu de Haversine JS
-- ============================================

CREATE OR REPLACE FUNCTION get_nearby_runners(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  last_latitude DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ,
  calculated_distance DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.avatar,
    u.bio,
    u.last_latitude,
    u.last_longitude,
    u.updated_at,
    -- Distance en km calculée par PostGIS (formule Haversine intégrée)
    (ST_Distance(
      u.location::geography,
      ST_MakePoint(user_lon, user_lat)::geography
    ) / 1000)::DOUBLE PRECISION as calculated_distance
  FROM users u
  WHERE u.location IS NOT NULL
    -- Filtrage géographique avec index GIST (idx_users_location_gist)
    AND ST_DWithin(
      u.location::geography,
      ST_MakePoint(user_lon, user_lat)::geography,
      radius_km * 1000  -- Convertir km en mètres
    )
  ORDER BY calculated_distance ASC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- EXEMPLE D'UTILISATION
-- ============================================

-- Rechercher les runners dans un rayon de 10km autour de Paris
-- SELECT * FROM get_nearby_runners(48.8566, 2.3522, 10, 50);

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================

-- DROP FUNCTION IF EXISTS get_nearby_runners;

-- ============================================
-- VÉRIFICATION DE LA PERFORMANCE
-- ============================================

-- EXPLAIN ANALYZE
-- SELECT * FROM get_nearby_runners(48.8566, 2.3522, 10, 50);

-- Attendu : "Bitmap Index Scan on idx_users_location_gist"

