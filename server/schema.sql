-- Esquema relacional del PMS Hotelero.
-- Re-ejecutable: elimina las tablas si ya existen antes de recrearlas.

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS check_out_history CASCADE;
DROP TABLE IF EXISTS check_in_history CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Login simulado (sin contraseña real, sin hash, sin JWT): se elige un
-- usuario de una lista y su rol viaja con él. "Eliminar" un usuario está
-- deliberadamente fuera de alcance (ver PUT /api/users/:id en
-- server/index.js) porque rompería la trazabilidad de created_by/
-- performed_by/registered_by de las tablas de abajo; para dar de baja a
-- alguien se usa `active = false`.
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(200) NOT NULL,
  username    VARCHAR(50) NOT NULL UNIQUE,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('Recepcionista', 'Administrador')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_active ON users(active);

-- version: se incrementa en cada UPDATE relevante de rooms/reservations. El
-- backend lo usa para bloqueo optimista en checkout y pagos (los endpoints
-- más sensibles a que dos usuarios trabajen la misma habitación a la vez):
-- antes de guardar, compara la version que el cliente capturó al abrir la
-- pantalla contra la version actual en la fila con FOR UPDATE; si no
-- coinciden, alguien más ya la modificó y se rechaza con 409 en vez de
-- sobrescribir en silencio.
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
  capacity        INTEGER NOT NULL DEFAULT 1,
  version         INTEGER NOT NULL DEFAULT 1
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
-- created_by usa ON DELETE SET NULL (no CASCADE, como room_id de abajo):
-- eliminar un usuario no debe borrar el historial de quién creó qué. Como el
-- CRUD de usuarios solo desactiva (no elimina), esto es más una garantía de
-- integridad que un caso de uso esperado hoy.
CREATE TABLE reservations (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name      VARCHAR(200) NOT NULL,
  guest_document  VARCHAR(20),
  guest_phone     VARCHAR(20),
  check_in_date   DATE NOT NULL,
  check_out_date  DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  version         INTEGER NOT NULL DEFAULT 1,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
  performed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE check_out_history (
  id              SERIAL PRIMARY KEY,
  room_id         INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  room_number     VARCHAR(10) NOT NULL,
  guest_name      VARCHAR(200),
  total           NUMERIC(10, 2),
  performed_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
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
  registered_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_checkin_history_room_id ON check_in_history(room_id);
CREATE INDEX idx_checkout_history_room_id ON check_out_history(room_id);
CREATE INDEX idx_checkin_history_created_at ON check_in_history(created_at);
CREATE INDEX idx_checkout_history_created_at ON check_out_history(created_at);
CREATE INDEX idx_payments_room_id ON payments(room_id);
CREATE INDEX idx_payments_stay_id ON payments(stay_id);
