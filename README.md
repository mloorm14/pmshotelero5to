# PMS Hotelero — Prototipo académico de Verificación y Validación (V&V)

Sistema de gestión hotelera (Property Management System) construido con **React + Vite + Tailwind CSS** (frontend), **Express** (API REST) y **PostgreSQL** (persistencia). Es un prototipo educativo desarrollado para la materia de **Verificación y Validación de Software**, cuyo propósito es ofrecer:

1. Una superficie amplia de **reglas de negocio testeables** mediante técnicas de caja negra: partición de equivalencia, análisis de valores límite y tablas de decisión.
2. Un sistema con **módulos cruzados** (Reservas, Recepción, Caja, Ama de Llaves, Pagos, Habitaciones, Disponibilidad, Reportes) sobre una base de datos relacional real, apto para diseñar **pruebas de integración** entre subsistemas.

Todas las reglas de negocio siguen implementadas como **funciones puras** (sin dependencias de React, sin efectos secundarios) en `src/utils/`, separadas por completo de los componentes de interfaz.

## Arquitectura

```
┌──────────────┐        fetch (JSON)        ┌──────────────┐        SQL parametrizado        ┌──────────────┐
│   React      │  ───────────────────────▶  │  Express API │  ───────────────────────────▶   │  PostgreSQL  │
│  (Vite, :5173)│  ◀───────────────────────  │   (:3001)    │  ◀───────────────────────────   │   (:5432)    │
└──────────────┘                             └──────────────┘                                  └──────────────┘
```

- El **frontend** no persiste nada en `localStorage` (salvo el rol activo, que es solo una preferencia de UI). Todo el estado de negocio (habitaciones, reservas, historial) vive en PostgreSQL y se lee/escribe vía la API.
- El **backend** no usa ORM: SQL parametrizado con el paquete `pg`, sin autenticación (prototipo académico).
- Ver también la página **"Acerca del sistema"** dentro de la app (o `src/pages/AboutPage.jsx`) para el mapa de dependencias entre módulos y tablas.

## Instalación y ejecución

### Requisitos previos

- **Git**
- **Node.js 20.19 o superior** (recomendado 22+) con **npm** — `node --version`
- **Docker Desktop instalado y abierto/corriendo** (no basta con tenerlo instalado: el ícono debe mostrar que el motor de Docker está activo antes del siguiente paso)

Se necesitan **dos terminales abiertas en paralelo**: una para el backend y otra para el frontend. Ambas quedan corriendo con `npm run dev` (el proceso no termina solo); no cierres ninguna de las dos mientras usas la app.

### 0. Clonar el repositorio

```bash
git clone https://github.com/mloorm14/pmshotelero5to.git
cd pmshotelero5to
```

Todo lo que sigue se ejecuta a partir de esta carpeta (`pmshotelero5to/`).

### 1. Backend — Terminal 1 (PostgreSQL + Express)

```bash
cd server
docker compose up -d   # levanta solo PostgreSQL en Docker
npm install
npm run migrate         # crea las tablas (schema.sql) y siembra datos (seed.sql)
npm run dev              # API en http://localhost:3001, queda escuchando
```

Deja esta terminal abierta. Detalle completo de endpoints y variables de entorno en [`server/README-BACKEND.md`](server/README-BACKEND.md).

**Si `docker compose up -d` falla porque el puerto 5432 ya está en uso** (por ejemplo, otro proyecto con Postgres corriendo), diagnostica con:

```bash
docker ps
```

y revisa qué contenedor tiene publicado el puerto `5432` (columna `PORTS`).

### 2. Frontend — Terminal 2 (Vite)

Abre una **segunda terminal** (sin cerrar la del backend) y, desde la raíz del proyecto (`pmshotelero5to/`, **no** dentro de `server/`):

```bash
npm install
cp .env.example .env    # opcional: por defecto ya apunta a http://localhost:3001/api
npm run dev              # app en http://127.0.0.1:5173, queda escuchando
```

El servidor de desarrollo de Vite hace bind explícito a `127.0.0.1` (ver `vite.config.js`) en vez de `localhost`, que en Windows puede resolver primero a `::1` (loopback IPv6) y fallar con `EACCES` por firewall/antivirus.

Con ambas terminales corriendo, abre **http://127.0.0.1:5173** en el navegador.

```bash
npm run build            # build de producción
npm run lint              # oxlint
```

Solo PostgreSQL corre en Docker; el backend y el frontend corren con `npm` normal, sin contenedores adicionales.

## Roles

El selector de rol (sin autenticación, solo para fines demostrativos) determina qué módulos son visibles en la barra lateral. El rol activo se guarda en `localStorage` del navegador (no en la base de datos). La lógica vive en `src/constants/roles.js` (mapa `MODULE_ACCESS`) y `src/utils/roles.js` (`canAccessModule(role, moduleId)`, `getAccessibleModules(role)`).

| Rol | Módulos visibles |
|---|---|
| Recepcionista | Reservas, Recepción (Check-in), Caja (Check-out), Disponibilidad, Acerca del sistema |
| Administrador | Todo lo anterior + Ama de Llaves (Housekeeping) + Habitaciones (CRUD) + Reportes |

Disponibilidad es de solo lectura (no modifica ningún dato), por eso también está habilitada para Recepcionista: es la vista natural para decidir en qué habitación ofrecer una reserva. Habitaciones (CRUD) sí cambia el catálogo de habitaciones (alta/edición/baja), por eso queda restringida a Administrador.

## Panel de eventos (logs en pantalla)

