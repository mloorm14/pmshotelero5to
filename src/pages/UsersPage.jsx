import UserForm from '../components/users/UserForm'
import UserList from '../components/users/UserList'

export default function UsersPage({ users, onAddUser, onUpdateUser }) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <UserForm onAddUser={onAddUser} />
      <UserList users={users} onUpdateUser={onUpdateUser} />
    </div>
  )
}
