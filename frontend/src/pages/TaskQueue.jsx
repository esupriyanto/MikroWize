import { RotateCw, XCircle, ArrowUp, Download } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockTasks } from '../mock/data'
import { ListTodo, CheckCircle, AlertTriangle } from 'lucide-react'

const statusVariant = { completed: 'online', running: 'info', pending: 'warning', failed: 'offline' }

export default function TaskQueue() {
  const running = mockTasks.filter(t => t.status === 'running').length
  const completed = mockTasks.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Task Queue</h1>
        <p className="text-sm text-on-surface-variant mt-1">Monitor and manage background jobs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Running" value={running} icon={ListTodo} />
        <StatCard title="Pending" value={mockTasks.filter(t => t.status === 'pending').length} icon={AlertTriangle} />
        <StatCard title="Completed Today" value={completed} icon={CheckCircle} />
        <StatCard title="Failed" value={mockTasks.filter(t => t.status === 'failed').length} icon={AlertTriangle} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm"><RotateCw size={14} /> Retry All Failed</Button>
        <Button variant="ghost" size="sm"><Download size={14} /> Export Log</Button>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container">
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Job</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Device</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Started</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Duration</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Triggered By</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map(task => (
              <tr key={task.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-on-surface">{task.job}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{task.device}</td>
                <td className="px-4 py-3"><Badge variant={statusVariant[task.status]}>{task.status}</Badge></td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{task.started !== '—' ? new Date(task.started).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{task.duration}</td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{task.triggeredBy}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {task.status === 'failed' && <button className="p-1.5 rounded-lg hover:bg-surface-container-high"><RotateCw size={14} className="text-on-surface-variant" /></button>}
                    {task.status === 'pending' && <button className="p-1.5 rounded-lg hover:bg-surface-container-high"><XCircle size={14} className="text-error" /></button>}
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
