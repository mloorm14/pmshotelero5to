-- Esquema relacional del PMS Hotelero.
-- Re-ejecutable: elimina las tablas si ya existen antes de recrearlas.

DROP TABLE IF EXISTS check_out_history CASCADE;
DROP TABLE IF EXISTS check_in_history CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE rooms (
  id              SERIAL PRIMARY KEY,
  number          VARCHAR(10) NOT NULL UNIQUE,
  status          VARCHAR(30) NOT NULL DEFAULT 'Limpia',
  guest_name      VARCHAR(200),
  guest_document  VARCHAR(20),
  guest_phone     VARCHAR(20),
  check_in_date   DATE,
  check_out_date  DATE,
  base_rate       NUMERIC(10, 2),
  discount        NUMERIC(10, 2),
  total           NUMERIC(10, 2)
);

CREATE TABLE reservations (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER NOT NULL REFERENCES rooms(id),
  guest_name      VARCHAR(200) NOT NULL,
  check_in_date   DATE NOT NULL,
  check_out_date  DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  checked_in      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE check_in_history (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER REFERENCES rooms(id),
  room_number     VARCHAR(10) NOT NULL,
  guest_name      VARCHAR(200) NOT NULL,
  guest_document  VARCHAR(20) NOT NULL,
  guest_phone     VARCHAR(20) NOT NULL,
  nights          INTEGER NOT NULL,
  total           NUMERIC(10, 2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE check_out_history (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER REFERENCES rooms(id),
  room_number     VARCHAR(10) NOT NULL,
  guest_name      VARCHAR(200),
  total           NUMERIC(10, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_checkin_history_room_id ON check_in_history(room_id);
CREATE INDEX idx_checkout_history_room_id ON check_out_history(room_id);
CREATE INDEX idx_checkin_history_created_at ON check_in_history(created_at);
CREATE INDEX idx_checkout_history_created_at ON check_out_history(created_at);
