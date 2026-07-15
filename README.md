# PMS Hotelero — Prototipo académico de Verificación y Validación (V&V)

Sistema de gestión hotelera (Property Management System) construido con **React + Vite + Tailwind CSS** (frontend), **Express** (API REST) y **PostgreSQL** (persistencia). Es un prototipo educativo desarrollado para la materia de **Verificación y Validación de Software**, cuyo propósito es ofrecer:

1. Una superficie amplia de **reglas de negocio testeables** mediante técnicas de caja negra: partición de equivalencia, análisis de valores límite y tablas de decisión.
2. Un sistema con **módulos cruzados** (Reservas, Recepción, Caja, Ama de Llaves, Reportes) sobre una base de datos relacional real, apto para diseñar **pruebas de integración** entre subsistemas.

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

### 1. Backend (PostgreSQL + Express)

```bash
cd server
docker compose up -d   # levanta solo PostgreSQL en Docker
npm install
npm run migrate         # crea las tablas (schema.sql) y siembra datos (seed.sql)
npm run dev              # API en http://localhost:3001
```

Detalle completo de endpoints y variables de entorno en [`server/README-BACKEND.md`](server/README-BACKEND.md).

### 2. Frontend (Vite)

En otra terminal, desde la raíz del proyecto:

```bash
npm install
cp .env.example .env    # opcional: por defecto ya apunta a http://localhost:3001/api
npm run dev              # app en http://localhost:5173
npm run build            # build de producción
npm run lint              # oxlint
```

Solo PostgreSQL corre en Docker; el backend y el frontend corren con `npm` normal, sin contenedores adicionales.

## Roles

El selector de rol (sin autenticación, solo para fines demostrativos) determina qué módulos son visibles en la barra lateral. El rol activo se guarda en `localStorage` del navegador (no en la base de datos). La lógica vive en `src/constants/roles.js` (mapa `MODULE_ACCESS`) y `src/utils/roles.js` (`canAccessModule(role, moduleId)`, `getAccessibleModules(role)`).

| Rol | Módulos visibles |
|---|---|
| Recepcionista | Reservas, Recepción (Check-in), Caja (Check-out), Acerca del sistema |
| Administrador | Todo lo anterior + Ama de Llaves (Housekeeping) + Reportes |

## Panel de eventos (logs en pantalla)

Barra inferior, colapsable, tipo terminal (`src/components/logging/LogPanel.jsx` + `src/context/LogContext.jsx`). Registra en tiempo real cada acción relevante del sistema con formato `[HH:MM:SS] ✓/✗ mensaje`, en verde (éxito) o rojo (error). Vive solo en memoria durante la sesión — no se persiste. Cualquier componente puede loguear mediante `useLog().addLog(mensaje, 'success' | 'error')`.

## Módulos, reglas de negocio y dependencias de base de datos

