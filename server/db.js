import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Postgres devuelve DATE (OID 1082) como Date en zona horaria del proceso por
// defecto, lo que puede desfasar un dia segun el huso horario del servidor.
// Se fuerza a devolver el string 'YYYY-MM-DD' tal cual esta almacenado, que es
// el formato que ya usan las funciones puras de fecha del frontend (dates.js).
pg.types.setTypeParser(1082, (value) => value)

export const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'pms_user',
  password: process.env.DB_PASSWORD || 'pms_pass',
  database: process.env.DB_NAME || 'pms_hotelero',
})
