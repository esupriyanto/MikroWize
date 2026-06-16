import { Server, Bell, HardDrive, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockDevices, mockAlerts } from '../mock/data'

const statusVariant = { online: 'online', offline: 'offline', warning: 'warning' }

export default function Dashboard() {
  const onlineCount = mockDevices.filter(d => d.status === 'online').length
  const offlineCount = mockDevices.filter(d => d.status === 'offline').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Fleet overview and quick actions</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Devices" value={mockDevices.length} icon={Server} trend="up" trendValue="+2 this week" />
        <StatCard title="Online" value={onlineCount} icon={Cpu} trend="up" trendValue="80% uptime" />
        <StatCard title="Active Alerts" value={mockAlerts.filter(a => a.status === 'open').length} icon={Bell} trend="down" trendValue="-3 from yesterday" />
        <StatCard title="Backups Today" value="5" icon={HardDrive} trend="neutral" trendValue="All scheduled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Devices */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Devices</CardTitle>
            <Link to="/devices">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {mockDevices.map(device => (
              <Link
                key={device.id}
                to={`/devices/${device.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-success' : device.status === 'offline' ? 'bg-error' : 'bg-warning'}`} />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{device.hostname}</p>
                    <p className="text-xs text-on-surface-variant">{device.ip} · {device.model}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[device.status]}>{device.status}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <Link to="/alerts">
              <Button variant="ghost" size="sm">Manage alerts</Button>
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {mockAlerts.filter(a => a.status === 'open').map(alert => (
              <div key={alert.id} className="p-3 rounded-lg hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={alert.severity === 'critical' ? 'offline' : alert.severity === 'warning' ? 'warning' : 'info'}>
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-on-surface-variant">{alert.device}</span>
                </div>
                <p className="text-sm text-on-surface">{alert.message}</p>
                <p className="text-xs text-outline mt-1">{new Date(alert.time).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
