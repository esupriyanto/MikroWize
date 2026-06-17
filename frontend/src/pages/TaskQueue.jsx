import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RotateCw, XCircle, Download, Search, Filter, Clock, User, Bot, Calendar,
  ChevronDown, ChevronRight, X, AlertTriangle, CheckCircle, Loader2,
  ListTodo, List, Timer, Zap, ArrowUpDown, RefreshCw, Activity, Server,
  LayoutGrid, Table2, Play, Ban, Eye
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockTasks } from '../mock/data'

const statusVariant = { completed: 'online', running: 'info', pending: 'warning', failed: 'offline' }

const priorityConfig = {
  high: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30', label: 'High' },
  medium: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Medium' },
  low: { color: 'text-info', bg: 'bg-info/10', border: 'border-info/30', label: 'Low' },
}

const typeLabels = { backup: 'Backup', onboarding: 'Onboarding', template: 'Template', monitoring: 'Monitoring' }
const triggerIcons = { user: User, scheduler: Calendar, AI: Bot }

const logLevelColors = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
}

function ProgressBar({ progress, status }) {
  const isRunning = status === 'running'
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-on-surface-variant">{progress}%</span>
        {isRunning && <Loader2 size={12} className="text-info animate-spin" />}
      </div>
      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            status === 'failed' ? 'bg-error' : status === 'completed' ? 'bg-success' : 'bg-info'
          } ${isRunning ? 'animate-pulse' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const cfg = priorityConfig[priority] || priorityConfig.medium
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <Zap size={10} />
      {cfg.label}
    </span>
  )
}

