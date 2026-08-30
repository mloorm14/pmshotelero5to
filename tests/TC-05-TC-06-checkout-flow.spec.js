import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus, apiCheckIn, getUserIdByName } from './helpers/api'

const ROOM_101_ID = 1

// TC-05 y TC-06 son la misma secuencia lógica (saldar → poder cerrar), así
// que van en un describe.serial en vez de montar estado independiente cada
// uno: TC-06 depende explícitamente de que TC-05 haya dejado el saldo
// pendiente sin saldar.
test.describe.serial('TC-05 / TC-06 — checkout bloqueado y luego exitoso', () => {
  test('TC-05: checkout bloqueado con saldo pendiente sin saldar', async ({ page, request }) => {
    // Tipo de prueba: Funcional / Caja Negra — tabla de decisión (Ocupada +
    // saldo != 0 => checkout rechazado).
    await setRoomStatus(request, ROOM_101_ID, 'Limpia')
    const userId = await getUserIdByName(request, 'Luis Cedeño')
    await apiCheckIn(request, {
      roomId: ROOM_101_ID,
      guest: { fullName: 'Elena Ríos', documentId: '0945678901', phone: '0965432109' },
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

    const checkoutButton = room101Card.getByRole('button', { name: 'Procesar Check-out' })
    await expect(checkoutButton).toBeDisabled()
    await expect(room101Card).toContainText(
      'No se puede procesar el check-out con saldo por cobrar — use el botón de arriba para saldarlo',
    )

    await page.screenshot({ path: 'evidence/TC-05.png', fullPage: true })
  })

  test('TC-06: checkout exitoso tras saldar el balance', async ({ page }) => {
    // Tipo de prueba: Funcional / Caja Negra — continuación de TC-05
    // (Ocupada + saldo == 0 => checkout permitido).
    await loginAs(page, 'Luis Cedeño')
    await page.getByRole('button', { name: /Caja y Salidas/ }).click()

    const room101Card = page.locator('article', { hasText: 'Hab. 101' })
    await room101Card.getByRole('button', { name: 'Cobrar saldo pendiente ($45.00)' }).click()
    await expect(
      page.getByText('Cobro de $45.00 registrado — habitación 101.'),
    ).toBeVisible()
    await expect(room101Card).toContainText('Estadía saldada')

    const checkoutButton = room101Card.getByRole('button', { name: 'Procesar Check-out' })
    await expect(checkoutButton).toBeEnabled()
    await checkoutButton.click()

    await expect(
      page.getByText('Check-out completado — habitación 101 lista para limpieza.'),
    ).toBeVisible()
    await expect(page.locator('article', { hasText: 'Hab. 101' })).toHaveCount(0)

    await page.screenshot({ path: 'evidence/TC-06.png', fullPage: true })
  })
})
