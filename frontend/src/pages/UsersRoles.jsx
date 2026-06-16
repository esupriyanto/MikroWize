import { Plus, UserPlus, Shield, Key } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const users = [
  { id: '1', name: 'Eko Supriyanto', email: 'esupriyanto828@gmail.com', role: 'Super Admin', site: 'All Sites', lastLogin: '2026-06-16 13:00', status: 'active' },
  { id: '2', name: 'NOC Operator', email: 'noc@mikrowize.io', role: 'NOC Engineer', site: 'DC Jakarta', lastLogin: '2026-06-16 08:30', status: 'active' },
  { id: '3', name: 'Field Tech', email: 'tech@mikrowize.io', role: 'Network Engineer', site: 'Branch Bandung', lastLogin: '2026-06-15 17:00', status: 'active' },
]

const roles = [
  { name: 'Super Admin', access: 'Full access all sites', users: 1 },
  { name: 'NOC Engineer', access: 'View + troubleshoot + execute', users: 1 },
  { name: 'Network Engineer', access: 'Full config + template push', users: 1 },
  { name: 'Read-Only', access: 'View monitoring & reports', users: 0 },
  { name: 'Customer', access: 'View own devices only', users: 0 },
]

export default function UsersRoles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Users & Roles</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage platform access and permissions</p>
        </div>
        <Button><UserPlus size={16} /> Invite User</Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Site</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-on-surface">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{user.email}</td>
                  <td className="px-4 py-3"><Badge variant="default">{user.role}</Badge></td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{user.site}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{user.lastLogin}</td>
                  <td className="px-4 py-3"><Badge variant="online">{user.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <Button variant="secondary" size="sm"><Shield size={14} /> Create Role</Button>
        </CardHeader>
        <div className="space-y-3">
          {roles.map(role => (
            <div key={role.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container">
              <div>
                <p className="text-sm font-medium text-on-surface">{role.name}</p>
                <p className="text-xs text-on-surface-variant">{role.access}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant">{role.users} users</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
