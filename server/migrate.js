import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function waitForDatabase(retries = 20, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (err) {
      if (attempt === retries) throw err
      console.log(`Postgres no esta listo aun (intento ${attempt}/${retries})...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

async function run() {
  console.log('Conectando a Postgres...')
  await waitForDatabase()

  const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  const seed = readFileSync(path.join(__dirname, 'seed.sql'), 'utf8')

  await pool.query(schema)
  console.log('Esquema creado correctamente.')

  await pool.query(seed)
  console.log('Datos iniciales insertados correctamente.')

  await pool.end()
}

run().catch((err) => {
  console.error('Error ejecutando la migracion:', err.message)
  process.exit(1)
})
