import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'

// TC-10 — Control de acceso: Recepcionista no ve módulos de Administrador
// Tipo de prueba: Funcional / Caja Negra — prueba de control de acceso
// (visibilidad de módulos por rol).
test('TC-10: el menú de un Recepcionista no incluye Usuarios ni Minibar', async ({ page }) => {
  await loginAs(page, 'Luis Cedeño')

  const sidebar = page.locator('aside')
  await expect(sidebar.getByRole('button', { name: /^Reservas/ })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^Recepción/ })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^Caja y Salidas/ })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^Disponibilidad/ })).toBeVisible()

  await expect(sidebar.getByRole('button', { name: /^Usuarios/ })).toHaveCount(0)
  await expect(sidebar.getByRole('button', { name: /^Minibar/ })).toHaveCount(0)
  await expect(sidebar.getByRole('button', { name: /^Reportes/ })).toHaveCount(0)
  await expect(sidebar.getByRole('button', { name: /^Ama de Llaves/ })).toHaveCount(0)

  await page.screenshot({ path: 'evidence/TC-10.png', fullPage: true })
})
