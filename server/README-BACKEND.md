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
| GET | `/api/reservations` | Lista todas las reservas (con número de habitación y nombre de quien la creó, `created_by_name`, vía `LEFT JOIN users`) |
| POST | `/api/reservations` | Crea una reserva. `guestDocument`/`guestPhone` son opcionales; si se envían, deben tener formato válido (mismas reglas que el check-in). `userId` es opcional y se guarda en `created_by` (trazabilidad) |
| PUT | `/api/reservations/:id` | Actualiza el `status` de una reserva (Confirmada/En curso/Finalizada/Cancelada). Responde 409 si se intenta cancelar una reserva "En curso" o "Finalizada". No aplica bloqueo optimista todavía (ver `reservations.version` más abajo) |
| POST | `/api/checkin` | Procesa un check-in (transacción: actualiza `rooms` + inserta en `check_in_history`). `userId` opcional → `check_in_history.performed_by` |
| POST | `/api/checkout` | Procesa un check-out (transacción con `FOR UPDATE` sobre `rooms`). El saldo se calcula sobre `effectiveTotal = room.total + minibarTotal` (suma de `minibar_charges` de la estadía activa) — el minibar es un cargo, no un pago, así que aumenta lo que hay que saldar. Responde 409 si ese saldo con signo (`calculateBalanceDue`) es distinto de $0, salvo que el body incluya `forced: true` y `note` (checkout forzado/walk-out): en ese caso, si el saldo era positivo, inserta un pago `'Saldo pendiente por cobrar'` con ese motivo antes de cerrar. Con saldo $0 no cambia nada — `forced`/`note` se ignoran. Siempre marca como "Finalizada" la reserva "En curso" de esa habitación, si existe. **Bloqueo optimista**: si el body incluye `version` y no coincide con `rooms.version` bajo `FOR UPDATE`, responde 409 sin aplicar ningún cambio ("Esta habitación fue modificada por otro usuario..."); si coincide (o no se envía), la habitación queda con `version = version + 1`. `userId` opcional → `check_out_history.performed_by`. `check_out_history.total` guarda `effectiveTotal` (no `room.total`), y `check_out_history.stay_id` queda anclado a la estadía cerrada |
| GET | `/api/payments?roomId=` | Lista los pagos (anticipo/devolución/cobro final) de la estadía activa de una habitación, con `registered_by_name` vía `LEFT JOIN users` (vacío si no está "Ocupada") |
| POST | `/api/payments` | Registra un anticipo, devolución o cobro final (transacción con `FOR UPDATE` sobre `rooms`; valida contra `validatePayment` de `src/utils/payments.js` usando el mismo `effectiveTotal` que `POST /api/checkout` — un 'Cobro final' no puede exceder el saldo pendiente real, minibar incluido). `'Saldo pendiente por cobrar'` no es un tipo aceptado aquí — solo lo inserta `POST /api/checkout` en su flujo forzado. Mismo **bloqueo optimista** que checkout (`version` opcional, 409 si no coincide) — a diferencia de checkout, este endpoint no tenía ningún `UPDATE rooms` propio; se agregó uno mínimo (`version = version + 1`) solo para que el contador avance y el bloqueo detecte dos pagos concurrentes sobre la misma estadía, que es la razón de aplicarlo aquí. `userId` opcional → `payments.registered_by` |
| GET | `/api/history` | Historial combinado de check-in / check-out / saldos pendientes de checkouts forzados, cada uno con `performedByName` (o `null` si el usuario fue desactivado/eliminado), filtrable por `?startDate=&endDate=&roomNumber=`. Las entradas `'Check-out'` incluyen `minibarTotal` (suma de `minibar_charges` de esa estadía vía `check_out_history.stay_id`; `null` en las demás entradas) |
| GET | `/api/health` | Verificación simple de que el servidor está arriba |
| GET | `/api/users` | Lista usuarios. `?active=true` filtra solo activos (usado por el selector de login); sin el filtro, devuelve todos (incluye inactivos, para la pantalla de administración) |
| POST | `/api/users` | Crea un usuario (`fullName`, `username`, `role`). Requiere `actingRole: 'Administrador'` en el body (ver más abajo) o responde 403. `username` único — responde 400 con mensaje claro (no 500) si ya existe |
| PUT | `/api/users/:id` | Actualiza `fullName`/`role`/`active` (patrón `sets`/`values` dinámico, igual que `PUT /api/rooms/:id`). `username` no es editable — no se lee del body. Requiere `actingRole: 'Administrador'` o responde 403. No existe `DELETE /api/users/:id` a propósito: rompería `created_by`/`performed_by`/`registered_by`; dar de baja es `{ active: false }` |
| GET | `/api/minibar/products` | Lista productos del catálogo de minibar. `?active=true` filtra solo activos (usado por el selector de cargos en Checkout); sin el filtro, devuelve todos (para la pantalla de administración) |
| POST | `/api/minibar/products` | Crea un producto (`name`, `price` > 0). Requiere `actingRole: 'Administrador'` o responde 403. `name` único — 400 con mensaje claro si ya existe |
| PUT | `/api/minibar/products/:id` | Actualiza `name`/`price`/`active` (mismo patrón `sets`/`values` dinámico). Requiere `actingRole: 'Administrador'` o responde 403. No existe `DELETE` a propósito, mismo criterio que usuarios: dar de baja es `{ active: false }` |
| GET | `/api/minibar/charges?roomId=` | Lista los cargos de minibar de la estadía activa de una habitación, con `registered_by_name` vía `LEFT JOIN users` (vacío si no está "Ocupada") |
| POST | `/api/minibar/charges` | Registra un cargo de minibar (`roomId`, `productId`, `quantity` entero > 0) en la estadía activa de una habitación — es un cargo, no un pago: aumenta el saldo a liquidar, no lo reduce. `product_name`/`unit_price` quedan desnormalizados del producto al momento del cargo. 409 si la habitación no está "Ocupada", si no hay estadía activa, o si el producto está desactivado (aunque el id sea válido); 404 si el producto no existe. `userId` opcional → `minibar_charges.registered_by`. Se registra solo al checkout — no hay endpoint para cargar minibar a mitad de la estadía |

