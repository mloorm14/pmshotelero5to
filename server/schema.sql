-- Esquema relacional del PMS Hotelero.
-- Re-ejecutable: elimina las tablas si ya existen antes de recrearlas.

DROP TABLE IF EXISTS payments CASCADE;
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
  total           NUMERIC(10, 2),
  default_rate    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  capacity        INTEGER NOT NULL DEFAULT 1
);

-- room_id de reservations usa ON DELETE CASCADE: al eliminar una habitacion
-- (DELETE /api/rooms/:id) solo pueden quedar reservas Canceladas (las
-- activas bloquean el borrado antes de llegar aqui), y no tiene sentido
-- conservarlas huerfanas. check_in_history/check_out_history/payments usan
-- SET NULL en vez de CASCADE porque son historial de auditoria/facturacion
-- (Reportes) que debe sobrevivir a la habitacion; ya guardan room_number
-- desnormalizado para no depender de la fila de rooms.
-- status es la unica fuente de verdad del ciclo de vida (Pendiente ->
-- Confirmada -> En curso -> Finalizada, o Pendiente/Confirmada -> Cancelada).
-- No existe un booleano `checked_in` aparte: duplicar ese dato en dos lugares
-- es exactamente lo que permitia que una reserva quedara "Confirmada" con el
-- check-in ya hecho (ver README, seccion "Ciclo de vida de una reserva").
-- guest_document/guest_phone son opcionales (a veces se reserva sin tener
-- esos datos a mano): cuando SI se cargan, el check-in los precarga como
-- solo lectura para que no puedan divergir del huesped que reservo (ver
-- README, "Ciclo de vida de una reserva" / identidad del huesped).
CREATE TABLE reservations (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name      VARCHAR(200) NOT NULL,
  guest_document  VARCHAR(20),
  guest_phone     VARCHAR(20),
  check_in_date   DATE NOT NULL,
  check_out_date  DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE check_in_history (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
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
  room_id         INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  room_number     VARCHAR(10) NOT NULL,
  guest_name      VARCHAR(200),
  total           NUMERIC(10, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Movimientos de dinero de una estadia: 'Anticipo', 'Devolución', 'Cobro
-- final' (liquidacion del saldo restante al cierre) o 'Saldo pendiente por
-- cobrar' (checkout forzado/walk-out: el huesped se retira sin saldar, ver
-- POST /api/checkout en server/index.js). Este ultimo tipo NO cuenta como
-- ingreso cobrado -- Reportes lo suma aparte, sin mezclarlo con el total
-- facturado (ver README). stay_id ancla el pago a la fila de
-- check_in_history de esa estadia (una habitacion puede tener muchas
-- estadias a lo largo del tiempo); asi un pago nunca se confunde con el de
-- una estadia anterior u otra futura sobre la misma habitacion. room_id se
-- mantiene ademas para poder filtrar/consultar directamente por habitacion.
-- note es opcional; solo es obligatorio a nivel de aplicacion para el motivo
-- del checkout forzado.
CREATE TABLE payments (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  stay_id         INTEGER NOT NULL REFERENCES check_in_history(id),
  type            VARCHAR(30) NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL,
  method          VARCHAR(20) NOT NULL DEFAULT 'Efectivo',
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_checkin_history_room_id ON check_in_history(room_id);
CREATE INDEX idx_checkout_history_room_id ON check_out_history(room_id);
CREATE INDEX idx_checkin_history_created_at ON check_in_history(created_at);
CREATE INDEX idx_checkout_history_created_at ON check_out_history(created_at);
CREATE INDEX idx_payments_room_id ON payments(room_id);
CREATE INDEX idx_payments_stay_id ON payments(stay_id);
