# Backend — PMS Hotelero (Express + PostgreSQL)

API REST mínima, sin ORM (SQL parametrizado con `pg`), sin autenticación. Solo PostgreSQL corre en Docker; el servidor Express corre con Node normal.

## Requisitos

- Docker + Docker Compose
- Node.js 18 o superior

## Pasos para levantar el backend

```bash
cd server
docker compose up -d
npm install
npm run migrate
npm run dev
```

- `docker compose up -d` levanta un único contenedor PostgreSQL 16 en el puerto `5432`, con los datos persistidos en un volumen Docker (sobreviven a reinicios del contenedor).
- `npm run migrate` ejecuta `schema.sql` (crea las tablas, es re-ejecutable) y luego `seed.sql` (inserta las 4 habitaciones iniciales) contra el contenedor.
- `npm run dev` levanta la API en `http://localhost:3001` con reinicio automático ante cambios (`node --watch`).

El servidor lee la configuración de conexión desde variables de entorno (ver `.env.example`). Si no se define un `.env`, usa por defecto los mismos valores que `docker-compose.yml` (`pms_user` / `pms_pass` / `pms_hotelero`), así que funciona sin configuración adicional para desarrollo local.

## Variables de entorno

Copia `.env.example` a `.env` si necesitas cambiar algo (puerto, credenciales, origen CORS):

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=pms_user
DB_PASSWORD=pms_pass
DB_NAME=pms_hotelero

PORT=3001
CORS_ORIGIN=http://127.0.0.1:5173
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/rooms` | Lista todas las habitaciones |
| POST | `/api/rooms` | Crea una habitación (número único, capacidad y tarifa por defecto positivas) |
| PUT | `/api/rooms/:id` | Actualiza estado, huésped/facturación y/o número/capacidad/tarifa por defecto de una habitación |
| DELETE | `/api/rooms/:id` | Elimina una habitación. Responde 409 si está "Ocupada", tiene reservas activas (Pendiente/Confirmada) o anticipos de una estadía sin cerrar |
| GET | `/api/reservations` | Lista todas las reservas (con número de habitación) |
| POST | `/api/reservations` | Crea una reserva. `guestDocument`/`guestPhone` son opcionales; si se envían, deben tener formato válido (mismas reglas que el check-in) |
| PUT | `/api/reservations/:id` | Actualiza el `status` de una reserva (Confirmada/En curso/Finalizada/Cancelada). Responde 409 si se intenta cancelar una reserva "En curso" o "Finalizada" |
| POST | `/api/checkin` | Procesa un check-in (transacción: actualiza `rooms` + inserta en `check_in_history`) |
| POST | `/api/checkout` | Procesa un check-out (transacción con `FOR UPDATE` sobre `rooms`). Responde 409 si el saldo con signo de la estadía (`calculateBalanceDue`) es distinto de $0, salvo que el body incluya `forced: true` y `note` (checkout forzado/walk-out): en ese caso, si el saldo era positivo, inserta un pago `'Saldo pendiente por cobrar'` con ese motivo antes de cerrar. Con saldo $0 no cambia nada — `forced`/`note` se ignoran. Siempre marca como "Finalizada" la reserva "En curso" de esa habitación, si existe |
| GET | `/api/payments?roomId=` | Lista los pagos (anticipo/devolución/cobro final) de la estadía activa de una habitación (vacío si no está "Ocupada") |
| POST | `/api/payments` | Registra un anticipo, devolución o cobro final (transacción con `FOR UPDATE` sobre `rooms`; valida contra `validatePayment` de `src/utils/payments.js`). `'Saldo pendiente por cobrar'` no es un tipo aceptado aquí — solo lo inserta `POST /api/checkout` en su flujo forzado |
| GET | `/api/history` | Historial combinado de check-in / check-out / saldos pendientes de checkouts forzados, filtrable por `?startDate=&endDate=&roomNumber=` |
| GET | `/api/health` | Verificación simple de que el servidor está arriba |

## Modelo de datos

```
rooms (id, number, status, guest_name, guest_document, guest_phone,
       check_in_date, check_out_date, base_rate, discount, total,
       default_rate, capacity)

reservations (id, room_id -> rooms.id [ON DELETE CASCADE], guest_name,
              guest_document, guest_phone, check_in_date, check_out_date,
              status, created_at)

check_in_history (id, room_id -> rooms.id [ON DELETE SET NULL], room_number,
                   guest_name, guest_document, guest_phone, nights, total,
                   created_at)

check_out_history (id, room_id -> rooms.id [ON DELETE SET NULL], room_number,
                    guest_name, total, created_at)

payments (id, room_id -> rooms.id [ON DELETE SET NULL],
          stay_id -> check_in_history.id, type, amount, method, note,
          created_at)
```

`reservations.guest_document`/`guest_phone` son opcionales (`VARCHAR(20)` nullable). `payments.note` es `TEXT` nullable; solo es obligatorio a nivel de aplicación para el motivo del checkout forzado (`type = 'Saldo pendiente por cobrar'`). `payments.type` es `VARCHAR(30)` (no `VARCHAR(20)` como el resto de columnas de tipo/estado) porque `'Saldo pendiente por cobrar'` tiene 26 caracteres.

## Reparar datos huérfanos (herramienta de mantenimiento)

```bash
npm run repair:orphan-reservations
```

Cierra como "Finalizada" cualquier reserva `En curso` cuya habitación ya no esté `Ocupada` — el rastro de un checkout que se hizo por fuera del flujo normal (posible solo antes del bloqueo de saldo pendiente de `POST /api/checkout`). No toca ningún otro dato ni resetea nada (a diferencia de `npm run migrate`); imprime en consola qué reservas modificó. Ver `server/scripts/repair-orphan-reservation.js` y el README principal, sección "Reparación de datos huérfanos preexistentes".

`reservations`, `check_in_history`, `check_out_history` y `payments` referencian `rooms.id` mediante `FOREIGN KEY`. `reservations` usa `ON DELETE CASCADE` (al eliminar una habitación solo pueden quedar reservas Canceladas); `check_in_history`, `check_out_history` y `payments` usan `ON DELETE SET NULL` porque son historial de auditoría/facturación que debe sobrevivir a la habitación (ya guardan `room_number` desnormalizado). `payments.stay_id` ancla cada pago a la fila de `check_in_history` de esa estadía específica, para que anticipos/devoluciones de una estadía nunca se mezclen con los de una estadía anterior o futura sobre la misma habitación.

## Reiniciar la base de datos desde cero

```bash
npm run migrate
```

`schema.sql` hace `DROP TABLE IF EXISTS ... CASCADE` antes de crear las tablas, así que este comando es seguro de repetir cuantas veces haga falta durante el desarrollo.
