export default function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
      {children}
      <span className="ml-0.5 text-red-400" aria-hidden="true">*</span>
    </label>
  )
}
