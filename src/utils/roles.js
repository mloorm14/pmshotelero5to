import { MODULE_ACCESS } from '../constants/roles'

export function canAccessModule(role, moduleId) {
  return MODULE_ACCESS[moduleId]?.includes(role) ?? false
}

export function getAccessibleModules(role) {
  return Object.keys(MODULE_ACCESS).filter((moduleId) => canAccessModule(role, moduleId))
}
