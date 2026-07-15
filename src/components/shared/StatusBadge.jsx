import { STATUS_STYLES } from '../../constants/rooms'

export default function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES['Limpia']

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      {status}
    </span>
  )
}
