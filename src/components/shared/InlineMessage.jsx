export default function InlineMessage({ message }) {
  if (!message) return null

  const isError = message.type === 'error'

  return (
    <div
      role="status"
      className={`mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        isError ? 'border-wine-300 bg-wine-50 text-wine-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'
      }`}
    >
      <svg className="h-4 w-4 shrink-0" aria-hidden="true">
        <use href={`/icons.svg#${isError ? 'icon-alert' : 'icon-check'}`} />
      </svg>
      {message.text}
    </div>
  )
}
