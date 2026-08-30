import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus } from './helpers/api'

const ROOM_202_ID = 4

// TC-04 — Anticipo que excede el total es rechazado
// Tipo de prueba: Funcional / Caja Negra — análisis de valores límite
// (anticipo > total).
// Nota de diseño: en la UI real el anticipo se captura DENTRO del propio
// formulario de check-in, y CheckInForm.jsx bloquea la validación a nivel
// de formulario completo (`hasInvalidAdvance` invalida `canCheckIn`) — un
// anticipo excesivo no permite completar el check-in en absoluto, no solo
// rechaza el anticipo dejando el check-in hecho. Se verifica ese
// comportamiento real: ni el check-in ni el anticipo se registran.
test('TC-04: un anticipo mayor al total bloquea el check-in completo', async ({ page, request }) => {
  await setRoomStatus(request, ROOM_202_ID, 'Limpia')

  await loginAs(page, 'Luis Cedeño')
  await page.getByRole('button', { name: /Recepción/ }).click()

  const room202Card = page.getByRole('button', { name: /Hab\. 202/ })
  await room202Card.click()
  await page.getByLabel('Nombre').fill('Karla Pico')
  await page.getByLabel('Documento').fill('0934567890')
  await page.getByLabel('Teléfono').fill('0976543210')

  // Tarifa por defecto de la 202 es $80.00 -> total de 1 noche = $80.00.
  await expect(page.getByText('$80.00')).toBeVisible()
  await page.getByLabel('Monto del anticipo ($)').fill('100')

  await expect(
    page.getByText('El anticipo ($100.00) no puede superar el total de la estadía ($80.00).'),
  ).toBeVisible()

  // Mismo motivo que TC-02: aria-disabled (no disabled nativo) — el submit
  // sigue disparando handleSubmit, que internamente revisa canCheckIn y
  // rechaza sin llamar a onCheckIn. force:true evita que Playwright espere
  // indefinidamente a que el atributo aria-disabled desaparezca.
  await page.getByRole('button', { name: 'Confirmar Check-in' }).click({ force: true })

  // No debe aparecer ningún mensaje de éxito, y la habitación sigue Limpia.
  await expect(page.getByText(/Check-in registrado/)).toHaveCount(0)
  await expect(room202Card).toContainText('Limpia')

  await page.getByRole('button', { name: /expandir/ }).click()
  await expect(
    page.getByText(/Error de validación de formulario: el anticipo no puede superar el total de la estadía/),
  ).toBeVisible()

  await page.screenshot({ path: 'evidence/TC-04.png', fullPage: true })
})
