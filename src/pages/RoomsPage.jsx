import RoomForm from '../components/rooms/RoomForm'
import RoomList from '../components/rooms/RoomList'

export default function RoomsPage({ rooms, reservations, onAddRoom, onUpdateRoom, onDeleteRoom }) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <RoomForm rooms={rooms} onAddRoom={onAddRoom} />
      <RoomList rooms={rooms} reservations={reservations} onUpdateRoom={onUpdateRoom} onDeleteRoom={onDeleteRoom} />
    </div>
  )
}
