import { useState, useMemo, useCallback } from 'react'
import { HardDrive, Download, RotateCcw, Trash2, Filter, Calendar, ChevronDown, ChevronUp, Settings, GitCompare, Clock, Shield, FileText, X, Check, AlertTriangle } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockBackups, mockDevices } from '../mock/data'

const statusVariant = { success: 'online', failed: 'offline' }

const sortKeys = {
  device: (b) => b.device,
  time: (b) => new Date(b.time).getTime(),
  type: (b) => b.type,
  format: (b) => b.format,
  size: (b) => parseSizeToBytes(b.size),
  status: (b) => b.status,
}

function parseSizeToBytes(size) {
  const match = size.match(/^([\d.]+)\s*(KB|MB|GB)$/i)
  if (!match) return 0
  const num = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'KB') return num * 1024
  if (unit === 'MB') return num * 1024 * 1024
  if (unit === 'GB') return num * 1024 * 1024 * 1024
  return 0
}

const mockDiffLines = [
  { type: 'header', text: '@@ -1,7 +1,7 @@ /ip firewall filter' },
  { type: 'context', text: ' add action=accept chain=forward comment="Allow established"' },
  { type: 'context', text: ' add action=accept chain=forward comment="Allow related"' },
  { type: 'removed', text: ' add action=drop chain=forward comment="Block SSDP" dst-port=1900 protocol=udp' },
  { type: 'added', text: ' add action=drop chain=forward comment="Block SSDP/UPnP" dst-port=1900 protocol=udp' },
  { type: 'added', text: ' add action=drop chain=forward comment="Block mDNS" dst-port=5353 protocol=udp' },
  { type: 'context', text: ' add action=accept chain=input comment="Allow SSH" dst-port=22 protocol=tcp' },
  { type: 'context', text: ' add action=drop chain=input comment="Drop all other input"' },
  { type: 'header', text: '@@ -15,3 +15,4 @@ /system ntp client' },
  { type: 'context', text: ' set enabled=yes' },
  { type: 'removed', text: ' set primary-ntp=216.239.35.0' },
  { type: 'added', text: ' set primary-ntp=10.0.0.2' },
  { type: 'added', text: ' set secondary-ntp=10.0.0.3' },
]

const storageByDevice = [
  { device: 'mt-core-01', size: 2.4, color: 'bg-primary' },
  { device: 'mt-branch-02', size: 1.1, color: 'bg-success' },
  { device: 'mt-sw-floor3', size: 0.89, color: 'bg-warning' },
  { device: 'mt-pppoe-con', size: 3.5, color: 'bg-error' },
  { device: 'mt-ap-lobby', size: 0.31, color: 'bg-info' },
]

const defaultSchedule = {
  frequency: 'daily',
  time: '02:00',
  retentionDays: 30,
}

