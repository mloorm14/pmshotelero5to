export const ROLES = {
  RECEPTIONIST: 'Recepcionista',
  ADMIN: 'Administrador',
}

export const MODULE_ACCESS = {
  reservations: [ROLES.RECEPTIONIST, ROLES.ADMIN],
  reception: [ROLES.RECEPTIONIST, ROLES.ADMIN],
  checkout: [ROLES.RECEPTIONIST, ROLES.ADMIN],
  housekeeping: [ROLES.ADMIN],
  rooms: [ROLES.ADMIN],
  availability: [ROLES.RECEPTIONIST, ROLES.ADMIN],
  reports: [ROLES.ADMIN],
  users: [ROLES.ADMIN],
  about: [ROLES.RECEPTIONIST, ROLES.ADMIN],
}
