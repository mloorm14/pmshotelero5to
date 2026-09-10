export default function Breadcrumb({ module, roomNumber }) {
  return (
    <nav aria-label="Ubicación actual" className="mb-4 flex items-center gap-1.5 text-sm">
      <span className={roomNumber ? 'text-ink-500' : 'font-semibold text-ink-800'}>{module}</span>
      {roomNumber && (
        <>
          <span className="text-ink-300">/</span>
          <span className="font-semibold text-wine-700">Habitación {roomNumber}</span>
        </>
      )}
    </nav>
  )
}