Barra inferior, colapsable, tipo terminal (`src/components/logging/LogPanel.jsx` + `src/context/LogContext.jsx`). Registra en tiempo real cada acción relevante del sistema con formato `[HH:MM:SS] ✓/✗ mensaje`, en verde (éxito) o rojo (error). Vive solo en memoria durante la sesión — no se persiste. Cualquier componente puede loguear mediante `useLog().addLog(mensaje, 'success' | 'error')`.

## Módulos, reglas de negocio y dependencias de base de datos

| Módulo | Rol requerido | Lee de (BD) | Escribe en (BD) | Regla de negocio | Función pura |
|---|---|---|---|---|---|
| **Reservas** | Recepcionista, Administrador | `rooms` | `reservations` | La fecha de salida debe ser posterior a la de llegada (mínimo 1 noche) | `validateDateRange(checkInDate, checkOutDate)` en `src/utils/dates.js` |
| **Reservas** | Recepcionista, Administrador | `rooms` | `reservations` | No se permiten fechas de llegada anteriores a hoy | `isPastDate(checkInDate, todayISO)` en `src/utils/dates.js` |
| **Reservas** | Recepcionista, Administrador | `reservations` | `reservations` | No se permite solapamiento de fechas para la misma habitación entre reservas activas (Pendiente/Confirmada) | `hasDateOverlap(reservations, roomId, checkInDate, checkOutDate, excludeReservationId)` en `src/utils/reservations.js` |
| **Reservas** | Recepcionista, Administrador | `reservations` | `reservations` | Validación agregada de una reserva completa (habitación, huésped, fechas) | `validateReservation(input, existingReservations, excludeReservationId)` en `src/utils/reservations.js` |
| **Reservas** | Recepcionista, Administrador | — | `reservations` | Ciclo de vida de una reserva: Pendiente → Confirmada → En curso → Finalizada (o Pendiente/Confirmada → Cancelada); En curso/Finalizada ya no admiten cancelación (validado en UI **y** en la API, `PUT /api/reservations/:id` responde 409 si no) — ver sección "Ciclo de vida de una reserva" | `RESERVATION_STATUSES`, `ACTIVE_RESERVATION_STATUSES`, `HISTORY_RESERVATION_STATUSES` en `src/constants/reservations.js` |
| **Reservas** | Recepcionista, Administrador | — | `reservations` | Documento y teléfono del huésped son opcionales en una reserva; si se ingresan, deben tener el mismo formato que en el check-in (validado en UI y API) | `validateReservation` (extendido) en `src/utils/reservations.js`, `validateDocumentId`/`validatePhone` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | El documento (cédula) debe tener exactamente 10 dígitos numéricos | `validateDocumentId(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | El teléfono debe tener exactamente 10 dígitos numéricos y empezar con 0 | `validatePhone(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Los campos obligatorios (ej. nombre) no pueden estar vacíos | `validateRequiredText(value, fieldLabel)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | La fecha de salida estimada debe ser posterior a la de entrada (mínimo 1 noche) | `validateDateRange(checkInDate, checkOutDate)` en `src/utils/dates.js` (reutilizada) |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Número de noches de la estadía a partir de las fechas | `calculateNights(checkInDate, checkOutDate)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Las noches deben ser un entero ≥ 1 | `isNightsValid(nights)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Total = tarifa base × noches − descuento | `calculateTotal(baseRate, nights, discount)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | El descuento no puede hacer que el total sea menor o igual a cero | `isTotalValid(total)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms` | Solo se permite check-in si la habitación está "Limpia" (validado en UI **y** en la API, `POST /api/checkin` responde 409 si no) | `isRoomAvailableForCheckIn(status)` en `src/constants/rooms.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `reservations` | `reservations` | Una reserva Confirmada puede precargar el formulario de check-in (habitación, huésped, fechas, documento, teléfono); al completarse el check-in, la reserva pasa a "En curso" | `ReservationConversionPanel` (`src/components/reception/`) + `startReservation` (`src/hooks/useHotelState.js`) |
| **Recepción (Check-in)** | Recepcionista, Administrador | `reservations` | — | Si la reserva usada trae documento y/o teléfono, esos campos se precargan como **solo lectura** en el check-in — evita registrar una identidad distinta a la de quien reservó | `CheckInForm.jsx` (`form.identityLocked`), precargado en `handleUseReservation` de `ReceptionPage.jsx` |
| **Caja (Check-out)** | Recepcionista, Administrador | `rooms`, `payments` | `rooms`, `check_out_history` | Solo se permite check-out si la habitación está "Ocupada" **y** el saldo con signo de la estadía es $0, salvo un checkout forzado explícito (validado en UI **y** en la API, `POST /api/checkout` responde 409 si no) — ver "Checkout forzado (walk-out)" | `ROOM_STATUSES.OCCUPIED` en `src/constants/rooms.js`, `calculateBalanceDue` en `src/utils/payments.js` |
| **Caja (Check-out)** | Recepcionista, Administrador | `rooms`, `payments` | — | Saldo **con signo** de la estadía (total − anticipos netos − cobros finales ya registrados): positivo = falta cobrar, negativo = corresponde devolver, cero = saldada | `calculateBalanceDue(total, payments)` en `src/utils/payments.js` |
| **Caja (Check-out)** | Recepcionista, Administrador | `reservations` | `reservations` | Al procesar el check-out, si la habitación tiene una reserva "En curso" vinculada, esa reserva pasa a "Finalizada" en la misma transacción | `POST /api/checkout` en `server/index.js` |
| **Caja (Check-out)** | Recepcionista, Administrador | `payments` | `payments` | Checkout forzado (walk-out): exige un motivo de texto y registra el saldo positivo pendiente como `payments.type = 'Saldo pendiente por cobrar'`; no cuenta como ingreso cobrado | `PAYMENT_TYPES.UNCOLLECTED_BALANCE` en `src/utils/payments.js`, `POST /api/checkout` en `server/index.js` |
| **Ama de Llaves** | Administrador | `rooms` | `rooms` | Solo habitaciones "Sucia" pueden marcarse como limpias | Lógica de estado en `src/pages/HousekeepingPage.jsx` sobre `ROOM_STATUSES` |
| **Ama de Llaves** | Administrador | `rooms` | `rooms` | Una habitación puede enviarse/retirarse de mantenimiento, limpiando huésped/facturación al entrar | `toggleMaintenance(roomId)` en `src/hooks/useHotelState.js` |
| **Pagos (anticipo/devolución/cobro final)** | Recepcionista, Administrador | `rooms`, `check_in_history`, `payments` | `payments` | Un anticipo no puede exceder el total de la estadía; una devolución no puede exceder el neto de anticipos registrados; un cobro final no puede exceder el saldo pendiente. `'Saldo pendiente por cobrar'` no es un tipo aceptado por esta validación — solo lo inserta el checkout forzado, directamente | `validatePayment({ type, amount, total, existingPayments })` en `src/utils/payments.js` |
| **Pagos (anticipo/devolución/cobro final)** | Recepcionista, Administrador | `rooms`, `check_in_history` | `payments` | Solo se permite registrar un pago si la habitación está "Ocupada" (hay una estadía activa); valida en la API con `FOR UPDATE` sobre `rooms`, `POST /api/payments` responde 409 si no | Validado en `POST /api/payments` en `server/index.js` |
| **Alertas de check-out** | Recepcionista, Administrador | `rooms` | — | Clasifica cada habitación "Ocupada" según `check_out_date` en `overdue` (vencido), `dueToday` (hoy), `dueSoon` (próximas 24-48h) o `normal` | `classifyCheckoutAlert(checkOutDate, todayISO)` en `src/utils/alerts.js` |
| **Habitaciones (CRUD)** | Administrador | `rooms` | `rooms` | Número de habitación no vacío y único; capacidad entera positiva; tarifa por defecto positiva | `validateRoom({ number, capacity, defaultRate }, existingRooms, excludeRoomId)` en `src/utils/rooms.js` |
| **Habitaciones (CRUD)** | Administrador | `rooms`, `reservations`, `payments` | `rooms` | No se permite eliminar una habitación "Ocupada", con reservas activas (Pendiente/Confirmada) o con anticipos de una estadía sin cerrar (checkout pendiente) | Validado en `DELETE /api/rooms/:id` en `server/index.js` (responde 409) |
| **Disponibilidad** | Recepcionista, Administrador | `rooms`, `reservations` | — | Un día del calendario de una habitación está bloqueado si se solapa con una reserva activa o con la estadía en curso (habitación "Ocupada") | Reutiliza `hasDateOverlap` de `src/utils/reservations.js` (ver `src/pages/AvailabilityPage.jsx`) |
| **Reportes / Auditoría** | Administrador | `check_in_history`, `check_out_history` | — | Filtra el historial combinado por rango de fechas y/o número de habitación | `filterHistory(entries, { startDate, endDate, roomNumber })` en `src/utils/reports.js` |
| **Reportes / Auditoría** | Administrador | `check_in_history`, `check_out_history` | — | Calcula el total facturado en el rango filtrado (solo cuenta cada estadía una vez, contando check-ins) | `calculateTotalBilled(entries)` en `src/utils/reports.js` |
| **Reportes / Auditoría** | Administrador | `payments` (vía `GET /api/history`) | — | Calcula, por separado, el monto total de saldos pendientes de checkouts forzados en el rango filtrado — no se suma al total facturado | `calculateTotalPending(entries)` en `src/utils/reports.js` |
| **Selector de Rol** | — | — | — | Determina qué módulos son accesibles según el rol activo | `canAccessModule(role, moduleId)`, `getAccessibleModules(role)` en `src/utils/roles.js` |

El backend combina `check_in_history`, `check_out_history` y los pagos `'Saldo pendiente por cobrar'` de `payments` (unidos a `check_in_history` para exponer el documento del huésped) en `GET /api/history` (ver `server/index.js`); el frontend aplica `filterHistory`/`calculateTotalBilled`/`calculateTotalPending` sobre el resultado.

**`calculateTotalBilled` no toca la tabla `payments` y eso es intencional, no un descuido**: cuenta el total facturado de una estadía **una sola vez**, leyendo `check_in_history.total` (el total ya calculado en el check-in con `calculateTotal`). Los anticipos, devoluciones y cobros finales registrados en `payments` son la forma en que ese mismo total se cobró (en uno o varios movimientos) — no ingresos adicionales. Si `GET /api/history` o `calculateTotalBilled` sumaran además los montos de `payments`, una estadía de $45 pagada como anticipo de $25 + cobro final de $20 se contaría como $45 (check-in) + $45 (payments) = $90 facturados, el doble de lo real. Por eso Reportes solo lee `check_in_history`/`check_out_history` para el total facturado, y `payments` queda fuera de su alcance por diseño **salvo** para el tipo `'Saldo pendiente por cobrar'`, que `calculateTotalPending` suma en una cifra completamente separada — sigue sin tocar `calculateTotalBilled`, así que no hay riesgo de duplicar el mismo total facturado dos veces: son dos cifras con significado distinto (cobrado vs. pendiente de cobrar) que nunca se mezclan en la misma suma.

## Utilidades de fecha compartidas

`src/utils/dates.js` centraliza el parseo y formateo de fechas (`toDateOnly`, `isValidDateOnly`, `getTodayISO`, `addDaysISO`) para que las comparaciones de fecha en `reservations.js` y `billing.js` sean consistentes. En el backend, `server/db.js` fuerza a Postgres a devolver columnas `DATE` como el string `'YYYY-MM-DD'` tal cual, evitando desfases por huso horario.

## Ciclo de vida de una reserva

```
Pendiente ──confirmar──▶ Confirmada ──check-in──▶ En curso ──check-out──▶ Finalizada
    │                        │
    └──────────cancelar──────┘
```

- **Pendiente**: recién creada (`ReservationForm`).
- **Confirmada**: el recepcionista la confirma (`ReservationList` → botón "Confirmar"). Aparece en `ReservationConversionPanel` para poder usarse en un check-in.
- **En curso**: se usó para precargar un check-in (`startReservation` en `src/hooks/useHotelState.js`, disparado desde `ReceptionPage`). Ya no se puede cancelar — la estadía ya inició.
- **Finalizada**: `POST /api/checkout` marca como "Finalizada", dentro de la misma transacción, la reserva "En curso" de esa habitación (si existe — un check-in sin reserva previa, ej. un walk-in, no tiene ninguna que cerrar). Tampoco se puede cancelar.
- **Cancelada**: solo alcanzable desde Pendiente o Confirmada.

`ACTIVE_RESERVATION_STATUSES` (Pendiente/Confirmada/En curso) y `HISTORY_RESERVATION_STATUSES` (Finalizada/Cancelada) en `src/constants/reservations.js` agrupan estos estados para la UI: `ReservationList.jsx` muestra "Reservas Activas" siempre visible y "Historial" en un `<details>` colapsado por defecto (heurística de Nielsen #6, ver más abajo).

**Decisión de schema — se eliminó el booleano `reservations.checked_in`.** Antes de este fix, una reserva tenía `status` (Pendiente/Confirmada/Cancelada) **y** un booleano `checked_in` independiente, y nada garantizaba que se mantuvieran sincronizados: una reserva con `checked_in: true` podía seguir con `status: 'Confirmada'`, y por eso "Reservas Activas" la mostraba con el botón "Cancelar" visible aunque la estadía ya hubiera empezado. Con `En curso`/`Finalizada` como estados propios, `checked_in` es 100% derivable de `status` — mantener ambos era duplicar la misma información en dos lugares que podían desincronizarse. Se optó por eliminar la columna en vez de mantenerla como flag auxiliar: una sola fuente de verdad para el ciclo de vida completo.

Para encontrar la reserva "En curso" de una habitación al hacer checkout no se usa un `stay_id` como en `payments` — el estado mismo ya identifica sin ambigüedad la reserva vinculada a la estadía activa (solo puede haber una reserva "En curso" por habitación a la vez, igual que solo puede haber una habitación "Ocupada" con una estadía activa).

### Identidad del huésped: reserva ↔ check-in

`reservations.guest_document`/`guest_phone` (`VARCHAR(20)` nullable) permiten opcionalmente capturar el documento y teléfono del huésped ya al reservar. Cuando el check-in se precarga desde una reserva (`ReservationConversionPanel` → `handleUseReservation` en `ReceptionPage.jsx`) y esos campos venían cargados, `CheckInForm.jsx` los muestra en **solo lectura** (`form.identityLocked`) con una nota visible — así no es posible, sin que el sistema lo note, hacer una reserva a nombre de una persona y el check-in a nombre de otra. El nombre del huésped se mantiene editable incluso en ese caso (el nombre exacto en el documento a veces difiere del dado al reservar por teléfono); el punto es cerrar el hueco en documento/teléfono, que son los identificadores reales.

Si el documento/teléfono precargado es incorrecto, hoy no existe una función para editar una reserva ya creada — la nota en pantalla lo deja explícito. Esto queda fuera de alcance de este fix (ver heurística #3 en la auditoría de Nielsen del fix anterior); la vía actual es cancelar la reserva pendiente/confirmada y crear una nueva.

### Checkout forzado (walk-out)

Antes de este fix, "Cobrar saldo pendiente"/"Registrar devolución" y "Procesar Check-out" eran acciones independientes: nada impedía liberar la habitación con saldo sin cobrar, dejando la reserva vinculada "En curso" para siempre (un estado irrecuperable desde la UI). Ahora `POST /api/checkout` calcula el saldo con signo de la estadía (`calculateBalanceDue`) dentro de la misma transacción `FOR UPDATE` y **rechaza el checkout con 409 si el saldo no es $0**, salvo que el body incluya `forced: true` y un `note` no vacío.

- El flag `forced` viaja en el mismo endpoint (`POST /api/checkout { roomId, forced, note }`), no en una ruta separada: reutiliza toda la lógica transaccional ya existente (bloqueo de la fila de `rooms`, cierre de la reserva "En curso", liberación de la habitación) sin duplicarla — la variante forzada es la misma operación con un paso extra, no una operación distinta.
- Con saldo $0 el comportamiento no cambia en absoluto: `forced`/`note` se ignoran, el checkout se procesa directo como siempre.
- En la UI, `CheckoutPage.jsx` deshabilita "Procesar Check-out" mientras el saldo sea distinto de $0 (con la explicación visible del motivo) y ofrece un botón secundario, deliberadamente menos prominente, "Salida sin pago completo" (`ForcedCheckoutAction`) — solo visible cuando el saldo es positivo (el huésped se retira debiendo dinero). Exige un motivo de texto antes de confirmar; no es un bypass silencioso.
- Si el saldo es positivo y se fuerza el checkout, se inserta una fila en `payments` con `type: 'Saldo pendiente por cobrar'` (`PAYMENT_TYPES.UNCOLLECTED_BALANCE` en `src/utils/payments.js`) por el monto exacto del saldo, con el motivo en la nueva columna `payments.note`. Este tipo de pago **no cuenta como ingreso cobrado**: `calculateNetAdvances`/`sumFinalPayments` lo ignoran (igual que `calculateTotalBilled` en Reportes, ver más arriba) — `calculateTotalPending(entries)` lo suma en una cifra separada, mostrada en Reportes junto al documento del huésped para poder localizarlo.
- El caso de saldo **negativo** (el hotel le debe al huésped) no expone el bypass forzado en la UI — la única vía normal es "Registrar devolución", que ya existe y zanja el saldo a $0. La API sí lo permite por consistencia (`forced: true` ignora el signo del saldo), pero no se crea ningún pago especial para ese caso, ya que no hay un tipo de pago definido para "devolución no completada" y no fue pedido por este fix.
- **`payments.type` es `VARCHAR(30)`**, no `VARCHAR(20)` como el resto de columnas de tipo/estado del proyecto: `'Saldo pendiente por cobrar'` (26 caracteres) no entraba en 20. Se detectó en pruebas manuales contra la base real (`value too long for type character varying(20)`, `POST /api/checkout` con `forced: true`) — no lo hubiera atrapado `npm run build`/`npm run lint`, solo una escritura real a la base. Queda como recordatorio de por qué la verificación manual contra Postgres importa además de build/lint.

### Regresión corregida — Reportes quedaba vacío (`GET /api/history`)

Al agregar la tercera rama del `UNION ALL` (pagos `'Saldo pendiente por cobrar'`), la primera rama (`check_in_history`) quedó seleccionando una columna `note` que **esa tabla no tiene** (`check_in_history` nunca tuvo `note`; solo `payments` lo tiene). Eso hacía fallar la consulta completa con un error real de Postgres (`column "note" does not exist`), no un problema de filtros: `GET /api/history` respondía 500, el frontend lo atrapaba en su `catch` y `entries` se quedaba en `[]` — de ahí la tabla vacía y "Total facturado" en $0.00 incluso sin aplicar ningún filtro (`ReportsPage.jsx` llama a `api.getHistory()` sin argumentos; el filtrado es 100% client-side vía `filterHistory`, así que los `?startDate=/&roomNumber=` del backend nunca estaban en juego en este bug). Corregido rellenando esa rama con `NULL::text AS note`, igual que ya se hacía en la rama de `check_out_history`.

**Decisión de diseño — los pagos `'Saldo pendiente por cobrar'` aparecen en ambos lugares de Reportes, a propósito.** Salen listados como una fila más en la tabla principal (`GET /api/history`, tipo "Pendiente de cobro", con documento y motivo) **y además** se suman aparte en la tarjeta "Pendiente de cobro" (`calculateTotalPending`). No es una duplicación de cifras: la tabla es el detalle auditable (qué movimiento específico generó ese pendiente, cuándo, de quién), y la tarjeta es el agregado. Ninguno de los dos se sube al total facturado (`calculateTotalBilled` sigue leyendo solo `Check-in`) — son trazabilidad y resumen del mismo hecho, no dos ingresos.

### Reparación de datos huérfanos preexistentes

Antes de que el bloqueo de checkout existiera, se llegó a reproducir manualmente el bug original contra la base de desarrollo: un checkout sin saldar dejó una reserva atascada en "En curso" con la habitación ya liberada (`Sucia`/"En Mantenimiento"). `server/scripts/repair-orphan-reservation.js` localiza reservas `En curso` cuya habitación ya no está `Ocupada` (la única señal inequívoca de que el checkout pasó por fuera del flujo correcto) y las cierra como `Finalizada`, imprimiendo en consola qué reservas modificó. No reconstruye un pago retroactivo de "Saldo pendiente por cobrar" — no hay forma segura de inferir ese monto después del hecho — y lo deja anotado como limitación conocida en su propia salida. No toca ningún otro dato (a diferencia de `npm run migrate`, que resetea todas las tablas) y es idempotente (correrlo sin huérfanos pendientes no hace nada). No debería volver a hacer falta, ya que el fix de checkout bloqueado impide generar este estado — se deja como herramienta de mantenimiento:

```bash
cd server
npm run repair:orphan-reservations
```

## Casos de prueba sugeridos (funciones puras, caja negra)

- **`validateDocumentId`**: cadena vacía, 9 dígitos, 10 dígitos, 11 dígitos, dígitos con letras.
- **`validatePhone`**: 10 dígitos que no inician con 0, 10 dígitos que inician con 0, longitud inválida, caracteres no numéricos.
- **`calculateNights` / `isNightsValid`**: mismo día (0 noches), 1 noche (límite inferior válido), rango de varias noches, fechas invertidas.
- **`calculateTotal` / `isTotalValid`**: descuento igual a la tarifa total (total = 0, inválido), descuento mayor (total negativo, inválido), descuento menor (válido).
- **`hasDateOverlap`**: reservas idénticas, solapamiento parcial al inicio/fin, mismo día de checkout/checkin (turnover, no debe considerarse solapamiento), habitaciones distintas, reserva cancelada (no debe bloquear).
- **`isPastDate`**: fecha de ayer, fecha de hoy (límite, válida), fecha de mañana.
- **`filterHistory`**: entrada exactamente en el límite `startDate`/`endDate`, fuera de rango, habitación que no coincide.
- **`classifyCheckoutAlert`** (umbral "próximo" = 24-48h, en granularidad de día calendario ya que `check_out_date` es `DATE`): checkout ayer (`overdue`), checkout hoy (límite, `dueToday`), checkout mañana (`dueSoon`), checkout pasado mañana (límite superior de `dueSoon`), checkout en 3 días (`normal`).
- **`validateRoom`** / **`validateRoomNumber`**: número vacío, número duplicado (mismo texto, distinta capitalización), número único válido, edición de la propia habitación (no debe chocar consigo misma vía `excludeRoomId`).
- **`isCapacityValid`**: 0 (inválido), 1 (límite inferior válido), 2.5 (no entero, inválido), 4 (válido).
- **`isDefaultRateValid`**: 0 (límite, inválido), -5 (inválido), 45.5 (válido).
- **`validatePayment`**: anticipo igual al total (límite, válido), anticipo mayor al total (inválido), devolución igual al neto de anticipos (límite, válido), devolución mayor al neto de anticipos (inválido), cobro final igual al saldo pendiente (límite, válido), cobro final mayor al saldo pendiente (inválido), cobro final con saldo ya en 0 (inválido, "no hay saldo pendiente"), monto en 0 o negativo (inválido).
- **`calculateBalanceDue`**: sin anticipos (saldo = total, positivo), anticipo igual al total (saldo = 0), anticipo más cobro final que suman el total (saldo = 0, no debe volver a ofrecerse cobro), saldo negativo (anticipo neto mayor al total; la UI actual no tiene forma de reducir el total de una estadía ya en curso, así que para probar este caso manualmente hay que bajar `billing.total` con `PUT /api/rooms/:id` después de registrar el anticipo — ver heurística #3 más abajo).
- **`validateReservation`** (documento/teléfono opcionales): sin documento ni teléfono (válido), documento de 9 dígitos (inválido, mismo mensaje que en check-in), documento vacío tras `trim()` (tratado como no enviado, válido), teléfono de 10 dígitos que no inicia en 0 (inválido).
- **`calculateTotalPending`**: entradas mixtas de `Check-in`/`Check-out`/`Pendiente de cobro` (solo suma las últimas), lista sin ninguna entrada `Pendiente de cobro` (0), confirmar que su resultado nunca se suma al de `calculateTotalBilled` sobre el mismo conjunto de entradas.

## Casos de prueba de integración sugeridos (mínimo 10, cruzando módulos)

Formato `Subsistema/s: A > B > C`, tal como pide la materia. Todos verificables end-to-end en la UI (con el panel de logs como evidencia) y/o directamente contra la API.

| # | Caso | Subsistema/s | Resultado esperado |
|---|---|---|---|
| 1 | Ciclo de vida completo de una habitación | Reservas > Recepción > Caja > Reportes | Crear reserva → confirmar → convertir a check-in → check-out → el movimiento aparece en Reportes con el total correcto |
| 2 | Bloqueo de check-in por habitación sucia | Ama de Llaves > Recepción | Habitación en estado "Sucia" no puede seleccionarse para check-in; se registra en el LogPanel |
| 3 | Bloqueo de check-in por mantenimiento | Ama de Llaves > Recepción | Habitación "En Mantenimiento" no puede seleccionarse para check-in |
| 4 | Bloqueo de check-in a nivel de API | Recepción > API > PostgreSQL | `POST /api/checkin` sobre una habitación no "Limpia" responde `409` aunque se bypasee la UI |
| 5 | Solapamiento de reservas rechazado | Reservas > Reservas | Segunda reserva con fechas que se cruzan para la misma habitación es rechazada por `hasDateOverlap` |
| 6 | Reserva confirmada precarga el check-in | Reservas > Recepción | Al confirmar una reserva y usarla en Recepción, el formulario se precarga con huésped y fechas correctos |
| 7 | Reserva usada queda excluida de conversión | Reservas > Recepción | Tras completar el check-in de una reserva, esta ya no aparece en el panel "Reservas confirmadas por convertir" |
| 8 | Propagación check-out → Reportes | Caja > Reportes | Al hacer check-out, el total cobrado aparece inmediatamente en Reportes al refrescar la vista |
| 9 | Visibilidad de módulos por rol | Selector de rol > Sidebar | Con rol Recepcionista, "Ama de Llaves" y "Reportes" no aparecen en la navegación ni son accesibles |
| 10 | Filtro de Reportes por rango de fechas | Reportes | Movimientos fuera del rango `startDate`/`endDate` quedan excluidos de la tabla y del total facturado |
| 11 | Filtro de Reportes por habitación | Reportes | Solo se listan los movimientos de la habitación seleccionada |
| 12 | Error de conexión con la API | Frontend > Backend | Con el backend apagado, la carga inicial de datos registra `✗ Error de conexión con la API` en el LogPanel |
| 13 | Anticipo > Check-out > saldo correcto | Recepción > Pagos > Caja | Registrar un anticipo de $X durante el check-in → en Caja el saldo a cobrar debe ser `total - X`, no el total completo |
| 14 | Devolución excede anticipos > rechazada | Pagos > Caja | Con anticipos netos de $X registrados, intentar una devolución mayor a $X → `POST /api/payments` responde 409 y no se registra el pago |
| 15 | Alerta de check-out vencido | Recepción > Caja > Alertas | Hacer check-in con `checkOutDate` de ayer (fecha pasada permitida solo vía API, ya que el formulario exige salida futura) → la habitación aparece como `overdue` en el panel de alertas de Caja y en el contador del Sidebar |
| 16 | Baja de habitación bloqueada por estadía sin cerrar | Ama de Llaves > Pagos > Habitaciones | Hacer check-in con anticipo → enviar la habitación a Mantenimiento (bypass de Caja) → intentar `DELETE /api/rooms/:id` debe responder 409 por anticipos de una estadía sin cerrar |
| 17 | Baja de habitación con reserva activa > rechazada | Reservas > Habitaciones | Crear una reserva Pendiente o Confirmada para una habitación → intentar eliminarla desde Habitaciones → debe rechazarse (409) hasta que la reserva se cancele o se convierta en check-in |
| 18 | Disponibilidad refleja reservas y estadía en curso | Reservas > Disponibilidad > Recepción | Crear una reserva confirmada → sus fechas aparecen bloqueadas en el calendario de Disponibilidad; al hacer check-in de esa habitación, los días de la estadía en curso también quedan bloqueados |
| 19 | Tarifa por defecto precarga el check-in | Habitaciones > Recepción | Crear una habitación con `defaultRate = $Y` → al seleccionarla en Recepción, el campo "Tarifa Base por Noche" se precarga con $Y (editable) |
| 20 | Transición completa de una reserva | Reservas > Recepción > Caja | Crear reserva (Pendiente) → confirmar (Confirmada) → usarla en un check-in (En curso, desaparece de "Reservas Activas" con botón Cancelar y pasa a mostrarse como En curso) → procesar el check-out de esa habitación (Finalizada, se mueve a la sección "Historial" colapsada) |
| 21 | Cancelación bloqueada tras iniciar la estadía | Recepción > Reservas > API | Con una reserva "En curso" (o ya "Finalizada" tras un check-out), el botón "Cancelar" no aparece en la UI; `PUT /api/reservations/:id` con `status: 'Cancelada'` sobre esa reserva responde `409` aunque se bypasee la UI |
| 22 | Cobro final vs. devolución según el signo del saldo | Recepción > Pagos > Caja | Anticipo menor al total → Caja debe ofrecer "Cobrar saldo pendiente" (nunca "Registrar devolución"); tras confirmarlo, el saldo pasa a $0 y no se ofrece ningún botón |
| 23 | Checkout bloqueado con saldo pendiente sin forzar | Recepción > Pagos > Caja > API | Check-in con anticipo parcial → intentar "Procesar Check-out" directo sin cobrar el saldo → el botón está deshabilitado con explicación visible; `POST /api/checkout` sin `forced: true` responde `409` aunque se bypasee la UI |
| 24 | Checkout forzado no infla el total facturado | Caja > Reportes | Mismo escenario del caso 23, usar "Salida sin pago completo" con un motivo → la reserva queda "Finalizada", la habitación pasa a "Sucia", y en Reportes el monto aparece en "Pendiente de cobro" sin sumarse al total facturado (`calculateTotalBilled` no cambia) |
| 25 | Selección visual independiente en Recepción | Reservas > Recepción | Seleccionar una reserva confirmada en "Reservas confirmadas por convertir" y luego una habitación en el grid de abajo → ambos elementos deben mostrar su indicador de selección ("Seleccionada") al mismo tiempo |
| 26 | Identidad precargada desde la reserva es de solo lectura | Reservas > Recepción | Crear una reserva con documento y teléfono → confirmarla → usarla para un check-in → los campos Documento/Teléfono aparecen precargados, de solo lectura, con la nota visible; una reserva sin esos datos deja los campos editables como hoy |

## Heurísticas de Nielsen aplicadas

Auditoría dirigida tras el rework de flujo (reservas, pagos, checkout). No cubre las 10 heurísticas — solo las que aplicaban al estado actual del proyecto.

1. **Visibilidad del estado del sistema.** El LogPanel es evidencia para V&V, no feedback de flujo — un recepcionista no debería tener que abrirlo para saber si algo funcionó. Se agregó `src/hooks/useTransientMessage.js` + `src/components/shared/InlineMessage.jsx`, un mensaje de éxito/error que aparece en la propia pantalla (no solo en logs) y se autooculta. Se conectó en las cinco acciones que lo necesitaban: crear reserva (`ReservationForm.jsx`), check-in (`ReceptionPage.jsx`), check-out y pagos (`CheckoutPage.jsx`), y alta/edición/baja de habitaciones (`RoomForm.jsx`, `RoomList.jsx`).
2. **Coincidencia entre el sistema y el mundo real.** Bug 2: el botón ya no dice "Registrar devolución" cuando en realidad falta cobrar — ahora `CheckoutPage.jsx` muestra "Cobrar saldo pendiente" o "Registrar devolución" según el signo real del saldo, con una frase explicando qué significa el número (`SettlementAction`).
3. **Control y libertad del usuario — gap señalado, no implementado.** No existe forma de deshacer una reserva creada por error salvo cancelarla manualmente (ningún "deshacer" inmediato tras crear), ni de editar el total/tarifa de una estadía ya en curso. Esto último es también la razón por la que el caso "saldo negativo" de `calculateBalanceDue` no es alcanzable desde la UI hoy (solo forzando `PUT /api/rooms/:id` directamente) — quedó fuera de alcance de este fix, pero es la funcionalidad que lo destaparía naturalmente.
4. **Consistencia y estándares.** Se revisó que "anticipo", "saldo" y "estadía" se usen igual en Recepción/Caja/Reportes. El mayor hallazgo real fue de comportamiento, no de texto: `ReservationForm.jsx` y `RoomForm.jsx` no atenuaban su botón de envío cuando el formulario era inválido, a diferencia de `CheckInForm.jsx` — se igualó el patrón en los tres (ver heurística 5).
5. **Prevención de errores.** Además del punto anterior, Bug 2 reemplaza el campo de monto libre de la devolución por un botón de monto fijo no editable (`SettlementAction` en `CheckoutPage.jsx`): ya no se puede cobrar o devolver un valor distinto al que dice el ledger de `payments`.
6. **Reconocimiento antes que recuerdo.** Es el motivo del Bug 1: `ReservationList.jsx` separa "Reservas Activas" (siempre visible) de "Historial" (`<details>` colapsado por defecto) para que el recepcionista no tenga que recordar cuáles reservas ya se usaron.
7. **Minimalismo estético.** No se agregaron elementos puramente decorativos; los íconos nuevos (`icon-check`, `icon-cash`) son informativos (confirman una acción, marcan la sección de dinero), no ornamentales. El propio Bug 2 reduce superficie de UI: un botón de monto fijo en vez de un formulario libre.

### Actualización — segunda ronda de fixes (checkout crítico, selección visual, identidad del huésped)

- **Prevención de errores (5).** El hallazgo más severo de esta ronda: "Procesar Check-out" podía dejar la habitación libre con saldo sin cobrar y la reserva vinculada "En curso" para siempre (estado irrecuperable desde la UI). Ahora el botón se deshabilita con la razón visible mientras el saldo no sea $0, y el único bypass es el flujo explícito "Salida sin pago completo" (`ForcedCheckoutAction` en `CheckoutPage.jsx`), que exige motivo — no es un descuido de un clic, es una acción deliberada y menos prominente que la normal.
- **Coincidencia entre el sistema y el mundo real (2).** El resaltado visual de "Reservas confirmadas por convertir" desaparecía al elegir una habitación porque ambos paneles leían el mismo estado de selección — el sistema mostraba menos de lo que realmente tenía guardado. `ReceptionPage.jsx` ahora mantiene `selectedRoomId` y `selectedReservationId` por separado, y ambos elementos se ven seleccionados a la vez.
- **Prevención de errores (5) / Coincidencia con el mundo real (2).** El check-in permitía, sin que el sistema lo notara, registrar un documento/teléfono distinto al de quien reservó. Documento y teléfono ahora son de solo lectura en el check-in cuando vienen precargados de la reserva, con una nota explícita.
- **Control y libertad del usuario — gap señalado, no implementado.** La nota de solo lectura del punto anterior no puede ofrecer un enlace real a "editar la reserva": esa función no existe todavía. Se documentó tal cual en el propio texto de la nota en pantalla en vez de prometer una salida que no existe (ver "Identidad del huésped: reserva ↔ check-in" más arriba).

## Estructura relevante

```
server/                Backend (Express + PostgreSQL)
  docker-compose.yml    Servicio único de PostgreSQL 16
  schema.sql             Definición de tablas (rooms, reservations, check_in_history, check_out_history, payments)
  seed.sql                Datos iniciales (4 habitaciones con tarifa/capacidad)
  index.js                 Endpoints REST
  migrate.js               Ejecuta schema.sql + seed.sql contra el contenedor

public/
  icons.svg             Sprite de iconos propios (stroke-based) para módulos y acciones
  favicon.svg            Ícono plano con el acento de marca (vino), sin degradados

src/
  index.css             Sistema de diseño: tokens de color (wine/ink), radios y tipografía (@theme de Tailwind v4)
  components/
    reception/       CheckInForm, RoomSelector, ReservationConversionPanel
    reservations/     ReservationForm, ReservationList (reservas activas + historial colapsado)
    rooms/              RoomForm, RoomList (alta/edición/baja de habitaciones)
    layout/           AppLayout, Sidebar (selector de rol + navegación)
    shared/           StatusBadge, RequiredLabel, InlineMessage (feedback visible en pantalla)
    logging/            LogPanel (colapsado por defecto)
  context/
    LogContext.jsx    Provider de logs en memoria; useLog.js expone el hook por separado (Fast Refresh)
  pages/              ReservationsPage, ReceptionPage, CheckoutPage,
                      HousekeepingPage, RoomsPage, AvailabilityPage,
                      ReportsPage, AboutPage
  hooks/
    useHotelState.js       Estado central (rooms, reservations) respaldado por la API + logging de cada acción
    useTransientMessage.js Mensaje de éxito/error autoocultable para InlineMessage (heurística 1)
  utils/
    validation.js     Validaciones de formato de campos
    billing.js        Cálculo de noches y tarifas
    reservations.js   Validación de fechas/solapamiento de reservas y formato opcional de documento/teléfono
    rooms.js          Validación del CRUD de habitaciones (número/capacidad/tarifa) — no confundir con `constants/rooms.js`
    payments.js        Reglas de anticipo/devolución/cobro final/saldo pendiente y saldo con signo (positivo=cobrar, negativo=devolver)
    alerts.js           Clasificación de alertas de check-out (vencido/hoy/próximo/normal)
    reports.js        Filtrado y totalización del historial de auditoría (`calculateTotalBilled`, `calculateTotalPending`)
    roles.js          Control de acceso por rol
    dates.js          Utilidades de fecha compartidas
    storage.js        Persistencia del rol activo en localStorage
    api.js             Cliente fetch hacia la API REST
  constants/
    rooms.js          Estados y estilos de habitaciones (paleta carmesí/vino)
    reservations.js   Estados y estilos de reservas
    roles.js          Roles y mapa de acceso a módulos
```