const defaultPolicies = [
  { id: '1', name: 'Core Devices', devices: ['mt-core-01'], frequency: 'daily', time: '02:00', retentionDays: 60, format: 'both' },
  { id: '2', name: 'Branch Devices', devices: ['mt-branch-02', 'mt-pppoe-con'], frequency: 'daily', time: '02:00', retentionDays: 30, format: 'binary' },
  { id: '3', name: 'AP & Switch', devices: ['mt-ap-lobby', 'mt-sw-floor3'], frequency: 'weekly', time: '03:00', retentionDays: 14, format: 'rsc' },
]

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl ${wide ? 'w-full max-w-[56rem]' : 'w-full max-w-[32rem]'} max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function BackupManager() {
  const [sortCol, setSortCol] = useState('time')
  const [sortDir, setSortDir] = useState('desc')
  const [expandedRow, setExpandedRow] = useState(null)
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [showDiff, setShowDiff] = useState(false)
  const [diffBackup, setDiffBackup] = useState(null)

  const [showRestore, setShowRestore] = useState(false)
  const [restoreBackup, setRestoreBackup] = useState(null)
  const [autoRollback, setAutoRollback] = useState(true)
  const [rollbackMinutes, setRollbackMinutes] = useState(5)
  const [restoreConfirming, setRestoreConfirming] = useState(false)

  const [showSchedule, setShowSchedule] = useState(false)
  const [schedule, setSchedule] = useState(defaultSchedule)

  const [showPolicies, setShowPolicies] = useState(false)
  const [policies, setPolicies] = useState(defaultPolicies)

  const handleSort = useCallback((col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }, [sortCol])

  const filteredBackups = useMemo(() => {
    let result = [...mockBackups]
    if (deviceFilter !== 'all') {
      result = result.filter(b => b.device === deviceFilter)
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      result = result.filter(b => new Date(b.time).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime()
      result = result.filter(b => new Date(b.time).getTime() <= to)
    }
    result.sort((a, b) => {
      const fn = sortKeys[sortCol] || sortKeys.time
      const va = fn(a)
      const vb = fn(b)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [deviceFilter, dateFrom, dateTo, sortCol, sortDir])

  const today = mockBackups.filter(b => b.time.startsWith('2026-06-16'))
  const successCount = today.filter(b => b.status === 'success').length
  const failCount = today.filter(b => b.status === 'failed').length
  const totalStorageMB = storageByDevice.reduce((s, d) => s + d.size, 0)
  const maxStorage = 10

  const handleExportCSV = useCallback(() => {
    const headers = ['Device', 'Time', 'Type', 'Format', 'Size', 'Status']
    const rows = filteredBackups.map(b => [
      b.device,
      new Date(b.time).toLocaleString(),
      b.type,
      b.format,
      b.size,
      b.status,
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredBackups])

  const handleRestore = useCallback(() => {
    setRestoreConfirming(true)
    setTimeout(() => {
      setRestoreConfirming(false)
      setShowRestore(false)
      setRestoreBackup(null)
    }, 1500)
  }, [])

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronDown size={12} className="text-outline opacity-40" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />
  }

  const diffLineColor = (type) => {
    switch (type) {
      case 'added': return 'bg-success-container/40 text-success'
      case 'removed': return 'bg-error-container/40 text-error'
      case 'header': return 'bg-surface-container text-on-surface-variant font-medium'
      default: return 'text-on-surface-variant'
    }
  }

  const diffPrefix = (type) => {
    switch (type) {
      case 'added': return '+'
      case 'removed': return '-'
      default: return ' '
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Backup Manager</h1>
          <p className="text-sm text-on-surface-variant mt-1">Centralized backup management for all devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setShowSchedule(true)}>
            <Settings size={16} /> Schedule
          </Button>
          <Button variant="secondary" size="md" onClick={() => setShowPolicies(true)}>
            <Shield size={16} /> Policies
          </Button>
          <Button size="md"><HardDrive size={16} /> Backup Now</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Backups Today" value={today.length} icon={HardDrive} />
        <StatCard title="Successful" value={successCount} icon={HardDrive} trend="up" trendValue="100% success" />
        <StatCard title="Failed" value={failCount} icon={HardDrive} trend={failCount > 0 ? 'down' : 'neutral'} trendValue={failCount > 0 ? 'Needs attention' : 'None'} />
        <StatCard title="Total Storage" value={`${totalStorageMB.toFixed(1)} MB`} icon={HardDrive} />
      </div>

      {/* Storage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage by Device</CardTitle>
          <span className="text-xs text-on-surface-variant">{totalStorageMB.toFixed(1)} MB / {maxStorage} MB</span>
        </CardHeader>
        <div className="space-y-3">
          {/* Total bar */}
          <div className="w-full h-4 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalStorageMB / maxStorage) * 100, 100)}%` }}
            />
          </div>
          {/* Per-device bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {storageByDevice.map(d => (
              <div key={d.device} className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant w-28 shrink-0 truncate">{d.device}</span>
                <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full ${d.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(d.size / maxStorage) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-on-surface-variant w-14 text-right">{d.size} MB</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-on-surface-variant" />
          <select
            value={deviceFilter}
            onChange={e => setDeviceFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
          >
            <option value="all">All Devices</option>
            {mockDevices.map(d => (
              <option key={d.hostname} value={d.hostname}>{d.hostname}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-on-surface-variant" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
            placeholder="From"
          />
          <span className="text-on-surface-variant text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
            placeholder="To"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={handleExportCSV}>
            <FileText size={14} /> Export Log
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container">
              {[
                { key: 'device', label: 'Device' },
                { key: 'time', label: 'Time' },
                { key: 'type', label: 'Type' },
                { key: 'format', label: 'Format' },
                { key: 'size', label: 'Size' },
                { key: 'status', label: 'Status' },
              ].map(col => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBackups.map(backup => (
              <>
                <tr
                  key={backup.id}
                  className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === backup.id ? null : backup.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-on-surface">{backup.device}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{new Date(backup.time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{backup.type}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{backup.format}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">{backup.size}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[backup.status]}>{backup.status}</Badge></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-surface-container-high" title="Download">
                        <Download size={14} className="text-on-surface-variant" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-surface-container-high"
                        title="View Diff"
                        onClick={() => { setDiffBackup(backup); setShowDiff(true) }}
                      >
                        <GitCompare size={14} className="text-on-surface-variant" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-surface-container-high"
                        title="Restore"
                        onClick={() => { setRestoreBackup(backup); setShowRestore(true) }}
                      >
                        <RotateCcw size={14} className="text-on-surface-variant" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-surface-container-high" title="Delete">
                        <Trash2 size={14} className="text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === backup.id && (
                  <tr key={`${backup.id}-detail`} className="border-b border-outline-variant bg-surface-container-lowest">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-on-surface-variant text-xs">Backup ID</span>
                          <p className="text-on-surface font-mono">#{backup.id}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Device</span>
                          <p className="text-on-surface">{backup.device}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Created</span>
                          <p className="text-on-surface">{new Date(backup.time).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Format</span>
                          <p className="text-on-surface">{backup.format}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Size</span>
                          <p className="text-on-surface">{backup.size}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Type</span>
                          <p className="text-on-surface">{backup.type}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Status</span>
                          <p><Badge variant={statusVariant[backup.status]}>{backup.status}</Badge></p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant text-xs">Checksum</span>
                          <p className="text-on-surface font-mono text-xs">sha256:a3f2...8b1c</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filteredBackups.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                  No backups match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Config Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Backup Schedule Configuration">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Frequency</label>
            <div className="flex gap-3">
              {['daily', 'weekly'].map(f => (
                <button
                  key={f}
                  onClick={() => setSchedule(s => ({ ...s, frequency: f }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    schedule.frequency === f
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Time</label>
            <input
              type="time"
              value={schedule.time}
              onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))}
              className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Retention (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={schedule.retentionDays}
              onChange={e => setSchedule(s => ({ ...s, retentionDays: parseInt(e.target.value) || 30 }))}
              className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface w-40"
            />
            <p className="text-xs text-on-surface-variant mt-1">Backups older than this will be automatically purged. Default: 30 days.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button size="md" onClick={() => setShowSchedule(false)}>Save Schedule</Button>
          </div>
        </div>
      </Modal>

      {/* Diff Viewer Modal */}
      <Modal open={showDiff} onClose={() => { setShowDiff(false); setDiffBackup(null) }} title={`Config Diff — ${diffBackup?.device || ''}`} wide>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span>Comparing <strong className="text-on-surface">{diffBackup?.device}</strong></span>
            <span>•</span>
            <span>{diffBackup?.time ? new Date(diffBackup.time).toLocaleString() : ''}</span>
            <span>•</span>
            <span>{diffBackup?.size}</span>
          </div>
          <div className="bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
            <div className="px-4 py-2 bg-surface-container-high border-b border-outline-variant text-xs font-medium text-on-surface-variant">
              unified diff — {diffBackup?.device} — firewall & ntp changes
            </div>
            <div className="overflow-x-auto font-mono text-xs leading-6">
              {mockDiffLines.map((line, i) => (
                <div key={i} className={`px-4 ${diffLineColor(line.type)}`}>
                  <span className="select-none opacity-50 w-6 inline-block text-right mr-3">{diffPrefix(line.type)}</span>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success-container inline-block" /> Added (2)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-error-container inline-block" /> Removed (2)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-surface-container inline-block" /> Context (5)</span>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal open={showRestore} onClose={() => { setShowRestore(false); setRestoreBackup(null); setRestoreConfirming(false) }} title="Restore Backup">
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-warning-container/30 rounded-lg border border-warning/20">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-on-surface">You are about to restore a backup</p>
              <p className="text-on-surface-variant mt-1">
                Device: <strong className="text-on-surface">{restoreBackup?.device}</strong><br />
                Backup from: <strong className="text-on-surface">{restoreBackup?.time ? new Date(restoreBackup.time).toLocaleString() : ''}</strong><br />
                Size: <strong className="text-on-surface">{restoreBackup?.size}</strong>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRollback(!autoRollback)}
                className={`w-10 h-6 rounded-full transition-colors relative ${autoRollback ? 'bg-primary' : 'bg-surface-container-high'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoRollback ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-on-surface">Auto-rollback if unreachable</p>
                <p className="text-xs text-on-surface-variant">Automatically revert if device becomes unreachable after restore</p>
              </div>
            </div>
            {autoRollback && (
              <div className="ml-13 pl-13">
                <label className="block text-sm text-on-surface-variant mb-1">Timeout (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={rollbackMinutes}
                  onChange={e => setRollbackMinutes(parseInt(e.target.value) || 5)}
                  className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface w-24"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => { setShowRestore(false); setRestoreBackup(null) }}>Cancel</Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleRestore}
              disabled={restoreConfirming}
            >
              {restoreConfirming ? (
                <><Clock size={16} className="animate-spin" /> Restoring...</>
              ) : (
                <><RotateCcw size={16} /> Confirm Restore</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Policies Modal */}
      <Modal open={showPolicies} onClose={() => setShowPolicies(false)} title="Backup Policies" wide>
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Configure backup policies per device group. Each policy defines frequency, retention, and format.</p>
          {policies.map(policy => (
            <Card key={policy.id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-on-surface">{policy.name}</h4>
                  <Badge>{policy.devices.length} device{policy.devices.length > 1 ? 's' : ''}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {policy.devices.map(d => (
                    <span key={d} className="px-2 py-0.5 bg-surface-container rounded text-xs text-on-surface-variant font-mono">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-on-surface-variant text-xs">Frequency</span>
                    <p className="text-on-surface capitalize">{policy.frequency}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-xs">Time</span>
                    <p className="text-on-surface font-mono">{policy.time}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-xs">Retention</span>
                    <p className="text-on-surface">{policy.retentionDays} days</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-xs">Format</span>
                    <p className="text-on-surface capitalize">{policy.format}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <div className="flex justify-end pt-2">
            <Button size="md" onClick={() => setShowPolicies(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