| Módulo | Rol requerido | Lee de (BD) | Escribe en (BD) | Regla de negocio | Función pura |
|---|---|---|---|---|---|
| **Reservas** | Recepcionista, Administrador | `rooms` | `reservations` | La fecha de salida debe ser posterior a la de llegada (mínimo 1 noche) | `validateDateRange(checkInDate, checkOutDate)` en `src/utils/dates.js` |
| **Reservas** | Recepcionista, Administrador | `rooms` | `reservations` | No se permiten fechas de llegada anteriores a hoy | `isPastDate(checkInDate, todayISO)` en `src/utils/dates.js` |
| **Reservas** | Recepcionista, Administrador | `reservations` | `reservations` | No se permite solapamiento de fechas para la misma habitación entre reservas activas (Pendiente/Confirmada) | `hasDateOverlap(reservations, roomId, checkInDate, checkOutDate, excludeReservationId)` en `src/utils/reservations.js` |
| **Reservas** | Recepcionista, Administrador | `reservations` | `reservations` | Validación agregada de una reserva completa (habitación, huésped, fechas) | `validateReservation(input, existingReservations, excludeReservationId)` en `src/utils/reservations.js` |
| **Reservas** | Recepcionista, Administrador | — | `reservations` | Estados posibles de una reserva: Pendiente → Confirmada / Cancelada | `RESERVATION_STATUSES` en `src/constants/reservations.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | El documento (cédula) debe tener exactamente 10 dígitos numéricos | `validateDocumentId(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | El teléfono debe tener exactamente 10 dígitos numéricos y empezar con 0 | `validatePhone(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Los campos obligatorios (ej. nombre) no pueden estar vacíos | `validateRequiredText(value, fieldLabel)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | La fecha de salida estimada debe ser posterior a la de entrada (mínimo 1 noche) | `validateDateRange(checkInDate, checkOutDate)` en `src/utils/dates.js` (reutilizada) |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Número de noches de la estadía a partir de las fechas | `calculateNights(checkInDate, checkOutDate)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Las noches deben ser un entero ≥ 1 | `isNightsValid(nights)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | Total = tarifa base × noches − descuento | `calculateTotal(baseRate, nights, discount)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_in_history` | El descuento no puede hacer que el total sea menor o igual a cero | `isTotalValid(total)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `rooms` | `rooms` | Solo se permite check-in si la habitación está "Limpia" (validado en UI **y** en la API, `POST /api/checkin` responde 409 si no) | `isRoomAvailableForCheckIn(status)` en `src/constants/rooms.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | `reservations` | `reservations` | Una reserva Confirmada puede precargar el formulario de check-in (habitación, huésped, fechas) | `ReservationConversionPanel` (`src/components/reception/`) + `markReservationCheckedIn` (`src/hooks/useHotelState.js`) |
| **Caja (Check-out)** | Recepcionista, Administrador | `rooms` | `rooms`, `check_out_history` | Solo se permite check-out si la habitación está "Ocupada" (validado en la API, responde 409 si no) | `ROOM_STATUSES.OCCUPIED` en `src/constants/rooms.js` |
| **Ama de Llaves** | Administrador | `rooms` | `rooms` | Solo habitaciones "Sucia" pueden marcarse como limpias | Lógica de estado en `src/pages/HousekeepingPage.jsx` sobre `ROOM_STATUSES` |
| **Ama de Llaves** | Administrador | `rooms` | `rooms` | Una habitación puede enviarse/retirarse de mantenimiento, limpiando huésped/facturación al entrar | `toggleMaintenance(roomId)` en `src/hooks/useHotelState.js` |
| **Reportes / Auditoría** | Administrador | `check_in_history`, `check_out_history` | — | Filtra el historial combinado por rango de fechas y/o número de habitación | `filterHistory(entries, { startDate, endDate, roomNumber })` en `src/utils/reports.js` |
| **Reportes / Auditoría** | Administrador | `check_in_history`, `check_out_history` | — | Calcula el total facturado en el rango filtrado (solo cuenta cada estadía una vez, contando check-ins) | `calculateTotalBilled(entries)` en `src/utils/reports.js` |
| **Selector de Rol** | — | — | — | Determina qué módulos son accesibles según el rol activo | `canAccessModule(role, moduleId)`, `getAccessibleModules(role)` en `src/utils/roles.js` |

El backend combina `check_in_history` y `check_out_history` en `GET /api/history` (ver `server/index.js`); el frontend aplica `filterHistory`/`calculateTotalBilled` sobre el resultado.

## Utilidades de fecha compartidas

`src/utils/dates.js` centraliza el parseo y formateo de fechas (`toDateOnly`, `isValidDateOnly`, `getTodayISO`, `addDaysISO`) para que las comparaciones de fecha en `reservations.js` y `billing.js` sean consistentes. En el backend, `server/db.js` fuerza a Postgres a devolver columnas `DATE` como el string `'YYYY-MM-DD'` tal cual, evitando desfases por huso horario.

## Casos de prueba sugeridos (funciones puras, caja negra)

- **`validateDocumentId`**: cadena vacía, 9 dígitos, 10 dígitos, 11 dígitos, dígitos con letras.
- **`validatePhone`**: 10 dígitos que no inician con 0, 10 dígitos que inician con 0, longitud inválida, caracteres no numéricos.
- **`calculateNights` / `isNightsValid`**: mismo día (0 noches), 1 noche (límite inferior válido), rango de varias noches, fechas invertidas.
- **`calculateTotal` / `isTotalValid`**: descuento igual a la tarifa total (total = 0, inválido), descuento mayor (total negativo, inválido), descuento menor (válido).
- **`hasDateOverlap`**: reservas idénticas, solapamiento parcial al inicio/fin, mismo día de checkout/checkin (turnover, no debe considerarse solapamiento), habitaciones distintas, reserva cancelada (no debe bloquear).
- **`isPastDate`**: fecha de ayer, fecha de hoy (límite, válida), fecha de mañana.
- **`filterHistory`**: entrada exactamente en el límite `startDate`/`endDate`, fuera de rango, habitación que no coincide.

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

## Estructura relevante

```
server/                Backend (Express + PostgreSQL)
  docker-compose.yml    Servicio único de PostgreSQL 16
  schema.sql             Definición de tablas (rooms, reservations, check_in_history, check_out_history)
  seed.sql                Datos iniciales (4 habitaciones)
  index.js                 Endpoints REST
  migrate.js               Ejecuta schema.sql + seed.sql contra el contenedor

src/
  components/
    reception/       CheckInForm, RoomSelector, ReservationConversionPanel
    reservations/     ReservationForm, ReservationList
    layout/           AppLayout, Sidebar (selector de rol + navegación)
    shared/           StatusBadge, RequiredLabel
    logging/            LogPanel
  context/
    LogContext.jsx    Contexto de logs en memoria (addLog, clearLogs)
  pages/              ReservationsPage, ReceptionPage, CheckoutPage,
                      HousekeepingPage, ReportsPage, AboutPage
  hooks/
    useHotelState.js  Estado central (rooms, reservations) respaldado por la API + logging de cada acción
  utils/
    validation.js     Validaciones de formato de campos
    billing.js        Cálculo de noches y tarifas
    reservations.js   Validación de fechas y solapamiento de reservas
    reports.js        Filtrado y totalización del historial de auditoría
    roles.js          Control de acceso por rol
    dates.js          Utilidades de fecha compartidas
    storage.js        Persistencia del rol activo en localStorage
    api.js             Cliente fetch hacia la API REST
  constants/
    rooms.js          Estados y estilos de habitaciones (paleta carmesí/vino)
    reservations.js   Estados y estilos de reservas
    roles.js          Roles y mapa de acceso a módulos
```
