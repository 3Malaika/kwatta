-- Kwatta : schéma initial (PostgreSQL 13+)

CREATE TABLE zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('client', 'collector', 'admin')),
  pin_hash text NOT NULL,
  zone_id uuid REFERENCES zones(id),
  validated boolean NOT NULL DEFAULT false,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tarifs et réglages : tables de paramètres isolées
CREATE TABLE tariffs (
  waste_type text PRIMARY KEY,
  base_price integer NOT NULL CHECK (base_price >= 0),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE settings (
  key text PRIMARY KEY,
  value numeric NOT NULL
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id),
  collector_id uuid REFERENCES users(id),
  zone_id uuid NOT NULL REFERENCES zones(id),
  waste_type text NOT NULL REFERENCES tariffs(waste_type),
  volume smallint NOT NULL CHECK (volume BETWEEN 1 AND 3),
  price integer NOT NULL CHECK (price >= 0),
  address_hint text NOT NULL,
  lat numeric(9, 6),
  lng numeric(9, 6),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'en_route', 'collected', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  collected_at timestamptz,
  paid_at timestamptz
);
CREATE INDEX reports_zone_status_idx ON reports (zone_id, status);
CREATE INDEX reports_client_idx ON reports (client_id, created_at DESC);
CREATE INDEX reports_collector_idx ON reports (collector_id, created_at DESC);

CREATE TABLE report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id),
  from_status text,
  to_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_events_report_idx ON report_events (report_id, created_at);

-- Photos en stockage de fichiers, seule la clé est en base
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('initial', 'final')),
  storage_key text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photos_report_idx ON photos (report_id);

-- Un paiement au plus par signalement
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL UNIQUE REFERENCES reports(id),
  method text NOT NULL CHECK (method IN ('cash', 'mtn_momo', 'orange_money')),
  amount integer NOT NULL,
  commission integer NOT NULL,
  collector_amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id),
  author_id uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);
