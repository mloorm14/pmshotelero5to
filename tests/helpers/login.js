import { expect } from '@playwright/test'

// Selecciona un usuario por nombre completo en la pantalla de login simulado
// (UserSelector.jsx) y confirma. El <select> lista "{fullName} — {role}", así
// que buscamos la opción por texto en vez de asumir un value fijo.
export async function loginAs(page, fullName) {
  await page.goto('/')
  const select = page.getByLabel('Usuario')
  await expect(select).toBeVisible()
  const optionValue = await select.locator('option', { hasText: fullName }).getAttribute('value')
  await select.selectOption(optionValue)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // El nombre aparece dos veces tras iniciar sesión (el bloque "Usuario
  // actual" del Sidebar y el subtítulo del header) — se acota al Sidebar y
  // con match exacto para no chocar con "strict mode" de Playwright.
  await expect(page.locator('aside').getByText(fullName, { exact: true })).toBeVisible()
}
