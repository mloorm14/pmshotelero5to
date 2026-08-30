import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'
import { setRoomStatus } from './helpers/api'

const ROOM_201_ID = 3

// TC-02 — Check-in bloqueado en habitación no disponible
// Tipo de prueba: Funcional / Caja Negra — partición de equivalencia (clase
// inválida: habitación no "Limpia").
test('TC-02: la habitación 201 (Sucia) no puede seleccionarse para check-in', async ({ page, request }) => {
  await setRoomStatus(request, ROOM_201_ID, 'Sucia')

  await loginAs(page, 'Luis Cedeño')
  await page.getByRole('button', { name: /Recepción/ }).click()

  const room201Card = page.getByRole('button', { name: /Hab\. 201/ })
  await expect(room201Card).toContainText('Sucia')
  await expect(room201Card).toContainText('No disponible para check-in')

  // El botón usa aria-disabled (no disabled nativo) para que el click siga
  // disparando el handler interno, que rechaza la acción y solo registra el
  // bloqueo en el log — por diseño, no un descuido (ver RoomSelector.jsx).
  // Playwright trata aria-disabled="true" como "no enabled" y esperaría para
  // siempre a que deje de estarlo, así que hace falta { force: true }.
  await room201Card.click({ force: true })

  // El formulario de check-in nunca se activa para esta habitación — sigue
  // mostrando el placeholder de "ninguna habitación seleccionada".
  await expect(page.getByText('Seleccione una habitación limpia del grid')).toBeVisible()
  await expect(page.getByLabel('Nombre')).toHaveCount(0)

  // El intento queda registrado como bloqueado en el panel de eventos.
  await page.getByRole('button', { name: /expandir/ }).click()
  await expect(page.getByText(/Check-in bloqueado: habitación 201 no disponible \(Sucia\)/)).toBeVisible()

  await page.screenshot({ path: 'evidence/TC-02.png', fullPage: true })
})
