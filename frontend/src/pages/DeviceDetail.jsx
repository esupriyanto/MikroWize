import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Cpu, HardDrive, Wifi, Activity, Clock, Edit, Wrench, Trash2 } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockDevices, mockInterfaces } from '../mock/data'

const tabs = ['Overview', 'Interfaces', 'Backup', 'Alerts', 'Changelog', 'Settings']
const statusVariant = { online: 'online', offline: 'offline', warning: 'warning' }

export default function DeviceDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const device = mockDevices.find(d => d.id === id) || mockDevices[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/devices" className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-2">
            <ArrowLeft size={14} /> Back to Devices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-on-surface">{device.hostname}</h1>
            <Badge variant={statusVariant[device.status]}>{device.status}</Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">{device.ip} · {device.model} · RouterOS {device.routerOsVersion}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/troubleshoot/${device.id}`}>
            <Button variant="secondary" size="sm"><Wrench size={16} /> Troubleshoot</Button>
          </Link>
          <Button variant="secondary" size="sm"><Edit size={16} /> Edit</Button>
          <Button variant="danger" size="sm"><Trash2 size={16} /></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Resource Gauges */}
          <Card>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant">CPU</span>
                  <span className="text-on-surface font-medium">{device.cpu}%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${device.cpu > 75 ? 'bg-error' : device.cpu > 50 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${device.cpu}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant">RAM</span>
                  <span className="text-on-surface font-medium">{device.ram}%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${device.ram > 75 ? 'bg-error' : device.ram > 50 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${device.ram}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader><CardTitle>System</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Uptime</span><span className="text-on-surface">{device.uptime}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Site</span><span className="text-on-surface">{device.site}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Last Backup</span><span className="text-on-surface">{new Date(device.lastBackup).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Tags</span>
                <div className="flex gap-1">{device.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}</div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start"><HardDrive size={16} /> Backup Now</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start"><Wifi size={16} /> Ping Test</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start"><Activity size={16} /> Live Metrics</Button>
              <Button variant="secondary" size="sm" className="w-full justify-start"><Clock size={16} /> View on Topology</Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Interfaces' && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">IP</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">TX</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">RX</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Errors</th>
              </tr>
            </thead>
            <tbody>
              {mockInterfaces.map(iface => (
                <tr key={iface.name} className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-on-surface">{iface.name}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{iface.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={iface.status === 'up' ? 'online' : 'offline'}>{iface.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface">{iface.ip}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">{iface.tx}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">{iface.rx}</td>
                  <td className={`px-4 py-3 text-sm text-right ${iface.errors > 0 ? 'text-error font-medium' : 'text-on-surface-variant'}`}>{iface.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab !== 'Overview' && activeTab !== 'Interfaces' && (
        <Card>
          <div className="text-center py-12">
            <Cpu size={48} className="text-outline mx-auto mb-4" />
            <p className="text-on-surface-variant">{activeTab} panel — coming soon</p>
          </div>
        </Card>
      )}
    </div>
  )
}
