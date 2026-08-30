import { useState } from 'react'
import RequiredLabel from '../shared/RequiredLabel'
import InlineMessage from '../shared/InlineMessage'
import { useLog } from '../../context/useLog'
import { useTransientMessage } from '../../hooks/useTransientMessage'

function createEmptyForm() {
  return { name: '', price: '' }
}

function validateProductDraft({ name, price }) {
  const errors = {}
  if (!name || name.trim() === '') errors.name = 'El nombre es obligatorio'
  const parsedPrice = Number.parseFloat(price)
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) errors.price = 'El precio debe ser mayor a cero'
  return { valid: Object.keys(errors).length === 0, errors }
}

export default function MinibarForm({ onAddProduct }) {
  const { addLog } = useLog()
  const [form, setForm] = useState(createEmptyForm)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [message, showMessage] = useTransientMessage()

  const { valid, errors } = validateProductDraft(form)
  const showError = (field) => (touched[field] || submitAttempted) && errors[field]

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitAttempted(true)
    if (!valid) {
      addLog(`Error de validación de formulario: ${Object.values(errors)[0]}`, 'error')
      return
    }

    const result = await onAddProduct({
      name: form.name.trim(),
      price: Number.parseFloat(form.price),
    })
    if (!result.ok) {
      showMessage(`No se pudo crear el producto: ${result.error}`, 'error')
      return
    }

    showMessage(`Producto ${form.name.trim()} creado.`)
    setForm(createEmptyForm())
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Nuevo Producto</h3>
        <p className="text-sm text-ink-500">Catálogo de minibar/extras — nombre y precio</p>
      </div>

      <InlineMessage message={message} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <RequiredLabel htmlFor="name">Nombre</RequiredLabel>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('name')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
            placeholder="Ej. Agua embotellada"
          />
          {showError('name') && <p className="mt-1 text-xs text-wine-700">{errors.name}</p>}
        </div>

        <div>
          <RequiredLabel htmlFor="price">Precio</RequiredLabel>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            onBlur={() => handleBlur('price')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('price')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
            placeholder="Ej. 1.50"
          />
          {showError('price') && <p className="mt-1 text-xs text-wine-700">{errors.price}</p>}
        </div>

        <button
          type="submit"
          aria-disabled={!valid}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-white ${
            valid ? 'bg-wine-700 text-white hover:bg-wine-800' : 'cursor-not-allowed bg-ink-200 text-ink-500'
          }`}
        >
          <svg className="h-4 w-4" aria-hidden="true">
            <use href="/icons.svg#icon-plus" />
          </svg>
          Crear Producto
        </button>
      </form>
    </section>
  )
}
