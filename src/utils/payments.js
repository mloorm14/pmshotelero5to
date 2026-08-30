// Reglas de negocio de pagos (anticipos, devoluciones y cobro final) de una estadia.

export const PAYMENT_TYPES = {
  ADVANCE: 'Anticipo',
  REFUND: 'Devolución',
  FINAL_PAYMENT: 'Cobro final',
  // Registrado únicamente por el checkout forzado (walk-out) del lado del
  // servidor (POST /api/checkout) — no pasa por validatePayment ni por
  // POST /api/payments. No cuenta como ingreso cobrado: calculateNetAdvances
  // y sumFinalPayments lo ignoran a propósito, igual que calculateTotalBilled
  // en src/utils/reports.js (ver README).
  UNCOLLECTED_BALANCE: 'Saldo pendiente por cobrar',
}

// Anticipos menos devoluciones ya registrados para la estadia. NO incluye
// 'Cobro final': ese pago liquida el saldo restante al cierre de la
// estadía, no es un anticipo (no debe contar para el tope de "anticipo no
// puede exceder el total" ni para "devolución no puede exceder anticipos").
export function calculateNetAdvances(payments = []) {
  return payments.reduce((net, payment) => {
    if (payment.type === PAYMENT_TYPES.ADVANCE) return net + Number(payment.amount)
    if (payment.type === PAYMENT_TYPES.REFUND) return net - Number(payment.amount)
    return net
  }, 0)
}

function sumFinalPayments(payments = []) {
  return payments
    .filter((payment) => payment.type === PAYMENT_TYPES.FINAL_PAYMENT)
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
}

export function isPaymentAmountValid(amount) {
  return Number.isFinite(amount) && amount > 0
}

// Un anticipo no puede exceder el total de la estadia; una devolución no
// puede exceder el neto de anticipos ya registrados; un cobro final no puede
// exceder el saldo pendiente (total - anticipos netos - cobros ya hechos).
export function validatePayment({ type, amount, total, existingPayments = [] }) {
  const numericAmount = Number(amount)

  if (!isPaymentAmountValid(numericAmount)) {
    return { valid: false, error: 'El monto debe ser mayor a cero' }
  }

  const netAdvances = calculateNetAdvances(existingPayments)

  if (type === PAYMENT_TYPES.ADVANCE) {
    if (netAdvances + numericAmount > Number(total)) {
      return { valid: false, error: 'El anticipo no puede exceder el total de la estadía' }
    }
    return { valid: true, error: null }
  }

  if (type === PAYMENT_TYPES.REFUND) {
    if (numericAmount > netAdvances) {
      return { valid: false, error: 'La devolución no puede exceder los anticipos registrados' }
    }
    return { valid: true, error: null }
  }

  if (type === PAYMENT_TYPES.FINAL_PAYMENT) {
    const pendingDue = Number(total) - netAdvances - sumFinalPayments(existingPayments)
    if (pendingDue <= 0) {
      return { valid: false, error: 'No hay saldo pendiente por cobrar' }
    }
    if (numericAmount > pendingDue) {
      return { valid: false, error: 'El cobro no puede exceder el saldo pendiente' }
    }
    return { valid: true, error: null }
  }

  return { valid: false, error: 'Tipo de pago no reconocido' }
}

// Saldo CON SIGNO de la estadía: positivo = falta cobrar al huésped al
// salir, negativo = corresponde devolver esa diferencia (el anticipo superó
// el total, ej. una estadía que se acortó), cero = saldada. Incluye los
// 'Cobro final' ya registrados (a diferencia de calculateNetAdvances) para
// que el saldo llegue a 0 tras liquidarse y la UI deje de ofrecer
// cobrar/devolver de nuevo.
export function calculateBalanceDue(total, payments = []) {
  return Number(total) - calculateNetAdvances(payments) - sumFinalPayments(payments)
}

// Consumo de minibar/extras de una estadía: es un CARGO, no un pago —
// aumenta el monto a saldar en vez de reducirlo. Quien llama a
// calculateBalanceDue debe sumar esto al total antes de pasarlo (ver
// CheckoutPage.jsx), calculateBalanceDue en sí no cambia de firma.
export function sumMinibarCharges(charges = []) {
  return charges.reduce((sum, charge) => sum + Number(charge.subtotal), 0)
}