## Modelo de datos

```
users (id, full_name, username [UNIQUE], role [CHECK IN Recepcionista/Administrador],
       active, created_at)

rooms (id, number, status, guest_name, guest_document, guest_phone,
       check_in_date, check_out_date, base_rate, discount, total,
       default_rate, capacity, version)

reservations (id, room_id -> rooms.id [ON DELETE CASCADE], guest_name,
              guest_document, guest_phone, check_in_date, check_out_date,
              status, version, created_by -> users.id [ON DELETE SET NULL],
              created_at)

check_in_history (id, room_id -> rooms.id [ON DELETE SET NULL], room_number,
                   guest_name, guest_document, guest_phone, nights, total,
                   performed_by -> users.id [ON DELETE SET NULL], created_at)

check_out_history (id, room_id -> rooms.id [ON DELETE SET NULL], room_number,
                    guest_name, total, stay_id -> check_in_history.id,
                    performed_by -> users.id [ON DELETE SET NULL], created_at)

payments (id, room_id -> rooms.id [ON DELETE SET NULL],
          stay_id -> check_in_history.id, type, amount, method, note,
          registered_by -> users.id [ON DELETE SET NULL], created_at)

minibar_products (id, name [UNIQUE], price, active, created_at)

minibar_charges (id, stay_id -> check_in_history.id,
                  room_id -> rooms.id [ON DELETE SET NULL],
                  product_id -> minibar_products.id [ON DELETE SET NULL],
                  product_name, unit_price, quantity, subtotal,
                  registered_by -> users.id [ON DELETE SET NULL], created_at)
```

`reservations.guest_document`/`guest_phone` son opcionales (`VARCHAR(20)` nullable). `payments.note` es `TEXT` nullable; solo es obligatorio a nivel de aplicación para el motivo del checkout forzado (`type = 'Saldo pendiente por cobrar'`). `payments.type` es `VARCHAR(30)` (no `VARCHAR(20)` como el resto de columnas de tipo/estado) porque `'Saldo pendiente por cobrar'` tiene 26 caracteres.

**`rooms.version`/`reservations.version`** — contador que se incrementa en cada `UPDATE` relevante; el backend lo usa para bloqueo optimista (ver `POST /api/checkout` y `POST /api/payments` arriba). Solo `rooms.version` se usa hoy — `reservations.version` existe en el schema para el mismo propósito pero no está conectado a ningún endpoint todavía (`PUT /api/reservations/:id` tiene un comentario `// TODO: version` marcando dónde iría).

**`users`** — login simulado (sin contraseña/hash/JWT: se elige un usuario de una lista y su rol viaja con él). No hay `DELETE`: eliminar rompería `created_by`/`performed_by`/`registered_by`, por eso esas tres FK usan `ON DELETE SET NULL` en vez de `CASCADE` — igual que `room_id` en las tablas de historial. `POST`/`PUT /api/users` exigen `actingRole: 'Administrador'` en el body porque no hay sesión de servidor que lo sepa por sí sola; es consistencia con que el login tampoco es real, no seguridad — limitación conocida, documentada también en el código.

**`minibar_products`/`minibar_charges`** — consumo de minibar/extras, registrado únicamente al checkout (no hay pantalla para cargarlo a mitad de la estadía). Es un CARGO, no un pago: `POST /api/checkout` y `POST /api/payments` suman `minibar_charges.subtotal` de la estadía activa al `total` de la habitación antes de calcular el saldo (`effectiveTotal`), en vez de restarlo como hacen los `payments`. `product_name`/`unit_price` se guardan desnormalizados en el cargo (igual que `room_number` en las tablas de historial): si el catálogo cambia de precio o se desactiva un producto después, los cargos ya registrados no cambian retroactivamente. No hay `DELETE` de productos ni de cargos individuales, mismo criterio que usuarios — desactivar un producto es `{ active: false }`, y un cargo mal registrado es corrección manual en BD (fuera de alcance). `check_out_history.stay_id` ancla cada checkout a su estadía para que `GET /api/history` pueda sumar el minibar de esa estadía específica (`minibarTotal`) sin tener que adivinarlo — ver `calculateMinibarRevenue` en `src/utils/reports.js`, que la muestra como línea aparte en Reportes sin mezclarla con el total facturado principal (`calculateTotalBilled` sigue basado en las entradas `'Check-in'`, a propósito: cambiarlo a `'Check-out'` dejaría de contar como facturada una estadía en curso hasta que se cierre, una regresión de comportamiento no pedida por este cambio).

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
