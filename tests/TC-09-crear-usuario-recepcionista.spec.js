import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login'

// TC-09 — Administrador crea un usuario Recepcionista nuevo
// Tipo de prueba: Funcional / Caja Negra — control de acceso + CRUD.
// Nota de diseño: username Y fullName llevan el mismo sufijo de timestamp
// (en vez de los literales "pedro.nuevo"/"Pedro Nuevo" del diseño en la
// sección 1) para que la suite sea re-ejecutable sin necesitar un
// `npm run migrate` entre corridas — no hay DELETE /api/users, así que no
// hay forma de limpiar lo que dejó una corrida anterior. Con username
// único pero fullName fijo, la creación en sí no chocaba (400), pero tras
// una segunda corrida aparecían DOS opciones "Pedro Nuevo — Recepcionista"
// en el selector de login y el locator por texto dejaba de ser único
// (strict mode violation) — ver evidence/TC-09-fallo-inicial.md para el
// error real que esto producía antes de este fix. La técnica elegida es
// "datos únicos por corrida" en vez de limpieza al final, porque no hay
// ningún endpoint que permita esa limpieza (es deliberado, ver
// server/README-BACKEND.md: eliminar un usuario rompería la trazabilidad).
const runSuffix = `QA-${Date.now()}`
const username = `pedro.nuevo.${runSuffix}`
const fullName = `Pedro Nuevo ${runSuffix}`

test('TC-09: un Administrador crea un usuario Recepcionista que aparece activo y en el login', async ({ page }) => {
  await loginAs(page, 'Ana Morales')
  await page.getByRole('button', { name: /Usuarios/ }).click()

  // Por id, no por label: "Usuario" como texto de label choca (substring,
  // insensible a mayúsculas) con los botones "Editar usuario {nombre}" de
  // la tabla de abajo, y RequiredLabel le agrega un "*" oculto que hace que
  // el match exacto tampoco sea confiable.
  await page.getByLabel('Nombre completo').fill(fullName)
  await page.locator('#username').fill(username)
  // El rol por defecto del formulario ya es Recepcionista — no hace falta tocar el <select>.
  await expect(page.getByLabel('Rol')).toHaveValue('Recepcionista')

  await page.getByRole('button', { name: 'Crear Usuario' }).click()
  await expect(page.getByText(`Usuario ${username} creado.`)).toBeVisible()

  const newUserRow = page.locator('tr', { hasText: username })
  await expect(newUserRow).toContainText(fullName)
  await expect(newUserRow).toContainText('Recepcionista')
  await expect(newUserRow).toContainText('Activo')

  await page.screenshot({ path: 'evidence/TC-09.png', fullPage: true })

  await page.getByRole('button', { name: 'Cambiar de usuario' }).click()
  await expect(page.getByLabel('Usuario')).toBeVisible()
  const loginOption = page.locator('option', { hasText: fullName })
  await expect(loginOption).toContainText('Recepcionista')
})
