-- Données de départ (idempotent).
-- ⚠️ Les prix ci-dessous sont des PLACEHOLDERS : à calibrer avec l'enquête de coûts.

INSERT INTO zones (name) VALUES ('Bastos') ON CONFLICT (name) DO NOTHING;

INSERT INTO tariffs (waste_type, base_price) VALUES
  ('menagers', 3000),
  ('organiques', 3000),
  ('plastiques', 2500),
  ('cartons', 2000),
  ('encombrants', 4000)
ON CONFLICT (waste_type) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('fixed_fee', 1500),
  ('commission_rate', 0.10),
  ('rounding_step', 50),
  -- GPS (désactivé tant que gps_per_km = 0)
  ('gps_per_km', 0),
  ('gps_free_km', 0),
  ('min_price', 0),
  ('surcharge', 0)
ON CONFLICT (key) DO NOTHING;
