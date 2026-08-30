import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus, apiCheckIn, getUserIdByName } from './helpers/api'

const ROOM_101_ID = 1

// TC-08 — Cargo de minibar aumenta el saldo pendiente
// Tipo de prueba: Funcional / Caja Negra — análisis de valores límite
// (verifica que el delta del saldo sea EXACTAMENTE precio × cantidad, no
// solo que suba).
test('TC-08: agregar 2x Agua embotellada sube el saldo exactamente en $3.00', async ({ page, request }) => {
  await setRoomStatus(request, ROOM_101_ID, 'Limpia')
  const userId = await getUserIdByName(request, 'Luis Cedeño')
  await apiCheckIn(request, {
    roomId: ROOM_101_ID,
    guest: { fullName: 'Paola Nevárez', documentId: '0967890123', phone: '0943210987' },
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

  const room101Card = page.locator('article', { hasText: 'Hab. 101' })
  await expect(room101Card).toContainText('$45.00')
  await expect(room101Card).toContainText('por cobrar')

  await room101Card.getByLabel('Producto').selectOption({ label: 'Agua embotellada ($1.50)' })
  await room101Card.getByLabel('Cantidad').fill('2')
  await room101Card.getByRole('button', { name: 'Agregar' }).click()

  await expect(room101Card.getByText('Consumo de minibar: $3.00')).toBeVisible()
  await expect(room101Card).toContainText('2 × Agua embotellada')
  await expect(room101Card).toContainText('Luis Cedeño')

  // Saldo total: 45.00 (habitación) + 3.00 (minibar) = 48.00.
  await expect(room101Card).toContainText('$48.00')
  await expect(room101Card).toContainText('por cobrar')

  await page.screenshot({ path: 'evidence/TC-08.png', fullPage: true })
})
