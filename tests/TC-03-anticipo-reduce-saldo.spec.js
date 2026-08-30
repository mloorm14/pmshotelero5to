import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus } from './helpers/api'

const ROOM_102_ID = 2

// TC-03 — Registrar anticipo reduce el saldo pendiente
// Tipo de prueba: Funcional / Caja Negra.
// El único punto de la UI donde se registra un anticipo es el propio
// formulario de check-in (no existe una acción de "agregar anticipo" a
// mitad de estadía en Caja y Salidas — ahí solo se cobra el saldo final o
// se devuelve), así que el caso se prueba con anticipo incluido en el
// check-in y verificando el saldo resultante en Caja y Salidas.
test('TC-03: un anticipo menor al total reduce el saldo pendiente en Caja y Salidas', async ({ page, request }) => {
  await setRoomStatus(request, ROOM_102_ID, 'Limpia')

  await loginAs(page, 'Luis Cedeño')
  await page.getByRole('button', { name: /Recepción/ }).click()

  await page.getByRole('button', { name: /Hab\. 102/ }).click()
  await page.getByLabel('Nombre').fill('Jorge Salinas')
  await page.getByLabel('Documento').fill('0923456789')
  await page.getByLabel('Teléfono').fill('0987654321')
  await page.getByLabel('Monto del anticipo ($)').fill('20')

  await page.getByRole('button', { name: 'Confirmar Check-in' }).click()
  await expect(
    page.getByText('Check-in registrado: Jorge Salinas en habitación 102 con anticipo de $20.00.'),
  ).toBeVisible()

  await page.getByRole('button', { name: /Caja y Salidas/ }).click()
  const room102Card = page.locator('article', { hasText: 'Hab. 102' })
  await expect(room102Card).toContainText('$45.00') // total de la estadía
  await expect(room102Card).toContainText('$20.00') // anticipo registrado
  await expect(room102Card).toContainText('$25.00') // saldo = 45 - 20
  await expect(room102Card).toContainText('por cobrar')

  await page.screenshot({ path: 'evidence/TC-03.png', fullPage: true })
})
