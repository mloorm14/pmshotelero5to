export function isRequired(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export function validateRequiredText(value, fieldLabel = 'Este campo') {
  if (!isRequired(value)) {
    return { valid: false, error: `${fieldLabel} es obligatorio` }
  }
  return { valid: true, error: null }
}

export function validateDocumentId(value) {
  const trimmed = (value ?? '').trim()

  if (trimmed === '') {
    return { valid: false, error: 'El documento es obligatorio' }
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'El documento debe contener solo dígitos numéricos' }
  }
  if (trimmed.length !== 10) {
    return { valid: false, error: 'El documento debe tener exactamente 10 dígitos' }
  }
  return { valid: true, error: null }
}

export function validatePhone(value) {
  const trimmed = (value ?? '').trim()

  if (trimmed === '') {
    return { valid: false, error: 'El teléfono es obligatorio' }
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'El teléfono debe contener solo dígitos numéricos' }
  }
  if (trimmed.length !== 10) {
    return { valid: false, error: 'El teléfono debe tener exactamente 10 dígitos' }
  }
  if (!trimmed.startsWith('0')) {
    return { valid: false, error: 'El teléfono debe iniciar con 0' }
  }
  return { valid: true, error: null }
}