function WorkerStatus() {
  const workers = [
    { name: 'celery@worker-01', status: 'online', tasks: 2, uptime: '3h 24m' },
    { name: 'celery@worker-02', status: 'online', tasks: 1, uptime: '3h 24m' },
    { name: 'celery@worker-03', status: 'online', tasks: 0, uptime: '1h 10m' },
    { name: 'celery@worker-04', status: 'offline', tasks: 0, uptime: '—' },
  ]
  const onlineCount = workers.filter(w => w.status === 'online').length
  const totalTasks = workers.reduce((s, w) => s + w.tasks, 0)

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-on-surface">Worker Status</h3>
        </div>
        <Badge variant="info">{totalTasks} active</Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-surface-container rounded-lg">
          <p className="text-lg font-bold text-success">{onlineCount}</p>
          <p className="text-xs text-on-surface-variant">Online</p>
        </div>
        <div className="text-center p-2 bg-surface-container rounded-lg">
          <p className="text-lg font-bold text-error">{workers.length - onlineCount}</p>
          <p className="text-xs text-on-surface-variant">Offline</p>
        </div>
        <div className="text-center p-2 bg-surface-container rounded-lg">
          <p className="text-lg font-bold text-info">{totalTasks}</p>
          <p className="text-xs text-on-surface-variant">In Progress</p>
        </div>
      </div>
      <div className="space-y-2">
        {workers.map(w => (
          <div key={w.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${w.status === 'online' ? 'bg-success' : 'bg-error'}`} />
              <span className="text-xs font-mono text-on-surface-variant">{w.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant">{w.tasks} tasks</span>
              <span className="text-xs text-on-surface-variant">{w.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CancelModal({ task, onConfirm, onCancel }) {
  if (!task) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
            <Ban size={20} className="text-error" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-on-surface">Cancel Task</h3>
            <p className="text-sm text-on-surface-variant">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-on-surface mb-6">
          Are you sure you want to cancel <span className="font-semibold">{task.job}</span>?
          {task.status === 'running' && ' The task will be stopped immediately.'}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Keep Running</Button>
          <Button variant="danger" size="sm" onClick={() => onConfirm(task.id)}>
            <XCircle size={14} /> Cancel Task
          </Button>
        </div>
      </div>
    </div>
  )
}

function RetryAllModal({ count, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
            <RotateCw size={20} className="text-warning" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-on-surface">Retry All Failed</h3>
            <p className="text-sm text-on-surface-variant">Re-queue all failed tasks</p>
          </div>
        </div>
        <p className="text-sm text-on-surface mb-6">
          This will retry <span className="font-semibold text-error">{count} failed task{count !== 1 ? 's' : ''}</span>. They will be added back to the queue.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" size="sm" onClick={onConfirm}>
            <RotateCw size={14} /> Retry {count} Tasks
          </Button>
        </div>
      </div>
    </div>
  )
}

function TaskDetailPanel({ task, onClose }) {
  if (!task) return null
  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container">
        <div className="flex items-center gap-3">
          <Eye size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-on-surface">Task Details</h3>
          <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
          <PriorityBadge priority={task.priority} />
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
          <X size={16} className="text-on-surface-variant" />
        </button>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Job</p>
            <p className="text-sm font-medium text-on-surface">{task.job}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Device</p>
            <p className="text-sm font-medium text-on-surface">{task.device}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Type</p>
            <p className="text-sm font-medium text-on-surface">{typeLabels[task.type] || task.type}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Triggered By</p>
            <p className="text-sm font-medium text-on-surface capitalize">{task.triggeredBy}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Started</p>
            <p className="text-sm font-medium text-on-surface">
              {task.started !== '—' ? new Date(task.started).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Duration</p>
            <p className="text-sm font-medium text-on-surface">{task.duration}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Progress</p>
            <div className="w-[200px]">
              <ProgressBar progress={task.progress} status={task.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-1">Task ID</p>
            <p className="text-sm font-mono text-on-surface-variant">{task.id}</p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Execution Log</h4>
          <div className="bg-black/30 rounded-lg p-4 max-h-[300px] overflow-y-auto font-mono text-xs space-y-1">
            {task.logs.length === 0 ? (
              <p className="text-on-surface-variant/50 italic">No logs available</p>
            ) : (
              task.logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-on-surface-variant/50 shrink-0">{log.time}</span>
                  <span className={`shrink-0 w-14 ${logLevelColors[log.level] || 'text-on-surface-variant'}`}>
                    [{log.level}]
                  </span>
                  <span className="text-on-surface">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineView({ tasks, onSelectTask, selectedId }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const aTime = a.started !== '—' ? new Date(a.started).getTime() : 0
    const bTime = b.started !== '—' ? new Date(b.started).getTime() : 0
    return bTime - aTime
  })

  return (
    <div className="space-y-3">
      {sortedTasks.map(task => {
        const TriggerIcon = triggerIcons[task.triggeredBy] || User
        const isSelected = selectedId === task.id
        return (
          <div
            key={task.id}
            onClick={() => onSelectTask(isSelected ? null : task)}
            className={`bg-surface-container-low rounded-xl border cursor-pointer transition-all ${
              isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant hover:border-outline'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-success/10' :
                    task.status === 'failed' ? 'bg-error/10' :
                    task.status === 'running' ? 'bg-info/10' :
                    'bg-warning/10'
                  }`}>
                    {task.status === 'completed' ? <CheckCircle size={18} className="text-success" /> :
                     task.status === 'failed' ? <AlertTriangle size={18} className="text-error" /> :
                     task.status === 'running' ? <Loader2 size={18} className="text-info animate-spin" /> :
                     <Clock size={18} className="text-warning" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">{task.job}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-on-surface-variant">{task.device}</span>
                      <span className="text-outline">·</span>
                      <span className="text-xs text-on-surface-variant">{typeLabels[task.type]}</span>
                      <span className="text-outline">·</span>
                      <TriggerIcon size={10} className="text-on-surface-variant" />
                      <span className="text-xs text-on-surface-variant capitalize">{task.triggeredBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
                </div>
              </div>
              <div className="ml-[52px]">
                <ProgressBar progress={task.progress} status={task.status} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-on-surface-variant">
                    {task.started !== '—' ? new Date(task.started).toLocaleString() : 'Not started'}
                  </span>
                  <span className="text-xs text-on-surface-variant">{task.duration}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function TaskQueue() {
  const [tasks, setTasks] = useState(mockTasks)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [view, setView] = useState('table')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [showRetryModal, setShowRetryModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const intervalRef = useRef(null)

  const running = tasks.filter(t => t.status === 'running').length
  const pending = tasks.filter(t => t.status === 'pending').length
  const completed = tasks.filter(t => t.status === 'completed').length
  const failed = tasks.filter(t => t.status === 'failed').length

  const filteredTasks = tasks.filter(t => {
    if (search) {
      const q = search.toLowerCase()
      if (!t.job.toLowerCase().includes(q) && !t.device.toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (triggerFilter !== 'all' && t.triggeredBy !== triggerFilter) return false
    return true
  })

  const handleCancel = useCallback((taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', duration: 'Cancelled' } : t))
    setCancelTarget(null)
    setSelectedTask(null)
  }, [])

  const handleRetryAll = useCallback(() => {
    setTasks(prev => prev.map(t => t.status === 'failed' ? { ...t, status: 'pending', progress: 0, started: '—', duration: '—', logs: [] } : t))
    setShowRetryModal(false)
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setTasks(prev => prev.map(t => {
      if (t.status === 'running' && t.progress < 100) {
        const newProgress = Math.min(t.progress + Math.floor(Math.random() * 8) + 2, 100)
        return { ...t, progress: newProgress }
      }
      return t
    }))
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(handleRefresh, 30000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, handleRefresh])

  const activeFilterCount = [statusFilter !== 'all', typeFilter !== 'all', triggerFilter !== 'all'].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Task Queue</h1>
          <p className="text-sm text-on-surface-variant mt-1">Monitor and manage background jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Running" value={running} icon={ListTodo} />
        <StatCard title="Pending" value={pending} icon={Clock} />
        <StatCard title="Completed" value={completed} icon={CheckCircle} />
        <StatCard title="Failed" value={failed} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by job name or device..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline'
              }`}
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-primary text-on-primary rounded-full text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
              <button
                onClick={() => setView('table')}
                className={`p-2 transition-colors ${view === 'table' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                title="Table view"
              >
                <Table2 size={16} />
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`p-2 transition-colors ${view === 'timeline' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                title="Timeline view"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowRetryModal(true)} disabled={failed === 0}>
              <RotateCw size={14} /> Retry All Failed ({failed})
            </Button>
            <Button variant="ghost" size="sm">
              <Download size={14} /> Export
            </Button>
          </div>

          {showFilters && (
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">All Statuses</option>
                    <option value="running">Running</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Type</label>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">All Types</option>
                    <option value="backup">Backup</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="template">Template</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Triggered By</label>
                  <select
                    value={triggerFilter}
                    onChange={e => setTriggerFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">All Sources</option>
                    <option value="user">User</option>
                    <option value="scheduler">Scheduler</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setTriggerFilter('all') }}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {selectedTask && (
            <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
          )}

          {view === 'table' ? (
            <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container">
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Job</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Device</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Started</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Triggered By</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                        No tasks match your filters
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => {
                      const TriggerIcon = triggerIcons[task.triggeredBy] || User
                      return (
                        <tr
                          key={task.id}
                          onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                          className={`border-b border-outline-variant last:border-0 cursor-pointer transition-colors ${
                            selectedTask?.id === task.id ? 'bg-primary/5' : 'hover:bg-surface-container'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-on-surface">{task.job}</td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">{task.device}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                              {typeLabels[task.type] || task.type}
                            </span>
                          </td>
                          <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                          <td className="px-4 py-3"><Badge variant={statusVariant[task.status]}>{task.status}</Badge></td>
                          <td className="px-4 py-3 w-[140px]"><ProgressBar progress={task.progress} status={task.status} /></td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant whitespace-nowrap">
                            {task.started !== '—' ? new Date(task.started).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">{task.duration}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <TriggerIcon size={12} className="text-on-surface-variant" />
                              <span className="text-sm text-on-surface-variant capitalize">{task.triggeredBy}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                              {task.status === 'failed' && (
                                <button className="p-1.5 rounded-lg hover:bg-surface-container-high" title="Retry">
                                  <RotateCw size={14} className="text-on-surface-variant" />
                                </button>
                              )}
                              {(task.status === 'running' || task.status === 'pending') && (
                                <button
                                  onClick={() => setCancelTarget(task)}
                                  className="p-1.5 rounded-lg hover:bg-surface-container-high"
                                  title="Cancel"
                                >
                                  <XCircle size={14} className="text-error" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                                className="p-1.5 rounded-lg hover:bg-surface-container-high"
                                title="View details"
                              >
                                <Eye size={14} className="text-on-surface-variant" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <TimelineView tasks={filteredTasks} onSelectTask={setSelectedTask} selectedId={selectedTask?.id} />
          )}

          <p className="text-xs text-on-surface-variant text-right">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>

        <div className="space-y-4">
          <WorkerStatus />

          <div className="bg-surface-container-low rounded-xl border border-outline-variant p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">Queue Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Total Tasks</span>
                <span className="text-sm font-semibold text-on-surface">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Running</span>
                <span className="text-sm font-semibold text-info">{running}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Pending</span>
                <span className="text-sm font-semibold text-warning">{pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Completed</span>
                <span className="text-sm font-semibold text-success">{completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">Failed</span>
                <span className="text-sm font-semibold text-error">{failed}</span>
              </div>
              <div className="border-t border-outline-variant pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Success Rate</span>
                  <span className="text-sm font-semibold text-on-surface">
                    {completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="border-t border-outline-variant pt-3">
                <p className="text-xs text-on-surface-variant mb-2">By Type</p>
                {Object.entries(typeLabels).map(([key, label]) => {
                  const count = tasks.filter(t => t.type === key).length
                  if (count === 0) return null
                  return (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-xs text-on-surface-variant">{label}</span>
                      <span className="text-xs font-medium text-on-surface">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CancelModal task={cancelTarget} onConfirm={handleCancel} onCancel={() => setCancelTarget(null)} />
      <RetryAllModal count={failed} onConfirm={handleRetryAll} onCancel={() => setShowRetryModal(false)} />
    </div>
  )
}
