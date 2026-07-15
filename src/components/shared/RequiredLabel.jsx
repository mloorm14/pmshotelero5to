export default function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>
    </label>
  )
}
