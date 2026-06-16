import { Bell, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockAlerts } from '../mock/data'

const severityVariant = { critical: 'offline', warning: 'warning', info: 'info' }

export default function Alerts() {
  const open = mockAlerts.filter(a => a.status === 'open')
  const critical = mockAlerts.filter(a => a.severity === 'critical')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Alerts</h1>
        <p className="text-sm text-on-surface-variant mt-1">Monitor and manage fleet alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Open Alerts" value={open.length} icon={Bell} />
        <StatCard title="Critical" value={critical.length} icon={AlertTriangle} />
        <StatCard title="Acknowledged" value={mockAlerts.filter(a => a.status === 'acknowledged').length} icon={Clock} />
        <StatCard title="Resolved Today" value={0} icon={CheckCircle} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm"><CheckCircle size={14} /> Bulk Resolve</Button>
      </div>

      <div className="space-y-3">
        {mockAlerts.map(alert => (
          <div key={alert.id} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                <div>
                  <p className="text-sm font-medium text-on-surface">{alert.message}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Device: {alert.device} · {new Date(alert.time).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={alert.status === 'open' ? 'warning' : 'default'}>{alert.status}</Badge>
                {alert.status === 'open' && <Button variant="ghost" size="sm">Acknowledge</Button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
