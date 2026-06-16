import { HardDrive, Download, RotateCcw, Trash2, Filter } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockBackups } from '../mock/data'

const statusVariant = { success: 'online', failed: 'offline' }

export default function BackupManager() {
  const today = mockBackups.filter(b => b.time.startsWith('2026-06-16'))
  const successCount = today.filter(b => b.status === 'success').length
  const failCount = today.filter(b => b.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Backup Manager</h1>
          <p className="text-sm text-on-surface-variant mt-1">Centralized backup management for all devices</p>
        </div>
        <Button><HardDrive size={16} /> Backup Now</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Backups Today" value={today.length} icon={HardDrive} />
        <StatCard title="Successful" value={successCount} icon={HardDrive} trend="up" trendValue="100% success" />
        <StatCard title="Failed" value={failCount} icon={HardDrive} trend={failCount > 0 ? 'down' : 'neutral'} trendValue={failCount > 0 ? 'Needs attention' : 'None'} />
        <StatCard title="Total Storage" value="8.2 MB" icon={HardDrive} />
      </div>

      <div className="flex items-center gap-3">
        <select className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface">
          <option>All Devices</option>
          <option>mt-core-01</option>
          <option>mt-branch-02</option>
        </select>
        <select className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface">
          <option>All Formats</option>
          <option>Binary (.backup)</option>
          <option>Script (.rsc)</option>
        </select>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container">
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Device</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Time</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Format</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Size</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockBackups.map(backup => (
              <tr key={backup.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-on-surface">{backup.device}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{new Date(backup.time).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{backup.type}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{backup.format}</td>
                <td className="px-4 py-3 text-sm text-on-surface">{backup.size}</td>
                <td className="px-4 py-3"><Badge variant={statusVariant[backup.status]}>{backup.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-surface-container-high"><Download size={14} className="text-on-surface-variant" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-surface-container-high"><RotateCcw size={14} className="text-on-surface-variant" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-surface-container-high"><Trash2 size={14} className="text-error" /></button>
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
