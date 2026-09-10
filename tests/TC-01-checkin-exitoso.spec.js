import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus } from './helpers/api'

const ROOM_101_ID = 1

// TC-01 — Check-in exitoso en habitación Limpia
// Tipo de prueba: Funcional / Caja Negra — partición de equivalencia (clase
// válida: habitación en estado "Limpia").
test('TC-01: check-in exitoso deja la habitación 101 Ocupada con el total correcto', async ({ page, request }) => {
  await setRoomStatus(request, ROOM_101_ID, 'Limpia')

  await loginAs(page, 'Luis Cedeño')
  await page.getByRole('button', { name: /Recepción/ }).click()

  const room101Card = page.getByRole('button', { name: /Hab\. 101/ })
  await expect(room101Card).toContainText('Limpia')
  await room101Card.click()

  await page.getByLabel('Nombre').fill('María Torres')
  await page.getByLabel('Documento').fill('0912345678')
  await page.getByLabel('Teléfono').fill('0991234567')

  // La tarifa se precarga con room.defaultRate ($45.00) al seleccionar la
  // habitación — 1 noche por defecto (fechas ya vienen hoy → mañana), así
  // que el total esperado es 45.00 * 1 - 0 = 45.00. .first() porque el
  // desglose de cobro repite el mismo monto más abajo en la página (Tarifa
  // base, Subtotal y Total); el total de la caja "Facturación" es el primero
  // en el DOM.
  await expect(page.getByText('$45.00').first()).toBeVisible()

  await page.getByRole('button', { name: 'Confirmar Check-in' }).click()

  await expect(page.getByText('Check-in registrado: María Torres en habitación 101.')).toBeVisible()
  await expect(room101Card).toContainText('Ocupada')

  await page.screenshot({ path: 'evidence/TC-01.png', fullPage: true })
})
