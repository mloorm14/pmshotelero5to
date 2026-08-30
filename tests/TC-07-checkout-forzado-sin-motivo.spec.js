import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus, apiCheckIn, getUserIdByName } from './helpers/api'

const ROOM_102_ID = 2

// TC-07 — Checkout forzado sin motivo es rechazado
// Tipo de prueba: Funcional / Caja Negra — valor límite (motivo vacío tras
// trim, la única entrada inválida específica de este flujo).
test('TC-07: "Salida sin pago completo" no se puede confirmar con el motivo vacío', async ({ page, request }) => {
  await setRoomStatus(request, ROOM_102_ID, 'Limpia')
  const userId = await getUserIdByName(request, 'Luis Cedeño')
  await apiCheckIn(request, {
    roomId: ROOM_102_ID,
    guest: { fullName: 'Andrés Molina', documentId: '0956789012', phone: '0954321098' },
    billing: {
      checkInDate: new Date().toISOString().slice(0, 10),
      checkOutDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      baseRate: 45,
      nights: 1,
      discount: 0,
      total: 45,
    },
    userId,
  })

  await loginAs(page, 'Luis Cedeño')
  await page.getByRole('button', { name: /Caja y Salidas/ }).click()

  const room102Card = page.locator('article', { hasText: 'Hab. 102' })
  await room102Card.getByRole('button', { name: 'Salida sin pago completo' }).click()

  const confirmButton = room102Card.getByRole('button', { name: /Confirmar salida sin pago/ })
  await expect(confirmButton).toBeVisible()
  await expect(confirmButton).toBeDisabled()

  await page.screenshot({ path: 'evidence/TC-07.png', fullPage: true })

  // La habitación sigue Ocupada — ningún checkout se completó sin motivo.
  await expect(room102Card).toContainText('por cobrar')
})
