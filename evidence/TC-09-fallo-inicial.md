# TC-09 — Fallo real en corridas repetidas (antes del fix)

**Causa**: el test creaba un usuario de prueba con `username` único (sufijo
de timestamp, para evitar el choque de `UNIQUE` en la base), pero dejaba
el `fullName` fijo como `"Pedro Nuevo"` en cada corrida. Como no existe
`DELETE /api/users` (por diseño, ver `server/README-BACKEND.md`), cada
corrida de la suite sin volver a migrar la base deja un usuario Pedro
Nuevo más en la tabla — con `username` distinto pero el mismo nombre
visible. El segundo test del archivo localizaba la opción del selector de
login por texto (`page.locator('option', { hasText: 'Pedro Nuevo' })`),
que dejó de ser único a partir de la segunda corrida.

**Reproducción**: `npm run migrate` (estado limpio) → `npx playwright
test` completo (10/10 aprobado) → `npx playwright test
tests/TC-09-crear-usuario-recepcionista.spec.js` de nuevo, sin migrar
entre medio → falla.

## Mensaje de error completo

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('option').filter({ hasText: 'Pedro Nuevo' })
Expected substring: "Recepcionista"
Error: strict mode violation: locator('option').filter({ hasText: 'Pedro Nuevo' }) resolved to 2 elements:
    1) <option value="3">Pedro Nuevo — Recepcionista</option> aka getByLabel('Usuario')
    2) <option value="4">Pedro Nuevo — Recepcionista</option> aka getByLabel('Usuario')

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('option').filter({ hasText: 'Pedro Nuevo' })

    37 |   await expect(page.getByLabel('Usuario')).toBeVisible()
    38 |   const loginOption = page.locator('option', { hasText: 'Pedro Nuevo' })
  > 39 |   await expect(loginOption).toContainText('Recepcionista')
       |                             ^
    40 | })
      at D:\UTEQ\5to semestre\VV\pmshotelero5to\tests\TC-09-crear-usuario-recepcionista.spec.js:39:29
```

Captura automática del fallo (pantalla de login, tomada por Playwright al
momento del timeout — no muestra el `<select>` desplegado, pero se deja
como evidencia complementaria al mensaje de arriba): `TC-09-fallo-inicial.png`.

## Por qué importa

Es un hallazgo real de **diseño de pruebas**, no de la aplicación: los
datos de un test de UI que queda "visible por nombre" deben ser únicos
por corrida si no hay forma de limpiar lo que el test anterior dejó (acá,
literalmente no existe `DELETE /api/users`). Un test que pasa solo contra
una base recién sembrada, y falla en la segunda corrida sin re-seed, no es
independiente — y la independencia entre corridas es justamente lo que
esta ronda de automatización debía garantizar.

## Fix aplicado

`fullName` ahora lleva el mismo sufijo único que ya tenía `username`
(`Pedro Nuevo QA-<timestamp>`), así el locator por texto vuelve a ser
único sin importar cuántas veces se corra la suite sin migrar la base.
Ver el comentario en `tests/TC-09-crear-usuario-recepcionista.spec.js`.
