import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Cpu, HardDrive, Wifi, Activity, Clock, Edit, Wrench, Trash2,
  ArrowUpDown, Download, RotateCcw, CheckCircle, XCircle, AlertTriangle,
  Info, Monitor, Router, CircuitBoard, Shield, Key, Eye, EyeOff,
  ChevronDown, ChevronUp, Radio, Archive, FileText, Settings, Database,
  History, ArrowDown, ArrowUpRight, CircleDot
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { Select } from '../components/ui/Input'
import { mockDevices, mockInterfaces, mockAlerts, mockBackups, mockChangelog, mockDeviceMeta } from '../mock/data'

const tabs = ['Overview', 'Interfaces', 'Backup', 'Alerts', 'Changelog', 'Settings']
const statusVariant = { online: 'online', offline: 'offline', warning: 'warning' }

function formatTime(isoString) {
  if (!isoString || isoString === '—') return '—'
  const d = new Date(isoString)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(isoString) {
  if (!isoString) return '—'
  const now = new Date()
  const then = new Date(isoString)
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function GaugeBar({ value, label, unit = '%' }) {
  const color = value > 75 ? 'bg-error' : value > 50 ? 'bg-warning' : 'bg-primary'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-on-surface-variant">{label}</span>
        <span className="text-on-surface font-medium">{value}{unit}</span>
      </div>
      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-outline-variant/50 last:border-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface font-medium">{value}</span>
    </div>
  )
}

function PulseDot({ online }) {
  return (
    <span className="relative flex h-3 w-3">
      {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${online ? 'bg-success' : 'bg-error'}`} />
    </span>
  )
}

function DiffModal({ onClose }) {
  const diffLines = [
    { type: 'header', text: '@@ -12,7 +12,9 @@ /system ntp client' },
    { type: 'context', text: ' set enabled=yes' },
    { type: 'removed', text: ' set servers=216.239.35.0' },
    { type: 'added', text: ' set servers=10.0.0.2,10.0.0.3' },
    { type: 'context', text: '' },
    { type: 'header', text: '@@ -45,3 +45,5 @@ /ip dns' },
    { type: 'context', text: ' set allow-remote-requests=yes' },
    { type: 'removed', text: ' set servers=8.8.8.8' },
    { type: 'added', text: ' set servers=8.8.8.8,8.8.4.4' },
    { type: 'context', text: ' set cache-max-ttl=1w' },
  ]
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface-container-high rounded-xl border border-outline-variant w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h3 className="text-lg font-semibold text-on-surface">Configuration Diff</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><XCircle size={16} /></Button>
        </div>
        <div className="overflow-y-auto p-4 font-mono text-sm">
          {diffLines.map((line, i) => (
            <div key={i} className={`py-0.5 px-2 rounded ${
              line.type === 'removed' ? 'bg-error-container/50 text-on-error-container' :
              line.type === 'added' ? 'bg-success-container/50 text-on-success-container' :
              line.type === 'header' ? 'bg-surface-container text-primary font-medium my-1' :
              'text-on-surface-variant'
            }`}>
              {line.type === 'removed' ? '- ' : line.type === 'added' ? '+ ' : '  '}{line.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-outline-variant">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ deviceName, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-surface-container-high rounded-xl border border-outline-variant w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-error-container">
            <Trash2 size={20} className="text-error" />
          </div>
          <h3 className="text-lg font-semibold text-on-surface">Delete Device</h3>
        </div>
        <p className="text-on-surface-variant text-sm mb-4">
          This will permanently remove <strong className="text-on-surface">{deviceName}</strong> from MikroWize.
          All backup history and configuration data will be lost. This action cannot be undone.
        </p>
        <Input
          label={`Type "${deviceName}" to confirm`}
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={deviceName}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" disabled={confirmText !== deviceName} onClick={onConfirm}>
            Delete Forever
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DeviceDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const device = useMemo(() => mockDevices.find(d => d.id === id) || mockDevices[0], [id])
  const meta = mockDeviceMeta[device.id] || { serial: 'N/A', firmware: 'N/A', boardName: 'N/A', storage: 0, storageUsed: 'N/A', storageTotal: 'N/A' }

  // Interfaces tab state
  const [ifaceFilter, setIfaceFilter] = useState('all')
  const [expandedIface, setExpandedIface] = useState(null)
  const filteredInterfaces = useMemo(() => {
    if (ifaceFilter === 'all') return mockInterfaces
    return mockInterfaces.filter(i => i.type === ifaceFilter)
  }, [ifaceFilter])
  const maxTrafficBytes = useMemo(() => Math.max(...mockInterfaces.map(i => Math.max(i.txBytes, i.rxBytes)), 1), [])

  // Backup tab state
  const [showDiff, setShowDiff] = useState(false)
  const [backupSuccess, setBackupSuccess] = useState(null)
  const deviceBackups = useMemo(() => mockBackups.filter(b => b.device === device.hostname), [device.hostname])
  const handleBackupNow = () => {
    setBackupSuccess('queued')
    setTimeout(() => setBackupSuccess('success'), 2000)
  }

  // Alerts tab state
  const [alertFilter, setAlertFilter] = useState('all')
  const [alerts, setAlerts] = useState(mockAlerts)
  const deviceAlerts = useMemo(() => {
    let filtered = alerts.filter(a => a.device === device.hostname)
    if (alertFilter !== 'all') filtered = filtered.filter(a => a.status === alertFilter)
    return filtered
  }, [alerts, device.hostname, alertFilter])

  const handleAlertAction = (alertId, action) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: action === 'acknowledge' ? 'acknowledged' : 'resolved' } : a))
  }

  // Changelog tab state
  const [changelogExpanded, setChangelogExpanded] = useState(null)
  const deviceChangelog = useMemo(() => mockChangelog.filter(c => c.device === device.hostname), [device.hostname])

  const actionLabels = {
    config_push: 'Config Push',
    firmware_update: 'Firmware Update',
    interface_change: 'Interface Change',
    firewall_update: 'Firewall Update',
    backup: 'Backup',
  }
  const actionIcons = {
    config_push: <FileText size={16} />,
    firmware_update: <ArrowUpRight size={16} />,
    interface_change: <Wifi size={16} />,
    firewall_update: <Shield size={16} />,
    backup: <Archive size={16} />,
  }

  // Settings tab state
  const [settings, setSettings] = useState({
    hostname: device.hostname,
    site: device.site,
    tags: device.tags.join(', '),
    username: 'admin',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [password] = useState('••••••••••••')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSettingsSave = () => {
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  const isOnline = device.status === 'online'

  // Severity badge colors
  const severityVariant = { critical: 'offline', warning: 'warning', info: 'info' }

  return (
    <div className="space-y-6">
      {/* Diff Modal */}
      {showDiff && <DiffModal onClose={() => setShowDiff(false)} />}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          deviceName={device.hostname}
          onConfirm={() => setShowDeleteConfirm(false)}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/devices" className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-2">
            <ArrowLeft size={14} /> Back to Devices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-on-surface">{device.hostname}</h1>
            <Badge variant={statusVariant[device.status]}>{device.status}</Badge>
            <PulseDot online={isOnline} />
          </div>
          <p className="text-sm text-on-surface-variant mt-1">{device.ip} · {device.model} · RouterOS {device.routerOsVersion}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/troubleshoot/${device.id}`}>
            <Button variant="secondary" size="sm"><Wrench size={16} /> Troubleshoot</Button>
          </Link>
          <Button variant="secondary" size="sm"><Edit size={16} /> Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={16} /></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Resource Gauges */}
          <Card>
            <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
            <div className="space-y-4">
              <GaugeBar value={device.cpu} label="CPU" />
              <GaugeBar value={device.ram} label="RAM" />
              <GaugeBar value={meta.storage} label="Storage" />
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant text-xs text-on-surface-variant space-y-0.5">
              <div className="flex justify-between"><span>Storage Used</span><span className="text-on-surface">{meta.storageUsed} / {meta.storageTotal}</span></div>
            </div>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader><CardTitle>System</CardTitle></CardHeader>
            <div className="space-y-0">
              <InfoRow label="Uptime" value={device.uptime} />
              <InfoRow label="Site" value={device.site} />
              <InfoRow label="Board" value={meta.boardName} />
              <InfoRow label="Serial Number" value={meta.serial} />
              <InfoRow label="Firmware" value={meta.firmware} />
            </div>
          </Card>

          {/* Status & Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Status</CardTitle></CardHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PulseDot online={isOnline} />
                  <span className="text-sm text-on-surface">
                    {isOnline ? 'Online' : device.status === 'warning' ? 'Warning' : 'Offline'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-on-surface-variant">Last Seen: </span>
                  <span className="text-on-surface font-medium">{timeAgo(device.lastSeen)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-on-surface-variant">Last Backup: </span>
                  <span className="text-on-surface font-medium">{formatTime(device.lastBackup)}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-sm text-on-surface-variant mr-1">Tags:</span>
                  {device.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <div className="space-y-2">
                <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => { setActiveTab('Backup'); handleBackupNow(); }}>
                  <HardDrive size={16} /> Backup Now
                </Button>
                <Button variant="secondary" size="sm" className="w-full justify-start"><Wifi size={16} /> Ping Test</Button>
                <Button variant="secondary" size="sm" className="w-full justify-start"><Activity size={16} /> Live Metrics</Button>
                <Button variant="secondary" size="sm" className="w-full justify-start"><Clock size={16} /> View on Topology</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ===== INTERFACES TAB ===== */}
      {activeTab === 'Interfaces' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-on-surface-variant">Filter:</span>
            {['all', 'ethernet', 'sfp', 'bridge', 'wireless'].map(f => (
              <button
                key={f}
                onClick={() => setIfaceFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  ifaceFilter === f
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="text-xs text-on-surface-variant ml-auto">
              {filteredInterfaces.length} interface{filteredInterfaces.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
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
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredInterfaces.map(iface => (
                  <>
                    <tr
                      key={iface.name}
                      className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors cursor-pointer"
                      onClick={() => setExpandedIface(expandedIface === iface.name ? null : iface.name)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-on-surface">
                        <div className="flex items-center gap-2">
                          {iface.type === 'ethernet' ? <Monitor size={14} className="text-on-surface-variant" /> :
                           iface.type === 'sfp' ? <CircuitBoard size={14} className="text-on-surface-variant" /> :
                           iface.type === 'bridge' ? <Router size={14} className="text-on-surface-variant" /> :
                           <Wifi size={14} className="text-on-surface-variant" />}
                          {iface.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant capitalize">{iface.type}</td>
                      <td className="px-4 py-3">
                        <Badge variant={iface.status === 'up' ? 'online' : 'offline'}>{iface.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface font-mono text-xs">{iface.ip}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight size={12} className="text-success" />
                          <span>{iface.tx}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">
                        <div className="flex items-center gap-2">
                          <ArrowDown size={12} className="text-primary" />
                          <span>{iface.rx}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${iface.errors > 0 ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                        {iface.errors}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {expandedIface === iface.name ? <ChevronUp size={14} className="text-on-surface-variant" /> : <ChevronDown size={14} className="text-on-surface-variant" />}
                      </td>
                    </tr>
                    {expandedIface === iface.name && (
                      <tr key={`${iface.name}-detail`} className="border-b border-outline-variant bg-surface-container/50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-on-surface-variant mb-2">TX Traffic</p>
                              <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(iface.txBytes / maxTrafficBytes) * 100}%` }} />
                              </div>
                              <p className="text-xs text-on-surface-variant mt-1">{iface.tx} ({iface.txBytes.toLocaleString()} bytes/s)</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-on-surface-variant mb-2">RX Traffic</p>
                              <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(iface.rxBytes / maxTrafficBytes) * 100}%` }} />
                              </div>
                              <p className="text-xs text-on-surface-variant mt-1">{iface.rx} ({iface.rxBytes.toLocaleString()} bytes/s)</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== BACKUP TAB ===== */}
      {activeTab === 'Backup' && (
        <div className="space-y-4">
          {/* Backup Now */}
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-semibold text-on-surface">Manual Backup</h3>
                <p className="text-sm text-on-surface-variant mt-1">Create a full binary backup and .rsc export now.</p>
              </div>
              <div className="flex items-center gap-2">
                {backupSuccess === 'queued' && (
                  <span className="text-sm text-warning flex items-center gap-1"><Clock size={14} /> Queued...</span>
                )}
                {backupSuccess === 'success' && (
                  <span className="text-sm text-success flex items-center gap-1"><CheckCircle size={14} /> Backup complete!</span>
                )}
                <Button variant="primary" size="sm" onClick={handleBackupNow}>
                  <HardDrive size={16} /> Backup Now
                </Button>
              </div>
            </div>
          </Card>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <span className="text-xs text-on-surface-variant">{deviceBackups.length} backups</span>
            </CardHeader>
            {deviceBackups.length === 0 ? (
              <div className="text-center py-8">
                <Database size={40} className="text-outline mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">No backups found for this device.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Format</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Size</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceBackups.map(backup => (
                      <tr key={backup.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-on-surface">{formatTime(backup.time)}</td>
                        <td className="px-4 py-3 text-sm text-on-surface-variant capitalize">{backup.type}</td>
                        <td className="px-4 py-3 text-sm text-on-surface font-mono text-xs">{backup.format}</td>
                        <td className="px-4 py-3 text-sm text-on-surface">{backup.size}</td>
                        <td className="px-4 py-3">
                          <Badge variant={backup.status === 'success' ? 'online' : 'offline'}>{backup.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" title="Download">
                              <Download size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" title="Restore">
                              <RotateCcw size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" title="View Diff" onClick={() => setShowDiff(true)}>
                              <FileText size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===== ALERTS TAB ===== */}
      {activeTab === 'Alerts' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-on-surface-variant">Status:</span>
            {['all', 'open', 'acknowledged', 'resolved'].map(f => (
              <button
                key={f}
                onClick={() => setAlertFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  alertFilter === f
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="text-xs text-on-surface-variant ml-auto">
              {deviceAlerts.length} alert{deviceAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Alerts List */}
          {deviceAlerts.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <CheckCircle size={40} className="text-success mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">No alerts for this device.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {deviceAlerts.map(alert => (
                <Card key={alert.id} className="hover:bg-surface-container/80 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {alert.severity === 'critical' ? <XCircle size={18} className="text-error" /> :
                         alert.severity === 'warning' ? <AlertTriangle size={18} className="text-warning" /> :
                         <Info size={18} className="text-info" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                          <span className="text-xs text-on-surface-variant">{timeAgo(alert.time)}</span>
                          {alert.status !== 'open' && (
                            <Badge variant={alert.status === 'acknowledged' ? 'warning' : 'online'}>{alert.status}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-on-surface mt-1">{alert.message}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{formatTime(alert.time)}</p>
                      </div>
                    </div>
                    {alert.status === 'open' && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="secondary" size="sm" onClick={() => handleAlertAction(alert.id, 'acknowledge')}>
                          <CheckCircle size={14} /> Ack
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAlertAction(alert.id, 'resolve')}>
                          Resolve
                        </Button>
                      </div>
                    )}
                    {alert.status === 'acknowledged' && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleAlertAction(alert.id, 'resolve')}>
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== CHANGELOG TAB ===== */}
      {activeTab === 'Changelog' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Changelog</CardTitle>
              <span className="text-xs text-on-surface-variant">{deviceChangelog.length} entries</span>
            </CardHeader>
            {deviceChangelog.length === 0 ? (
              <div className="text-center py-8">
                <History size={40} className="text-outline mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">No changelog entries for this device.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-outline-variant" />

                <div className="space-y-0">
                  {deviceChangelog.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="relative pl-12 pb-6 last:pb-0 cursor-pointer group"
                      onClick={() => setChangelogExpanded(changelogExpanded === entry.id ? null : entry.id)}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-surface-container-high border-2 border-primary flex items-center justify-center">
                        <CircleDot size={8} className="text-primary" />
                      </div>

                      <div className="bg-surface-container rounded-lg p-3 group-hover:bg-surface-container-high transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-on-surface-variant">{actionIcons[entry.action]}</span>
                            <span className="text-xs font-medium text-primary">{actionLabels[entry.action] || entry.action}</span>
                            <span className="text-xs text-on-surface-variant">by {entry.user}</span>
                          </div>
                          <span className="text-xs text-on-surface-variant whitespace-nowrap">{timeAgo(entry.time)}</span>
                        </div>
                        <p className="text-sm text-on-surface mt-1">{entry.summary}</p>
                        {changelogExpanded === entry.id && (
                          <div className="mt-3 pt-3 border-t border-outline-variant">
                            <p className="text-xs text-on-surface-variant">{entry.details}</p>
                            <p className="text-xs text-on-surface-variant mt-2 font-mono">{formatTime(entry.time)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'Settings' && (
        <div className="space-y-4 max-w-2xl">
          {/* Device Settings */}
          <Card>
            <CardHeader><CardTitle>Device Settings</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input
                label="Hostname"
                value={settings.hostname}
                onChange={e => setSettings(s => ({ ...s, hostname: e.target.value }))}
              />
              <Input
                label="Site"
                value={settings.site}
                onChange={e => setSettings(s => ({ ...s, site: e.target.value }))}
              />
              <Input
                label="Tags (comma-separated)"
                value={settings.tags}
                onChange={e => setSettings(s => ({ ...s, tags: e.target.value }))}
                placeholder="e.g. core, production"
              />
              <div className="flex items-center gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={handleSettingsSave}>
                  <CheckCircle size={16} /> Save Changes
                </Button>
                {settingsSaved && (
                  <span className="text-sm text-success flex items-center gap-1">
                    <CheckCircle size={14} /> Saved!
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Credentials */}
          <Card>
            <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
            <div className="space-y-4">
              <Input
                label="Username"
                value={settings.username}
                onChange={e => setSettings(s => ({ ...s, username: e.target.value }))}
              />
              <div className="space-y-2">
                <label className="block text-base font-medium text-on-surface">Password</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-base text-on-surface font-mono flex items-center">
                    {showPassword ? 'SuperSecretP@ss123' : password}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="h-12 px-3">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                  <Button variant="secondary" size="sm" className="h-12">
                    <Key size={16} /> Rotate
                  </Button>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleSettingsSave}>
                  <CheckCircle size={16} /> Update Credentials
                </Button>
              </div>
            </div>
          </Card>

          {/* Connection */}
          <Card>
            <CardHeader><CardTitle>Connection</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              <InfoRow label="IP Address" value={device.ip} />
              <InfoRow label="API Port" value="8728" />
              <InfoRow label="API-SSL Port" value="8729" />
              <InfoRow label="Winbox Port" value="8291" />
              <InfoRow label="SSH Port" value="22" />
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-error/50">
            <CardHeader>
              <CardTitle className="text-error">Danger Zone</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium text-on-surface">Remove this device</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Permanently delete this device and all associated data.
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={16} /> Delete Device
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
