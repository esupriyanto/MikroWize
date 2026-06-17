import { useState, useMemo, useCallback } from 'react'
import {
  Bell, CheckCircle, Clock, AlertTriangle, Search, Filter, X, Plus,
  ChevronDown, ChevronRight, User, Timer, Settings, Send, Mail,
  MessageSquare, Phone, ExternalLink, Zap, ArrowDown, ArrowUp,
  Calendar, SlidersHorizontal, CheckSquare, Square, PanelRightOpen,
  PanelRightClose, Bot, Wrench, Shield, Activity
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockAlerts, mockDevices } from '../mock/data'

// ─── Helpers ────────────────────────────────────────────────────────────────

const severityVariant = { critical: 'offline', warning: 'warning', info: 'info' }
const statusVariant = { open: 'warning', acknowledged: 'info', resolved: 'online', snoozed: 'default' }

const formatTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const timeAgo = (iso) => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const sites = [...new Set(mockDevices.map(d => d.site))]
const devices = mockDevices.map(d => ({ hostname: d.hostname, site: d.site }))

const assignableUsers = ['admin', 'operator', 'netops-team', 'oncall-engineer']

const hermesSuggestions = {
  'CPU': 'Consider checking for runaway processes. Run /system resource print. If sustained, investigate queue types and fasttrack rules.',
  'RAM': 'Check for memory leaks in connection tracking. Consider reducing NAT timeout values or increasing RAM if consistently high.',
  'BGP': 'Verify neighbor configuration and check for route flapping. Review BGP timers and ensure stable link on the peering interface.',
  'Interface': 'Check cable integrity and SFP module. Review interface counters for CRC errors. Consider replacing SFP or reseating cable.',
  'PPPoE': 'Monitor session count trend. Consider increasing max-sessions limit or implementing session limits per user.',
  'default': 'Review device logs for related events. Check system health metrics and recent configuration changes.',
}

const getHermesSuggestion = (message) => {
  const lower = message.toLowerCase()
  if (lower.includes('cpu')) return hermesSuggestions['CPU']
  if (lower.includes('ram')) return hermesSuggestions['RAM']
  if (lower.includes('bgp')) return hermesSuggestions['BGP']
  if (lower.includes('interface') || lower.includes('error rate')) return hermesSuggestions['Interface']
  if (lower.includes('pppoe') || lower.includes('session')) return hermesSuggestions['PPPoE']
  return hermesSuggestions['default']
}

// ─── Mock alert rules & notification channels ──────────────────────────────

const defaultAlertRules = [
  { id: 'r1', metric: 'CPU Usage', condition: '>', threshold: 75, duration: '5m', severity: 'critical', channel: 'Telegram', enabled: true },
  { id: 'r2', metric: 'RAM Usage', condition: '>', threshold: 80, duration: '5m', severity: 'critical', channel: 'Telegram', enabled: true },
  { id: 'r3', metric: 'Interface Errors', condition: '>', threshold: 10, duration: '1m', severity: 'warning', channel: 'Slack', enabled: true },
  { id: 'r4', metric: 'BGP Session', condition: '==', threshold: 0, duration: '0m', severity: 'warning', channel: 'SMTP', enabled: true },
  { id: 'r5', metric: 'PPPoE Sessions', condition: '>', threshold: 450, duration: '10m', severity: 'info', channel: 'PagerDuty', enabled: false },
]

const defaultNotifChannels = [
  { id: 'n1', type: 'Telegram', name: 'Ops Telegram', config: '@ops-channel', enabled: true },
  { id: 'n2', type: 'SMTP', name: 'Email Alerts', config: 'alerts@company.com', enabled: true },
  { id: 'n3', type: 'Slack', name: 'Slack #network', config: '#network-alerts', enabled: true },
  { id: 'n4', type: 'PagerDuty', name: 'PagerDuty Prod', config: 'service-key-xxx', enabled: false },
]

const notifIcons = {
  Telegram: Send,
  SMTP: Mail,
  Slack: MessageSquare,
  PagerDuty: Phone,
}

// ─── Modal component ────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[85vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Main Alerts Page ───────────────────────────────────────────────────────

