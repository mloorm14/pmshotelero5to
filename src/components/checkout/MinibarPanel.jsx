import { useState } from 'react'
import { sumMinibarCharges } from '../../utils/payments'

// Formulario + historial de consumo de minibar de la estadía activa de una
// habitación. Se muestra antes del bloque de saldo (SettlementAction en
// CheckoutPage.jsx): primero se registra qué consumió el huésped, luego se
// ve el saldo actualizado con eso incluido — el minibar es un cargo, no un
// pago, así que sube el saldo en vez de bajarlo.
export default function MinibarPanel({ room, charges, products, onAddCharge }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [quantity, setQuantity] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  const minibarTotal = sumMinibarCharges(charges)

  async function handleSubmit(e) {
    e.preventDefault()
    const parsedQuantity = Number.parseInt(quantity, 10)
    if (!productId || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return

    setSubmitting(true)
    await onAddCharge(productId, parsedQuantity)
    setSubmitting(false)
    setQuantity('1')
  }

  return (
    <section className="mt-4 space-y-3 border-t border-ink-200 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-800">Minibar / Extras</h4>
        <span className="text-sm font-semibold text-wine-700">Consumo de minibar: ${minibarTotal.toFixed(2)}</span>
      </div>

      {products.length === 0 ? (
        <p className="text-xs text-ink-500">No hay productos de minibar activos en el catálogo.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor={`minibar-product-${room.id}`} className="mb-1 block text-xs font-medium text-ink-600">
              Producto
            </label>
            <select
              id={`minibar-product-${room.id}`}
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (${product.price.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`minibar-quantity-${room.id}`} className="mb-1 block text-xs font-medium text-ink-600">
              Cantidad
            </label>
            <input
              id={`minibar-quantity-${room.id}`}
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-ink-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Agregar
          </button>
        </form>
      )}

      {charges.length > 0 && (
        <ul className="space-y-1 text-xs text-ink-600">
          {charges.map((charge) => (
            <li key={charge.id} className="flex items-center justify-between">
              <span>
                {charge.quantity} × {charge.productName}
              </span>
              <span className="text-ink-500">
                ${charge.subtotal.toFixed(2)} — {charge.registeredByName ?? 'No disponible'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
