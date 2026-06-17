import { useState, useEffect, useRef } from 'react'
import { Server, Bell, HardDrive, Cpu, Play, Clock, XCircle, CheckCircle2, Loader2, AlertTriangle, Info, Send, Sparkles, Settings, Activity, ChevronRight, Bot, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockDevices, mockAlerts, mockTasks } from '../mock/data'

const statusVariant = { online: 'online', offline: 'offline', warning: 'warning' }

/* ── Animated Counter hook ── */
function useAnimatedValue(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = value
    startRef.current = null
    let raf
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}

/* ── Animated Stat Card wrapper ── */
function AnimatedStatCard({ value, ...props }) {
  const animated = useAnimatedValue(value)
  return <StatCard value={animated} {...props} />
}

/* ── Mini SVG sparkline ── */
function MiniSparkline({ data, color = '#6750A4', height = 40 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── Mock chart data for Grafana placeholder ── */
const chartData = {
  cpu: [12, 15, 14, 18, 22, 19, 25, 28, 24, 30, 27, 32],
  traffic: [45, 52, 48, 60, 55, 70, 65, 80, 75, 85, 90, 88],
}

/* ── Task status config ── */
const taskStatusConfig = {
  running: { icon: Loader2, color: 'text-info', bg: 'bg-info-container', label: 'Running', animate: true },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning-container', label: 'Pending', animate: false },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success-container', label: 'Completed', animate: false },
  failed: { icon: XCircle, color: 'text-error', bg: 'bg-error-container', label: 'Failed', animate: false },
}

/* ── Hermes AI Widget ── */
function HermesWidget() {
  const [input, setInput] = useState('')
  const [chatMode, setChatMode] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  const suggestions = [
    'Why is mt-ap-lobby offline?',
    'Show me BGP status',
    'Backup all devices now',
  ]

  const handleSend = (text) => {
    const q = text || input
    if (!q.trim()) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setIsTyping(true)
    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false)
      const responses = {
        'why is mt-ap-lobby offline?': 'mt-ap-lobby (10.0.2.10) went offline at 2026-06-15 18:30. The last backup also failed — the device is unreachable via SSH. I recommend checking the physical connection or PoE switch port.',
        'show me bgp status': 'BGP session on mt-core-01 flapped at 11:30 today. Current state: Established with 2 peers (10.0.0.2, 10.0.0.3). Routes received: 142. No active issues.',
        'backup all devices now': 'I\'ve queued backup jobs for all 4 online devices. mt-ap-lobby is offline and will be skipped. You can monitor progress in the Task Queue.',
      }
      const key = q.toLowerCase()
      const reply = responses[key] || `I understand you're asking about "${q}". Let me analyze your network data and get back to you. This is a demo response — connect Hermes AI for real insights.`
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    }, 1200)
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot size={18} className="text-primary" />
          </div>
          <CardTitle className="mb-0">Hermes AI</CardTitle>
        </div>
        <button
          onClick={() => setChatMode(!chatMode)}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${chatMode ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
        >
          {chatMode ? 'Chat Mode' : 'Quick Ask'}
        </button>
      </CardHeader>

      <div className="flex-1 flex flex-col">
        {chatMode && messages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-sm px-3 py-2 rounded-xl ${m.role === 'user' ? 'bg-primary text-on-primary rounded-br-sm' : 'bg-surface-container-high text-on-surface rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-container-high text-on-surface-variant text-sm px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!chatMode && (
          <div className="space-y-2 mb-4">
            <p className="text-sm text-on-surface-variant">Suggested questions:</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 group"
              >
                <Sparkles size={14} className="text-primary shrink-0" />
                <span className="flex-1">{s}</span>
                <ChevronRight size={14} className="text-outline group-hover:text-on-surface-variant transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Hermes about your network..."
              className="flex-1 text-sm bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
            <Button size="sm" onClick={() => handleSend()} className="shrink-0">
              <Send size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ── Live Activity Feed ── */
function LiveActivityFeed() {
  // Combine alerts and tasks into a single chronological feed
  const feedItems = [
    ...mockAlerts.map(a => ({
      id: `alert-${a.id}`,
      type: 'alert',
      severity: a.severity,
      title: a.message,
      device: a.device,
      time: a.time,
      status: a.status,
    })),
    ...mockTasks.map(t => ({
      id: `task-${t.id}`,
      type: 'task',
      taskStatus: t.status,
      title: t.job,
      device: t.device,
      time: t.started !== '—' ? t.started : t.completedAt,
      progress: t.progress,
    })),
  ]
    .filter(item => item.time && item.time !== '—')
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 12)

  const getIcon = (item) => {
    if (item.type === 'alert') {
      if (item.severity === 'critical') return { Icon: XCircle, color: 'text-error' }
      if (item.severity === 'warning') return { Icon: AlertTriangle, color: 'text-warning' }
      return { Icon: Info, color: 'text-info' }
    }
    const cfg = taskStatusConfig[item.taskStatus]
    return { Icon: cfg.icon, color: cfg.color, animate: cfg.animate }
  }

  const formatTime = (t) => {
    const d = new Date(t)
    const now = new Date()
    const diffMs = now - d
    if (diffMs < 0) return d.toLocaleTimeString()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          <CardTitle className="mb-0">Live Activity</CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-on-surface-variant">Live</span>
        </div>
      </CardHeader>
      <div className="space-y-1 max-h-[420px] overflow-y-auto">
        {feedItems.map((item, idx) => {
          const { Icon, color, animate } = getIcon(item)
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors group"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={14} className={`${color} ${animate ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-on-surface-variant">{item.device}</span>
                  <span className="text-xs text-outline">·</span>
                  <span className="text-xs text-outline">{formatTime(item.time)}</span>
                </div>
                {item.type === 'task' && item.taskStatus === 'running' && (
                  <div className="w-full h-1 bg-surface-container-high rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-info rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {item.type === 'alert' && (
                <Badge
                  variant={item.severity === 'critical' ? 'offline' : item.severity === 'warning' ? 'warning' : 'info'}
                  className="shrink-0"
                >
                  {item.severity}
                </Badge>
              )}
              {item.type === 'task' && (
                <span className={`text-xs font-medium shrink-0 ${taskStatusConfig[item.taskStatus]?.color}`}>
                  {taskStatusConfig[item.taskStatus]?.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const onlineCount = mockDevices.filter(d => d.status === 'online').length
  const offlineCount = mockDevices.filter(d => d.status === 'offline').length
  const warningCount = mockDevices.filter(d => d.status === 'warning').length
  const openAlerts = mockAlerts.filter(a => a.status === 'open').length

  const runningTasks = mockTasks.filter(t => t.status === 'running')
  const pendingTasks = mockTasks.filter(t => t.status === 'pending')
  const failedTasks = mockTasks.filter(t => t.status === 'failed')
  const completedTasks = mockTasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">Fleet overview and quick actions</p>
      </div>

      {/* Stat Cards with animated counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard
          title="Total Devices"
          value={mockDevices.length}
          icon={Server}
          trend="up"
          trendValue="+2 this week"
        />
        <AnimatedStatCard
          title="Online"
          value={onlineCount}
          icon={Cpu}
          trend="up"
          trendValue={`${Math.round((onlineCount / mockDevices.length) * 100)}% uptime`}
        />
        <AnimatedStatCard
          title="Active Alerts"
          value={openAlerts}
          icon={Bell}
          trend="down"
          trendValue="-3 from yesterday"
        />
        <AnimatedStatCard
          title="Backups Today"
          value={mockBackupsToday()}
          icon={HardDrive}
          trend="neutral"
          trendValue="All scheduled"
        />
      </div>

      {/* Task Queue Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <CardTitle className="mb-0">Task Queue</CardTitle>
          </div>
          <Link to="/tasks">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <TaskStatusCount status="running" count={runningTasks.length} />
          <TaskStatusCount status="pending" count={pendingTasks.length} />
          <TaskStatusCount status="failed" count={failedTasks.length} />
          <TaskStatusCount status="completed" count={completedTasks.length} />
        </div>
        {/* Running tasks progress */}
        {runningTasks.length > 0 && (
          <div className="space-y-3 border-t border-outline-variant pt-4">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">In Progress</p>
            {runningTasks.map(task => (
              <div key={task.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="text-info animate-spin" />
                    <span className="text-sm text-on-surface">{task.job}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">{task.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info rounded-full transition-all duration-700"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <p className="text-xs text-outline truncate">
                  {task.logs[task.logs.length - 1]?.message}
                </p>
              </div>
            ))}
          </div>
        )}
        {/* Failed tasks */}
        {failedTasks.length > 0 && (
          <div className="space-y-2 border-t border-outline-variant pt-4 mt-4">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Failed</p>
            {failedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-error-container/50">
                <XCircle size={14} className="text-error shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface truncate">{task.job}</p>
                  <p className="text-xs text-error truncate">
                    {task.logs.filter(l => l.level === 'error').pop()?.message}
                  </p>
                </div>
                <span className="text-xs text-on-surface-variant shrink-0">{task.duration}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Grafana Embed + Hermes AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafana Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Activity size={18} className="text-warning" />
              </div>
              <CardTitle className="mb-0">Grafana Metrics</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              <Settings size={14} className="mr-1" />
              Configure
            </Button>
          </CardHeader>
          <div className="space-y-4">
            {/* Mock chart: CPU */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-on-surface-variant">CPU Usage (1h)</span>
                <span className="text-xs text-on-surface-variant">avg 21%</span>
              </div>
              <div className="bg-surface-container rounded-lg p-2">
                <MiniSparkline data={chartData.cpu} color="#6750A4" />
              </div>
            </div>
            {/* Mock chart: Traffic */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-on-surface-variant">Traffic (1h)</span>
                <span className="text-xs text-on-surface-variant">avg 68 Mbps</span>
              </div>
              <div className="bg-surface-container rounded-lg p-2">
                <MiniSparkline data={chartData.traffic} color="#0061A4" />
              </div>
            </div>
            {/* Placeholder iframe area */}
            <div className="border-2 border-dashed border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <Settings size={24} className="text-outline mb-2" />
              <p className="text-sm text-on-surface-variant">Configure Grafana URL in Settings</p>
              <p className="text-xs text-outline mt-1">Embed live dashboards directly into MikroWize</p>
              <Button variant="secondary" size="sm" className="mt-3">
                <Settings size={14} className="mr-1" />
                Set Grafana URL
              </Button>
            </div>
          </div>
        </Card>

        {/* Hermes AI Widget */}
        <HermesWidget />
      </div>

      {/* Live Activity Feed */}
      <LiveActivityFeed />
    </div>
  )
}

/* ── Helper: Task status count card ── */
function TaskStatusCount({ status, count }) {
  const cfg = taskStatusConfig[status]
  const Icon = cfg.icon
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${cfg.bg}/40`}>
      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
        <Icon size={18} className={cfg.color} />
      </div>
      <div>
        <p className="text-xl font-bold text-on-surface">{count}</p>
        <p className="text-xs text-on-surface-variant">{cfg.label}</p>
      </div>
    </div>
  )
}

/* ── Helper: count backups today ── */
function mockBackupsToday() {
  const today = new Date().toISOString().slice(0, 10)
  // In a real app this would filter by date; for mock we return a reasonable number
  return 4
}
