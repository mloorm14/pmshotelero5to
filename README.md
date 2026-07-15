# PMS Hotelero — Prototipo académico de Verificación y Validación (V&V)

Sistema de gestión hotelera (Property Management System) construido con **React + Vite + Tailwind CSS**. Es un prototipo educativo desarrollado para la materia de **Verificación y Validación de Software**, cuyo propósito es ofrecer una superficie amplia de **reglas de negocio testeables** mediante técnicas de caja negra: partición de equivalencia, análisis de valores límite y tablas de decisión.

Todas las reglas de negocio están implementadas como **funciones puras** (sin dependencias de React, sin efectos secundarios) en `src/utils/`, separadas por completo de los componentes de interfaz. Esto permite diseñar y ejecutar casos de prueba sobre la lógica de negocio de forma aislada, sin necesidad de renderizar la UI.

No hay backend ni autenticación real: todo el estado se persiste en `localStorage` del navegador.

## Cómo ejecutar el proyecto

```bash
npm install
npm run dev      # entorno de desarrollo
npm run build    # build de producción
npm run lint     # oxlint
```

## Roles

El selector de rol (sin autenticación, solo para fines demostrativos) determina qué módulos son visibles en la barra lateral. La lógica vive en `src/constants/roles.js` (mapa `MODULE_ACCESS`) y `src/utils/roles.js` (`canAccessModule(role, moduleId)`, `getAccessibleModules(role)`).

| Rol | Módulos visibles |
|---|---|
| Recepcionista | Reservas, Recepción (Check-in), Caja (Check-out) |
| Administrador | Todo lo anterior + Ama de Llaves (Housekeeping) + Reportes |

## Módulos y reglas de negocio

