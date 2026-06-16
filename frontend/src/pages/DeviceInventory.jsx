import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload, Search, Filter, Download, Wrench, HardDrive } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { mockDevices } from '../mock/data'

const statusVariant = { online: 'online', offline: 'offline', warning: 'warning' }

export default function DeviceInventory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = mockDevices.filter(d => {
    const matchSearch = d.hostname.toLowerCase().includes(search.toLowerCase()) || d.ip.includes(search)
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Device Inventory</h1>
          <p className="text-sm text-on-surface-variant mt-1">{mockDevices.length} devices registered</p>
        </div>
        <div className="flex gap-2">
          <Link to="/devices/onboard">
            <Button size="sm"><Plus size={16} /> Add Device</Button>
          </Link>
          <Button variant="secondary" size="sm"><Upload size={16} /> Import CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[20rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search by hostname, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="warning">Warning</option>
        </select>
        <Button variant="ghost" size="sm"><Download size={16} /> Export</Button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container">
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Hostname</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">IP Address</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Model</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">RouterOS</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Site</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Alerts</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(device => (
              <tr key={device.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/devices/${device.id}`} className="text-sm font-medium text-primary hover:underline">
                    {device.hostname}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-on-surface">{device.ip}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{device.model}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{device.routerOsVersion}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{device.site}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[device.status]}>{device.status}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-on-surface">{device.alerts}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link to={`/troubleshoot/${device.id}`} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                      <Wrench size={14} className="text-on-surface-variant" />
                    </Link>
                    <button className="p-1.5 rounded-lg hover:bg-surface-container-high">
                      <HardDrive size={14} className="text-on-surface-variant" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
