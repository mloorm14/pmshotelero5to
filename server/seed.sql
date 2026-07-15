-- Datos iniciales: las mismas 4 habitaciones que existian en constants/rooms.js

INSERT INTO rooms (id, number, status) VALUES
  (1, '101', 'Limpia'),
  (2, '102', 'Limpia'),
  (3, '201', 'Sucia'),
  (4, '202', 'En Mantenimiento');

SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));
