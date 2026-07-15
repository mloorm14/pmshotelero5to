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
CORS_ORIGIN=http://localhost:5173
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/rooms` | Lista todas las habitaciones |
| PUT | `/api/rooms/:id` | Actualiza estado y/o huésped/facturación de una habitación |
| GET | `/api/reservations` | Lista todas las reservas (con número de habitación) |
| POST | `/api/reservations` | Crea una reserva |
| PUT | `/api/reservations/:id` | Actualiza estado (Confirmada/Cancelada) y/o `checkedIn` |
| POST | `/api/checkin` | Procesa un check-in (transacción: actualiza `rooms` + inserta en `check_in_history`) |
| POST | `/api/checkout` | Procesa un check-out (transacción: actualiza `rooms` + inserta en `check_out_history`) |
| GET | `/api/history` | Historial combinado de check-in/check-out, filtrable por `?startDate=&endDate=&roomNumber=` |
| GET | `/api/health` | Verificación simple de que el servidor está arriba |

## Modelo de datos

```
rooms (id, number, status, guest_name, guest_document, guest_phone,
       check_in_date, check_out_date, base_rate, discount, total)

reservations (id, room_id -> rooms.id, guest_name, check_in_date,
              check_out_date, status, checked_in, created_at)

check_in_history (id, room_id -> rooms.id, room_number, guest_name,
                   guest_document, guest_phone, nights, total, created_at)

check_out_history (id, room_id -> rooms.id, room_number, guest_name,
                    total, created_at)
```

`reservations`, `check_in_history` y `check_out_history` referencian `rooms.id` mediante `FOREIGN KEY`.

## Reiniciar la base de datos desde cero

```bash
npm run migrate
```

`schema.sql` hace `DROP TABLE IF EXISTS ... CASCADE` antes de crear las tablas, así que este comando es seguro de repetir cuantas veces haga falta durante el desarrollo.