export default function Alerts() {
  // State
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'history'
  const [alerts, setAlerts] = useState(mockAlerts.map(a => ({ ...a, assignedTo: null, note: '', snoozedUntil: null, timeline: [] })))
  const [selected, setSelected] = useState(new Set())
  const [detailAlert, setDetailAlert] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [fSeverity, setFSeverity] = useState('all')
  const [fDevice, setFDevice] = useState('all')
  const [fSite, setFSite] = useState('all')
  const [fStatus, setFStatus] = useState('all')
  const [fSearch, setFSearch] = useState('')
  const [fDateFrom, setFDateFrom] = useState('')
  const [fDateTo, setFDateTo] = useState('')

  // Modals
  const [ackModal, setAckModal] = useState({ open: false, alertId: null, note: '' })
  const [resolveModal, setResolveModal] = useState({ open: false, alertId: null, note: '' })
  const [snoozeModal, setSnoozeModal] = useState({ open: false, alertId: null, duration: 15, unit: 'minutes' })
  const [assignModal, setAssignModal] = useState({ open: false, alertId: null, user: '' })
  const [ruleModal, setRuleModal] = useState({ open: false, rule: null })
  const [notifModal, setNotifModal] = useState({ open: false, channel: null })
  const [showRules, setShowRules] = useState(false)
  const [showNotifChannels, setShowNotifChannels] = useState(false)

  // Rules & channels state
  const [alertRules, setAlertRules] = useState(defaultAlertRules)
  const [notifChannels, setNotifChannels] = useState(defaultNotifChannels)

  // ─── Derived data ────────────────────────────────────────────────────────

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (fSeverity !== 'all' && a.severity !== fSeverity) return false
      if (fDevice !== 'all' && a.device !== fDevice) return false
      if (fSite !== 'all') {
        const dev = mockDevices.find(d => d.hostname === a.device)
        if (!dev || dev.site !== fSite) return false
      }
      if (fStatus !== 'all' && a.status !== fStatus) return false
      if (fSearch && !a.message.toLowerCase().includes(fSearch.toLowerCase())) return false
      if (fDateFrom && new Date(a.time) < new Date(fDateFrom)) return false
      if (fDateTo && new Date(a.time) > new Date(fDateTo + 'T23:59:59')) return false
      if (activeTab === 'active') return a.status !== 'resolved'
      return a.status === 'resolved'
    })
  }, [alerts, fSeverity, fDevice, fSite, fStatus, fSearch, fDateFrom, fDateTo, activeTab])

  const openAlerts = alerts.filter(a => a.status === 'open')
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved')
  const ackedAlerts = alerts.filter(a => a.status === 'acknowledged')
  const resolvedToday = alerts.filter(a => a.status === 'resolved' && a.time && new Date(a.time).toDateString() === new Date().toDateString())

  // MTTR calculation (mock: average of 45 minutes for resolved alerts)
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved')
  const mttr = resolvedAlerts.length > 0
    ? Math.round(resolvedAlerts.reduce((sum) => sum + 45, 0) / resolvedAlerts.length)
    : 0

  // ─── Actions ─────────────────────────────────────────────────────────────

  const addTimeline = useCallback((alertId, action, detail) => {
    setAlerts(prev => prev.map(a => {
      if (a.id !== alertId) return a
      return { ...a, timeline: [...(a.timeline || []), { time: new Date().toISOString(), action, detail }] }
    }))
  }, [])

  const doAcknowledge = () => {
    const { alertId, note } = ackModal
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged', note } : a))
    addTimeline(alertId, 'acknowledged', note || 'Alert acknowledged')
    setAckModal({ open: false, alertId: null, note: '' })
  }

  const doResolve = () => {
    const { alertId, note } = resolveModal
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved', note } : a))
    addTimeline(alertId, 'resolved', note || 'Alert resolved')
    setResolveModal({ open: false, alertId: null, note: '' })
    if (detailAlert?.id === alertId) setDetailAlert(null)
  }

  const doSnooze = () => {
    const { alertId, duration, unit } = snoozeModal
    const mins = unit === 'hours' ? duration * 60 : duration
    const until = new Date(Date.now() + mins * 60000).toISOString()
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'snoozed', snoozedUntil: until } : a))
    addTimeline(alertId, 'snoozed', `Snoozed for ${duration} ${unit}`)
    setSnoozeModal({ open: false, alertId: null, duration: 15, unit: 'minutes' })
  }

  const doAssign = () => {
    const { alertId, user } = assignModal
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, assignedTo: user } : a))
    addTimeline(alertId, 'assigned', `Assigned to ${user}`)
    setAssignModal({ open: false, alertId: null, user: '' })
  }

  const doBulkAcknowledge = () => {
    const ids = new Set(selected)
    setAlerts(prev => prev.map(a => ids.has(a.id) && a.status === 'open' ? { ...a, status: 'acknowledged' } : a))
    ids.forEach(id => addTimeline(id, 'acknowledged', 'Bulk acknowledged'))
    setSelected(new Set())
  }

  const doBulkResolve = () => {
    const ids = new Set(selected)
    setAlerts(prev => prev.map(a => ids.has(a.id) && a.status !== 'resolved' ? { ...a, status: 'resolved' } : a))
    ids.forEach(id => addTimeline(id, 'resolved', 'Bulk resolved'))
    setSelected(new Set())
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filteredAlerts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredAlerts.map(a => a.id)))
    }
  }

  // ─── Alert Rule CRUD ─────────────────────────────────────────────────────

  const saveRule = () => {
    const { rule } = ruleModal
    if (!rule.metric || !rule.threshold) return
    if (rule.id) {
      setAlertRules(prev => prev.map(r => r.id === rule.id ? rule : r))
    } else {
      setAlertRules(prev => [...r, { ...rule, id: 'r' + Date.now(), enabled: true }])
    }
    setRuleModal({ open: false, rule: null })
  }

  const deleteRule = (id) => setAlertRules(prev => prev.filter(r => r.id !== id))
  const toggleRule = (id) => setAlertRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))

  // ─── Notification Channel CRUD ───────────────────────────────────────────

  const saveChannel = () => {
    const { channel } = notifModal
    if (!channel.name) return
    if (channel.id) {
      setNotifChannels(prev => prev.map(c => c.id === channel.id ? channel : c))
    } else {
      setNotifChannels(prev => [...c, { ...channel, id: 'n' + Date.now(), enabled: true }])
    }
    setNotifModal({ open: false, channel: null })
  }

  const deleteChannel = (id) => setNotifChannels(prev => prev.filter(c => c.id !== id))
  const toggleChannel = (id) => setNotifChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Alerts</h1>
          <p className="text-sm text-on-surface-variant mt-1">Monitor and manage fleet alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowNotifChannels(!showNotifChannels)}>
            <Settings size={14} /> Channels
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowRules(!showRules)}>
            <SlidersHorizontal size={14} /> Rules
          </Button>
          <Button variant="primary" size="sm" onClick={() => setRuleModal({ open: true, rule: { metric: '', condition: '>', threshold: 0, duration: '5m', severity: 'warning', channel: 'Telegram', enabled: true } })}>
            <Plus size={14} /> New Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Open Alerts" value={openAlerts.length} icon={Bell} />
        <StatCard title="Critical" value={criticalAlerts.length} icon={AlertTriangle} />
        <StatCard title="Acknowledged" value={ackedAlerts.length} icon={Clock} />
        <StatCard title="Resolved Today" value={resolvedToday.length} icon={CheckCircle} />
        <StatCard title="MTTR" value={mttr > 0 ? `${mttr}m` : '—'} icon={Activity} subtitle="Mean time to resolve" />
      </div>

      {/* Notification Channels Panel */}
      {showNotifChannels && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-on-surface">Notification Channels</h3>
            <Button variant="secondary" size="sm" onClick={() => setNotifModal({ open: true, channel: { type: 'Telegram', name: '', config: '', enabled: true } })}>
              <Plus size={14} /> Add Channel
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifChannels.map(ch => {
              const Icon = notifIcons[ch.type] || Send
              return (
                <div key={ch.id} className={`flex items-center justify-between p-3 rounded-lg border ${ch.enabled ? 'border-outline-variant bg-surface-container' : 'border-outline-variant/50 bg-surface-container/50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{ch.name || ch.type}</p>
                      <p className="text-xs text-on-surface-variant">{ch.config}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleChannel(ch.id)} className={`w-10 h-5 rounded-full transition-colors ${ch.enabled ? 'bg-primary' : 'bg-outline-variant'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${ch.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <button onClick={() => setNotifModal({ open: true, channel: ch })} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant">
                      <Settings size={14} />
                    </button>
                    <button onClick={() => deleteChannel(ch.id)} className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alert Rules Panel */}
      {showRules && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-on-surface">Alert Rules</h3>
            <Button variant="secondary" size="sm" onClick={() => setRuleModal({ open: true, rule: { metric: '', condition: '>', threshold: 0, duration: '5m', severity: 'warning', channel: 'Telegram', enabled: true } })}>
              <Plus size={14} /> Add Rule
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-3 text-on-surface-variant font-medium">Metric</th>
                  <th className="text-left py-2 px-3 text-on-surface-variant font-medium">Condition</th>
                  <th className="text-left py-2 px-3 text-on-surface-variant font-medium">Duration</th>
                  <th className="text-left py-2 px-3 text-on-surface-variant font-medium">Severity</th>
                  <th className="text-left py-2 px-3 text-on-surface-variant font-medium">Channel</th>
                  <th className="text-left py-2 px-3 text-on-surface-variant font-medium">Status</th>
                  <th className="text-right py-2 px-3 text-on-surface-variant font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertRules.map(rule => (
                  <tr key={rule.id} className={`border-b border-outline-variant/50 ${!rule.enabled ? 'opacity-50' : ''}`}>
                    <td className="py-2 px-3 text-on-surface font-medium">{rule.metric}</td>
                    <td className="py-2 px-3 text-on-surface-variant">{rule.condition} {rule.threshold}{rule.metric.includes('Usage') ? '%' : ''}</td>
                    <td className="py-2 px-3 text-on-surface-variant">{rule.duration}</td>
                    <td className="py-2 px-3"><Badge variant={severityVariant[rule.severity]}>{rule.severity}</Badge></td>
                    <td className="py-2 px-3 text-on-surface-variant">{rule.channel}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => toggleRule(rule.id)} className={`w-10 h-5 rounded-full transition-colors ${rule.enabled ? 'bg-primary' : 'bg-outline-variant'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => setRuleModal({ open: true, rule: { ...rule } })} className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant mr-1">
                        <Settings size={14} />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 w-fit">
        <button
          onClick={() => { setActiveTab('active'); setSelected(new Set()) }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'active' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Active Alerts ({alerts.filter(a => a.status !== 'resolved').length})
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelected(new Set()) }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Alert History ({alerts.filter(a => a.status === 'resolved').length})
        </button>
      </div>

      {/* Filters bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={fSearch}
              onChange={e => setFSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters
            {(fSeverity !== 'all' || fDevice !== 'all' || fSite !== 'all' || fStatus !== 'all' || fDateFrom || fDateTo) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
          {(fSeverity !== 'all' || fDevice !== 'all' || fSite !== 'all' || fStatus !== 'all' || fSearch || fDateFrom || fDateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setFSeverity('all'); setFDevice('all'); setFSite('all'); setFStatus('all'); setFSearch(''); setFDateFrom(''); setFDateTo('') }}>
              <X size={14} /> Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant">
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Severity</label>
              <select value={fSeverity} onChange={e => setFSeverity(e.target.value)} className="w-full px-3 py-1.5 text-sm bg-surface-container-high border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary">
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Device</label>
              <select value={fDevice} onChange={e => setFDevice(e.target.value)} className="w-full px-3 py-1.5 text-sm bg-surface-container-high border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {devices.map(d => <option key={d.hostname} value={d.hostname}>{d.hostname}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Site</label>
              <select value={fSite} onChange={e => setFSite(e.target.value)} className="w-full px-3 py-1.5 text-sm bg-surface-container-high border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {sites.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Status</label>
              <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="w-full px-3 py-1.5 text-sm bg-surface-container-high border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary">
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="snoozed">Snoozed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Date Range</label>
              <div className="flex gap-1">
                <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} className="w-full px-2 py-1.5 text-xs bg-surface-container-high border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" />
                <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)} className="w-full px-2 py-1.5 text-xs bg-surface-container-high border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && activeTab === 'active' && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <Button variant="secondary" size="sm" onClick={doBulkAcknowledge}>
            <CheckCircle size={14} /> Bulk Acknowledge
          </Button>
          <Button variant="secondary" size="sm" onClick={doBulkResolve}>
            <CheckSquare size={14} /> Bulk Resolve
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Cancel
          </Button>
        </div>
      )}

      {/* Alert list + detail panel */}
      <div className="flex gap-4">
        <div className={`space-y-3 transition-all ${detailAlert ? 'flex-1' : 'w-full'}`}>
          {/* Select all */}
          {filteredAlerts.length > 0 && activeTab === 'active' && (
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface">
              {selected.size === filteredAlerts.length ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
              Select all ({filteredAlerts.length})
            </button>
          )}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No alerts match your filters</p>
            </div>
          )}

          {filteredAlerts.map(alert => {
            const dev = mockDevices.find(d => d.hostname === alert.device)
            const isSelected = selected.has(alert.id)
            const isDetailOpen = detailAlert?.id === alert.id

            return (
              <div
                key={alert.id}
                className={`bg-surface-container-low rounded-xl border p-4 transition-colors cursor-pointer ${
                  isDetailOpen ? 'border-primary/40 ring-1 ring-primary/20' : 'border-outline-variant hover:border-primary/20'
                } ${isSelected ? 'bg-primary/5' : ''}`}
                onClick={() => setDetailAlert(isDetailOpen ? null : alert)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  {activeTab === 'active' && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleSelect(alert.id) }}
                      className="mt-1 shrink-0"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-on-surface-variant" />}
                    </button>
                  )}

                  {/* Severity indicator */}
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${
                    alert.severity === 'critical' ? 'bg-error' : alert.severity === 'warning' ? 'bg-warning' : 'bg-info'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                        <Badge variant={statusVariant[alert.status]}>{alert.status}</Badge>
                        {alert.assignedTo && (
                          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                            <User size={10} /> {alert.assignedTo}
                          </span>
                        )}
                        {alert.snoozedUntil && (
                          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                            <Timer size={10} /> {timeAgo(alert.snoozedUntil)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isDetailOpen ? <PanelRightClose size={14} className="text-on-surface-variant" /> : <PanelRightOpen size={14} className="text-on-surface-variant" />}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-on-surface mt-1.5">{alert.message}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                      <span>{alert.device}</span>
                      {dev && <span>· {dev.site}</span>}
                      <span>· {formatTime(alert.time)}</span>
                      <span className="text-on-surface-variant/60">({timeAgo(alert.time)})</span>
                    </div>

                    {/* Action buttons for active alerts */}
                    {activeTab === 'active' && alert.status !== 'resolved' && (
                      <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        {alert.status === 'open' && (
                          <Button variant="secondary" size="sm" onClick={() => setAckModal({ open: true, alertId: alert.id, note: '' })}>
                            <CheckCircle size={14} /> Acknowledge
                          </Button>
                        )}
                        <Button variant="secondary" size="sm" onClick={() => setResolveModal({ open: true, alertId: alert.id, note: '' })}>
                          <CheckSquare size={14} /> Resolve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setAssignModal({ open: true, alertId: alert.id, user: alert.assignedTo || '' })}>
                          <User size={14} /> Assign
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSnoozeModal({ open: true, alertId: alert.id, duration: 15, unit: 'minutes' })}>
                          <Timer size={14} /> Snooze
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail Panel */}
        {detailAlert && (
          <div className="w-[380px] shrink-0 bg-surface-container-low rounded-xl border border-outline-variant p-5 space-y-5 h-fit sticky top-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-on-surface">Alert Details</h3>
              <button onClick={() => setDetailAlert(null)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <X size={16} />
              </button>
            </div>

            {/* Severity & Status */}
            <div className="flex items-center gap-2">
              <Badge variant={severityVariant[detailAlert.severity]}>{detailAlert.severity}</Badge>
              <Badge variant={statusVariant[detailAlert.status]}>{detailAlert.status}</Badge>
            </div>

            {/* Message */}
            <div>
              <p className="text-sm font-medium text-on-surface">{detailAlert.message}</p>
              <p className="text-xs text-on-surface-variant mt-1">{formatTime(detailAlert.time)}</p>
            </div>

            {/* Device Info */}
            {(() => {
              const dev = mockDevices.find(d => d.hostname === detailAlert.device)
              if (!dev) return null
              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Device Info</h4>
                  <div className="bg-surface-container rounded-lg p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-on-surface-variant">Hostname</span><span className="text-on-surface font-medium">{dev.hostname}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">IP</span><span className="text-on-surface font-medium">{dev.ip}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Model</span><span className="text-on-surface font-medium">{dev.model}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Site</span><span className="text-on-surface font-medium">{dev.site}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Version</span><span className="text-on-surface font-medium">{dev.routerOsVersion}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">CPU</span><span className="text-on-surface font-medium">{dev.cpu}%</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">RAM</span><span className="text-on-surface font-medium">{dev.ram}%</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Uptime</span><span className="text-on-surface font-medium">{dev.uptime}</span></div>
                  </div>
                </div>
              )
            })()}

            {/* Hermes Suggested Fix */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Bot size={12} className="text-primary" /> Hermes Suggested Fix
              </h4>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs text-on-surface leading-relaxed">
                {getHermesSuggestion(detailAlert.message)}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Timeline</h4>
              <div className="space-y-2">
                {(detailAlert.timeline && detailAlert.timeline.length > 0)
                  ? [...detailAlert.timeline].reverse().map((entry, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1 ${
                            entry.action === 'resolved' ? 'bg-success' :
                            entry.action === 'acknowledged' ? 'bg-info' :
                            entry.action === 'assigned' ? 'bg-primary' :
                            'bg-warning'
                          }`} />
                          {i < detailAlert.timeline.length - 1 && <div className="w-px h-full bg-outline-variant mt-0.5" />}
                        </div>
                        <div className="pb-2">
                          <p className="text-on-surface font-medium capitalize">{entry.action}</p>
                          <p className="text-on-surface-variant">{entry.detail}</p>
                          <p className="text-on-surface-variant/60">{formatTime(entry.time)}</p>
                        </div>
                      </div>
                    ))
                  : (
                      <div className="flex gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-error mt-1" />
                        <div>
                          <p className="text-on-surface font-medium">Triggered</p>
                          <p className="text-on-surface-variant">{formatTime(detailAlert.time)}</p>
                        </div>
                      </div>
                    )
                }
              </div>
            </div>

            {/* Quick actions in detail panel */}
            {detailAlert.status !== 'resolved' && (
              <div className="flex gap-2 pt-2 border-t border-outline-variant">
                {detailAlert.status === 'open' && (
                  <Button variant="secondary" size="sm" onClick={() => { setAckModal({ open: true, alertId: detailAlert.id, note: '' }) }}>
                    <CheckCircle size={14} /> Ack
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={() => { setResolveModal({ open: true, alertId: detailAlert.id, note: '' }) }}>
                  <CheckSquare size={14} /> Resolve
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {/* Acknowledge Modal */}
      <Modal open={ackModal.open} onClose={() => setAckModal({ open: false, alertId: null, note: '' })} title="Acknowledge Alert">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Add an optional note for this acknowledgment.</p>
          <textarea
            value={ackModal.note}
            onChange={e => setAckModal(prev => ({ ...prev, note: e.target.value }))}
            placeholder="e.g., Investigating high CPU on mt-pppoe-con..."
            className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none h-24"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAckModal({ open: false, alertId: null, note: '' })}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={doAcknowledge}>Acknowledge</Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal open={resolveModal.open} onClose={() => setResolveModal({ open: false, alertId: null, note: '' })} title="Resolve Alert">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Describe how this alert was resolved.</p>
          <textarea
            value={resolveModal.note}
            onChange={e => setResolveModal(prev => ({ ...prev, note: e.target.value }))}
            placeholder="e.g., Cleared runaway process, CPU back to normal..."
            className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none h-24"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResolveModal({ open: false, alertId: null, note: '' })}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={doResolve}>Resolve</Button>
          </div>
        </div>
      </Modal>

      {/* Snooze Modal */}
      <Modal open={snoozeModal.open} onClose={() => setSnoozeModal({ open: false, alertId: null, duration: 15, unit: 'minutes' })} title="Snooze Alert">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Temporarily hide this alert for a set duration.</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={snoozeModal.duration}
              onChange={e => setSnoozeModal(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
              className="w-24 px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
            />
            <select
              value={snoozeModal.unit}
              onChange={e => setSnoozeModal(prev => ({ ...prev, unit: e.target.value }))}
              className="px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSnoozeModal({ open: false, alertId: null, duration: 15, unit: 'minutes' })}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={doSnooze}>Snooze</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal open={assignModal.open} onClose={() => setAssignModal({ open: false, alertId: null, user: '' })} title="Assign Alert">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Assign this alert to a team member.</p>
          <select
            value={assignModal.user}
            onChange={e => setAssignModal(prev => ({ ...prev, user: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="">Select user...</option>
            {assignableUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAssignModal({ open: false, alertId: null, user: '' })}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={doAssign}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Alert Rule Modal */}
      <Modal open={ruleModal.open} onClose={() => setRuleModal({ open: false, rule: null })} title={ruleModal.rule?.id ? 'Edit Alert Rule' : 'New Alert Rule'} wide>
        {ruleModal.rule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">Metric</label>
                <input
                  value={ruleModal.rule.metric}
                  onChange={e => setRuleModal(prev => ({ ...prev, rule: { ...prev.rule, metric: e.target.value } }))}
                  placeholder="e.g., CPU Usage"
                  className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">Condition</label>
                <div className="flex gap-2">
                  <select
                    value={ruleModal.rule.condition}
                    onChange={e => setRuleModal(prev => ({ ...prev, rule: { ...prev.rule, condition: e.target.value } }))}
                    className="w-20 px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value=">">&gt;</option>
                    <option value=">=">&ge;</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&le;</option>
                    <option value="==">=</option>
                  </select>
                  <input
                    type="number"
                    value={ruleModal.rule.threshold}
                    onChange={e => setRuleModal(prev => ({ ...prev, rule: { ...prev.rule, threshold: parseInt(e.target.value) || 0 } }))}
                    className="flex-1 px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">Duration</label>
                <input
                  value={ruleModal.rule.duration}
                  onChange={e => setRuleModal(prev => ({ ...prev, rule: { ...prev.rule, duration: e.target.value } }))}
                  placeholder="e.g., 5m, 1h"
                  className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">Severity</label>
                <select
                  value={ruleModal.rule.severity}
                  onChange={e => setRuleModal(prev => ({ ...prev, rule: { ...prev.rule, severity: e.target.value } }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1 block">Notification Channel</label>
                <select
                  value={ruleModal.rule.channel}
                  onChange={e => setRuleModal(prev => ({ ...prev, rule: { ...prev.rule, channel: e.target.value } }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                >
                  {notifChannels.filter(c => c.enabled).map(c => <option key={c.id} value={c.type}>{c.name || c.type}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <Button variant="ghost" size="sm" onClick={() => setRuleModal({ open: false, rule: null })}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveRule}>Save Rule</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notification Channel Modal */}
      <Modal open={notifModal.open} onClose={() => setNotifModal({ open: false, channel: null })} title={notifModal.channel?.id ? 'Edit Channel' : 'New Notification Channel'}>
        {notifModal.channel && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Type</label>
              <select
                value={notifModal.channel.type}
                onChange={e => setNotifModal(prev => ({ ...prev, channel: { ...prev.channel, type: e.target.value } }))}
                className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="Telegram">Telegram</option>
                <option value="SMTP">SMTP (Email)</option>
                <option value="Slack">Slack</option>
                <option value="PagerDuty">PagerDuty</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Name</label>
              <input
                value={notifModal.channel.name}
                onChange={e => setNotifModal(prev => ({ ...prev, channel: { ...prev.channel, name: e.target.value } }))}
                placeholder="e.g., Ops Telegram"
                className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant mb-1 block">Configuration</label>
              <input
                value={notifModal.channel.config}
                onChange={e => setNotifModal(prev => ({ ...prev, channel: { ...prev.channel, config: e.target.value } }))}
                placeholder={notifModal.channel.type === 'Telegram' ? '@channel-name' : notifModal.channel.type === 'SMTP' ? 'email@company.com' : notifModal.channel.type === 'Slack' ? '#channel-name' : 'service-key'}
                className="w-full px-3 py-2 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <Button variant="ghost" size="sm" onClick={() => setNotifModal({ open: false, channel: null })}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveChannel}>Save Channel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
