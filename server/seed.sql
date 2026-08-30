-- Datos iniciales: las mismas 4 habitaciones que existian en constants/rooms.js,
-- ahora con tarifa por defecto y capacidad (CRUD de habitaciones).

INSERT INTO rooms (id, number, status, default_rate, capacity) VALUES
  (1, '101', 'Limpia', 45.00, 2),
  (2, '102', 'Limpia', 45.00, 2),
  (3, '201', 'Sucia', 65.00, 3),
  (4, '202', 'En Mantenimiento', 80.00, 4);

SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));

-- Login simulado: usuarios base para poder entrar al sistema desde cero.
INSERT INTO users (id, full_name, username, role, active) VALUES
  (1, 'Ana Morales', 'ana.admin', 'Administrador', true),
  (2, 'Luis Cedeño', 'luis.recepcion', 'Recepcionista', true);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Catálogo inicial de minibar/extras.
INSERT INTO minibar_products (id, name, price, active) VALUES
  (1, 'Agua embotellada', 1.50, true),
  (2, 'Gaseosa', 2.00, true),
  (3, 'Cerveza nacional', 3.50, true),
  (4, 'Vino (copa)', 8.00, true),
  (5, 'Snack salado', 2.50, true),
  (6, 'Chocolate', 3.00, true);

SELECT setval('minibar_products_id_seq', (SELECT MAX(id) FROM minibar_products));