| Módulo | Rol requerido | Regla de negocio | Función pura |
|---|---|---|---|
| **Reservas** | Recepcionista, Administrador | La fecha de salida debe ser posterior a la de llegada (mínimo 1 noche) | `validateDateRange(checkInDate, checkOutDate)` en `src/utils/dates.js` |
| **Reservas** | Recepcionista, Administrador | No se permiten fechas de llegada anteriores a hoy | `isPastDate(checkInDate, todayISO)` en `src/utils/dates.js` |
| **Reservas** | Recepcionista, Administrador | No se permite solapamiento de fechas para la misma habitación entre reservas activas (Pendiente/Confirmada) | `hasDateOverlap(reservations, roomId, checkInDate, checkOutDate, excludeReservationId)` en `src/utils/reservations.js` |
| **Reservas** | Recepcionista, Administrador | Validación agregada de una reserva completa (habitación, huésped, fechas) | `validateReservation(input, existingReservations, excludeReservationId)` en `src/utils/reservations.js` |
| **Reservas** | Recepcionista, Administrador | Estados posibles de una reserva: Pendiente → Confirmada / Cancelada | `RESERVATION_STATUSES` en `src/constants/reservations.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | El documento (cédula) debe tener exactamente 10 dígitos numéricos | `validateDocumentId(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | El teléfono debe tener exactamente 10 dígitos numéricos y empezar con 0 | `validatePhone(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | Los campos obligatorios (ej. nombre) no pueden estar vacíos | `validateRequiredText(value, fieldLabel)` / `isRequired(value)` en `src/utils/validation.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | La fecha de salida estimada debe ser posterior a la de entrada (mínimo 1 noche) | `validateDateRange(checkInDate, checkOutDate)` en `src/utils/dates.js` (reutilizada) |
| **Recepción (Check-in)** | Recepcionista, Administrador | Número de noches de la estadía a partir de las fechas | `calculateNights(checkInDate, checkOutDate)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | Las noches deben ser un entero ≥ 1 | `isNightsValid(nights)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | Total = tarifa base × noches − descuento | `calculateTotal(baseRate, nights, discount)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | El descuento no puede hacer que el total sea menor o igual a cero | `isTotalValid(total)` en `src/utils/billing.js` |
| **Recepción (Check-in)** | Recepcionista, Administrador | Una reserva Confirmada puede precargar el formulario de check-in (habitación, huésped, fechas) | `ReservationConversionPanel` (`src/components/reception/`) + `markReservationCheckedIn` (`src/hooks/useHotelState.js`) |
| **Caja (Check-out)** | Recepcionista, Administrador | Solo habitaciones con estado "Ocupada" pueden procesar salida | `ROOM_STATUSES.OCCUPIED` en `src/constants/rooms.js` |
| **Ama de Llaves (Housekeeping)** | Administrador | Solo habitaciones "Sucia" pueden marcarse como limpias | Lógica de estado en `src/pages/HousekeepingPage.jsx` sobre `ROOM_STATUSES` |
| **Ama de Llaves (Housekeeping)** | Administrador | Una habitación puede enviarse/retirarse de mantenimiento, limpiando huésped/facturación al entrar | `toggleMaintenance(roomId)` en `src/hooks/useHotelState.js` |
| **Reportes / Auditoría** | Administrador | Combina el historial de check-ins y check-outs en una sola vista ordenada por fecha | `combineHistory(checkInHistory, checkOutHistory)` en `src/utils/reports.js` |
| **Reportes / Auditoría** | Administrador | Filtra el historial combinado por rango de fechas y/o número de habitación | `filterHistory(entries, { startDate, endDate, roomNumber })` en `src/utils/reports.js` |
| **Reportes / Auditoría** | Administrador | Calcula el total facturado en el rango filtrado (solo cuenta cada estadía una vez, evitando doble conteo entre check-in y check-out) | `calculateTotalBilled(entries)` en `src/utils/reports.js` |
| **Selector de Rol** | — | Determina qué módulos son accesibles según el rol activo | `canAccessModule(role, moduleId)`, `getAccessibleModules(role)` en `src/utils/roles.js` |

## Utilidades de fecha compartidas

`src/utils/dates.js` centraliza el parseo y formateo de fechas (`toDateOnly`, `isValidDateOnly`, `getTodayISO`, `addDaysISO`) para que las comparaciones de fecha en `reservations.js` y `billing.js` sean consistentes y no dependan de zonas horarias del navegador.

## Casos de prueba sugeridos (ejemplos para diseño de caja negra)

- **`validateDocumentId`**: cadena vacía, 9 dígitos, 10 dígitos, 11 dígitos, dígitos con letras.
- **`validatePhone`**: 10 dígitos que no inician con 0, 10 dígitos que inician con 0, longitud inválida, caracteres no numéricos.
- **`calculateNights` / `isNightsValid`**: mismo día (0 noches), 1 noche (límite inferior válido), rango de varias noches, fechas invertidas.
- **`calculateTotal` / `isTotalValid`**: descuento igual a la tarifa total (total = 0, inválido), descuento mayor (total negativo, inválido), descuento menor (válido).
- **`hasDateOverlap`**: reservas idénticas, solapamiento parcial al inicio/fin, mismo día de checkout/checkin (turnover, no debe considerarse solapamiento), habitaciones distintas, reserva cancelada (no debe bloquear).
- **`isPastDate`**: fecha de ayer, fecha de hoy (límite, válida), fecha de mañana.
- **`filterHistory`**: entrada exactamente en el límite `startDate`/`endDate`, fuera de rango, habitación que no coincide.

## Estructura relevante

```
src/
  components/
    reception/       CheckInForm, RoomSelector, ReservationConversionPanel
    reservations/     ReservationForm, ReservationList
    layout/           AppLayout, Sidebar (selector de rol + navegación)
    shared/           StatusBadge, RequiredLabel
  pages/              ReservationsPage, ReceptionPage, CheckoutPage,
                      HousekeepingPage, ReportsPage
  hooks/
    useHotelState.js  Estado central (rooms, reservations, historiales) + persistencia
  utils/
    validation.js     Validaciones de formato de campos
    billing.js        Cálculo de noches y tarifas
    reservations.js   Validación de fechas y solapamiento de reservas
    reports.js        Combinación y filtrado del historial de auditoría
    roles.js          Control de acceso por rol
    dates.js          Utilidades de fecha compartidas
    storage.js        Persistencia en localStorage (estado del hotel y rol activo)
  constants/
    rooms.js          Estados y estilos de habitaciones
    reservations.js   Estados y estilos de reservas
    roles.js          Roles y mapa de acceso a módulos
```
