import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'

// TC-09 — Administrador crea un usuario Recepcionista nuevo
// Tipo de prueba: Funcional / Caja Negra — control de acceso + CRUD.
// Nota de diseño: el username lleva un sufijo de timestamp (en vez del
// "pedro.nuevo" literal del diseño en la sección 1) para que la suite sea
// re-ejecutable sin necesitar un `npm run migrate` entre corridas — no hay
// DELETE /api/users, así que un username fijo chocaría (400, "ya existe")
// en cualquier segunda ejecución contra la misma base.
const username = `pedro.nuevo.${Date.now()}`

test('TC-09: un Administrador crea un usuario Recepcionista que aparece activo y en el login', async ({ page }) => {
  await loginAs(page, 'Ana Morales')
  await page.getByRole('button', { name: /Usuarios/ }).click()

  // Por id, no por label: "Usuario" como texto de label choca (substring,
  // insensible a mayúsculas) con los botones "Editar usuario {nombre}" de
  // la tabla de abajo, y RequiredLabel le agrega un "*" oculto que hace que
  // el match exacto tampoco sea confiable.
  await page.getByLabel('Nombre completo').fill('Pedro Nuevo')
  await page.locator('#username').fill(username)
  // El rol por defecto del formulario ya es Recepcionista — no hace falta tocar el <select>.
  await expect(page.getByLabel('Rol')).toHaveValue('Recepcionista')

  await page.getByRole('button', { name: 'Crear Usuario' }).click()
  await expect(page.getByText(`Usuario ${username} creado.`)).toBeVisible()

  const newUserRow = page.locator('tr', { hasText: username })
  await expect(newUserRow).toContainText('Pedro Nuevo')
  await expect(newUserRow).toContainText('Recepcionista')
  await expect(newUserRow).toContainText('Activo')

  await page.screenshot({ path: 'evidence/TC-09.png', fullPage: true })

  await page.getByRole('button', { name: 'Cambiar de usuario' }).click()
  await expect(page.getByLabel('Usuario')).toBeVisible()
  const loginOption = page.locator('option', { hasText: 'Pedro Nuevo' })
  await expect(loginOption).toContainText('Recepcionista')
})
