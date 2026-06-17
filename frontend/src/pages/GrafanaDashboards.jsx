import { useState, useCallback } from 'react'
import {
  LayoutDashboard, Plus, ExternalLink, Settings, Monitor,
  Activity, Wifi, Radio, Network, Users, Clock,
  ChevronDown, X, Globe, Search
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Select } from '../components/ui/Input'

/* ═══════════════════════════════════════════════════════════════
   PRE-BUILT DASHBOARD CATALOG
   ═══════════════════════════════════════════════════════════════ */

const PREBUILT_DASHBOARDS = [
  { id: 'fleet-overview', name: 'Fleet Overview', description: 'Device status, uptime, and health across all sites', icon: LayoutDashboard, panels: ['Device Status Grid', 'Uptime Trend', 'Firmware Distribution', 'Site Health Map'] },
  { id: 'traffic-analysis', name: 'Traffic Analysis', description: 'Interface throughput, queue stats, and bandwidth utilization', icon: Activity, panels: ['Per-Interface Throughput', 'Queue Tree Utilization', 'Bandwidth Heatmap', 'Top Talkers'] },
  { id: 'wireless-health', name: 'Wireless Health', description: 'RSSI, CCQ, noise floor, and registration table', icon: Wifi, panels: ['Signal Strength', 'CCQ Over Time', 'Registration Table', 'Noise Floor'] },
  { id: 'bgp-status', name: 'BGP Status', description: 'BGP session states, prefix counts, and route changes', icon: Radio, panels: ['BGP Session Table', 'Prefix Count Trend', 'Route Changes', 'AS Path Map'] },
  { id: 'pppoe-sessions', name: 'PPPoE Sessions', description: 'Active PPPoE sessions, authentication stats, and throughput', icon: Users, panels: ['Active Sessions', 'Auth Rate', 'Session Duration', 'Per-Server Load'] },
]

const MOCK_DEVICES = [
  { id: 'all', label: 'All Devices' },
  { id: 'sites', label: 'All Sites' },
  { id: 'router-cbd-01', label: 'router-cbd-01' },
  { id: 'router-dpk-02', label: 'router-dpk-02' },
  { id: 'ap-mks-03', label: 'ap-mks-03' },
  { id: 'olt-jkt-01', label: 'olt-jkt-01' },
]

const TIME_RANGES = [
  { label: 'Last 1 hour', value: '1h', grafanaValue: 'now-1h' },
  { label: 'Last 6 hours', value: '6h', grafanaValue: 'now-6h' },
  { label: 'Last 24 hours', value: '24h', grafanaValue: 'now-24h' },
  { label: 'Last 7 days', value: '7d', grafanaValue: 'now-7d' },
  { label: 'Last 30 days', value: '30d', grafanaValue: 'now-30d' },
  { label: 'Custom range', value: 'custom', grafanaValue: 'custom' },
]

/* ═══════════════════════════════════════════════════════════════
   MOCK PANEL COLORS (Grafana-style)
   ═══════════════════════════════════════════════════════════════ */

const PANEL_COLORS = [
  { bg: 'bg-[#003d7c]/10', border: 'border-[#003d7c]/30', header: 'bg-[#003d7c]/15', accent: '#003d7c' },
  { bg: 'bg-[#1a7c3b]/10', border: 'border-[#1a7c3b]/30', header: 'bg-[#1a7c3b]/15', accent: '#1a7c3b' },
  { bg: 'bg-[#7c5800]/10', border: 'border-[#7c5800]/30', header: 'bg-[#7c5800]/15', accent: '#7c5800' },
  { bg: 'bg-[#6a2b00]/10', border: 'border-[#6a2b00]/30', header: 'bg-[#6a2b00]/15', accent: '#6a2b00' },
  { bg: 'bg-[#6750A4]/10', border: 'border-[#6750A4]/30', header: 'bg-[#6750A4]/15', accent: '#6750A4' },
  { bg: 'bg-[#0054a6]/10', border: 'border-[#0054a6]/30', header: 'bg-[#0054a6]/15', accent: '#0054a6' },
]

/* ═══════════════════════════════════════════════════════════════
   MOCK PANEL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function MockBarChart({ color }) {
  const bars = [65, 42, 78, 55, 90, 35, 68, 82, 48, 72, 60, 88]
  return (
    <div className="flex items-end gap-1 h-16">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{ height: `${h}%`, backgroundColor: color, opacity: 0.7 + (i % 3) * 0.1 }}
        />
      ))}
    </div>
  )
}

function MockSparkline({ color }) {
  const points = [20, 35, 28, 45, 38, 55, 42, 60, 52, 70, 65, 75, 68, 80]
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const h = 40
  const w = 120
  const stepX = w / (points.length - 1)
  const pathPoints = points.map((v, i) => `${i * stepX},${h - ((v - min) / range) * h}`).join(' ')
  const areaPoints = `0,${h} ${pathPoints} ${(points.length - 1) * stepX},${h}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polygon points={areaPoints} fill={color} opacity="0.1" />
      <polyline points={pathPoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MockGauge({ value, color, label }) {
  const angle = (value / 100) * 180
  const rad = (Math.PI * (180 - angle)) / 180
  const x = 50 + 35 * Math.cos(rad)
  const y = 50 - 35 * Math.sin(rad)

  return (
    <svg viewBox="0 0 100 60" className="w-full">
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--color-outline-variant, #c2c6d3)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(angle / 180) * 126} 126`} />
      <text x="50" y="44" textAnchor="middle" className="text-[11px] font-semibold" fill="var(--color-on-surface, #191c21)">{value}%</text>
      {label && <text x="50" y="56" textAnchor="middle" className="text-[6px]" fill="var(--color-on-surface-variant, #424751)">{label}</text>}
    </svg>
  )
}

function MockStatValue({ value, color, unit }) {
  return (
    <div className="text-center">
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      {unit && <span className="text-xs text-on-surface-variant ml-1">{unit}</span>}
    </div>
  )
}

/* Panel rendering by type */
function MockPanel({ panel, colorScheme }) {
  const { accent, bg, border, header: headerBg } = colorScheme

  if (panel === 'Device Status Grid' || panel === 'BGP Session Table' || panel === 'Registration Table') {
    return (
      <div className={`rounded-lg border ${bg} ${border} overflow-hidden`}>
        <div className={`px-3 py-2 ${headerBg} border-b ${border}`}>
          <p className="text-xs font-semibold text-on-surface">{panel}</p>
        </div>
        <div className="p-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-on-surface-variant">
                <th className="text-left py-1 px-2 font-medium">Name</th>
                <th className="text-left py-1 px-2 font-medium">Status</th>
                <th className="text-right py-1 px-2 font-medium">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {['router-cbd-01', 'router-dpk-02', 'ap-mks-03', 'olt-jkt-01', 'sw-cbd-02'].map((name, i) => (
                <tr key={i} className="border-t border-outline-variant/50">
                  <td className="py-1.5 px-2 text-on-surface font-mono text-[10px]">{name}</td>
                  <td className="py-1.5 px-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${i === 2 ? 'bg-warning' : 'bg-success'}`} />
                    <span className={`ml-1.5 ${i === 2 ? 'text-warning' : 'text-success'}`}>{i === 2 ? 'warn' : 'up'}</span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-on-surface-variant">{Math.floor(Math.random() * 360)}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (panel.includes('Throughput') || panel.includes('Trend') || panel.includes('Over Time') || panel.includes('Utilization')) {
    return (
      <div className={`rounded-lg border ${bg} ${border} overflow-hidden`}>
        <div className={`px-3 py-2 ${headerBg} border-b ${border} flex items-center justify-between`}>
          <p className="text-xs font-semibold text-on-surface">{panel}</p>
          <span className="text-[10px] text-on-surface-variant">TX / RX</span>
        </div>
        <div className="p-2 space-y-1">
          <MockSparkline color={accent} />
          <div className="flex justify-between text-[10px] text-on-surface-variant">
            <span>TX: {(Math.random() * 100).toFixed(1)} Mbps</span>
            <span>RX: {(Math.random() * 200).toFixed(1)} Mbps</span>
          </div>
        </div>
      </div>
    )
  }

  if (panel.includes('Map')) {
    return (
      <div className={`rounded-lg border ${bg} ${border} overflow-hidden`}>
        <div className={`px-3 py-2 ${headerBg} border-b ${border}`}>
          <p className="text-xs font-semibold text-on-surface">{panel}</p>
        </div>
        <div className="p-3 flex items-center justify-center h-24">
          <div className="relative w-full h-full">
            {[30, 45, 60, 75].map((x, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${20 + i * 15}%`,
                  backgroundColor: i === 2 ? '#7c5800' : accent,
                  opacity: 0.8,
                  boxShadow: `0 0 6px ${i === 2 ? '#7c5800' : accent}`,
                }}
              />
            ))}
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
              <line x1="30%" y1="25%" x2="45%" y2="40%" stroke={accent} strokeWidth="1" />
              <line x1="45%" y1="40%" x2="60%" y2="55%" stroke={accent} strokeWidth="1" />
              <line x1="60%" y1="55%" x2="75%" y2="70%" stroke={accent} strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (panel.includes('Gauge') || panel.includes('CPU') || panel.includes('Memory') || panel.includes('Signal')) {
    const value = Math.floor(Math.random() * 40) + 40
    return (
      <div className={`rounded-lg border ${bg} ${border} overflow-hidden`}>
        <div className={`px-3 py-2 ${headerBg} border-b ${border}`}>
          <p className="text-xs font-semibold text-on-surface">{panel}</p>
        </div>
        <div className="p-2 flex flex-col items-center">
          <MockGauge value={value} color={accent} label="" />
          <p className="text-[10px] text-on-surface-variant mt-1">Avg: {value}%</p>
        </div>
      </div>
    )
  }

  // Default: bar chart panels (Heatmap, Sessions, Distribution, etc.)
  return (
    <div className={`rounded-lg border ${bg} ${border} overflow-hidden`}>
      <div className={`px-3 py-2 ${headerBg} border-b ${border} flex items-center justify-between`}>
        <p className="text-xs font-semibold text-on-surface">{panel}</p>
        <span className="text-[10px] text-on-surface-variant">24h</span>
      </div>
      <div className="p-2">
        <MockBarChart color={accent} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SETUP PROMPT (when no URL configured)
   ═══════════════════════════════════════════════════════════════ */

function SetupPrompt({ onGoToSettings }) {
  return (
    <Card className="flex items-center justify-center min-h-[28rem]">
      <div className="text-center py-12 max-w-[28rem]">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Monitor size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-on-surface mb-2">Grafana Not Configured</h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Set up your Grafana integration to embed dashboards directly in MikroWize. You'll need your Grafana URL and an API key.
        </p>
        <div className="space-y-3">
          <Button onClick={onGoToSettings} className="w-full">
            <Settings size={16} />
            Configure Grafana
          </Button>
          <a
            href="https://grafana.com/docs/grafana/latest/dashboards/share-dashboards-panels/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink size={14} />
            Grafana embedding docs
          </a>
        </div>
      </div>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADD DASHBOARD MODAL
   ═══════════════════════════════════════════════════════════════ */

function AddDashboardModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = () => {
    const newErrors = {}
    if (!name.trim()) newErrors.name = 'Dashboard name is required'
    if (!url.trim()) newErrors.url = 'Dashboard URL is required'
    else if (!url.startsWith('http://') && !url.startsWith('https://')) newErrors.url = 'URL must start with http:// or https://'
    if (!apiKey.trim()) newErrors.apiKey = 'API key is required for embedded access'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onAdd({
      id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: name.trim(),
      url: url.trim(),
      apiKey: apiKey.trim(),
      description: 'Custom dashboard',
      icon: Globe,
      panels: ['Custom Panel 1', 'Custom Panel 2'],
      isCustom: true,
    })

    setName('')
    setUrl('')
    setApiKey('')
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setName('')
    setUrl('')
    setApiKey('')
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-surface-container-high rounded-2xl border border-outline-variant w-full max-w-[32rem] mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Add Dashboard</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Embed a Grafana dashboard or panel</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-base font-medium text-on-surface">Dashboard Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })) }}
              placeholder="My Custom Dashboard"
              className={`w-full h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border text-base text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                errors.name ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.name && <p className="text-xs text-error">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-on-surface">Dashboard URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErrors(prev => ({ ...prev, url: undefined })) }}
              placeholder="https://grafana.example.com/d/abc123/my-dashboard"
              className={`w-full h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border text-base text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                errors.url ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.url && <p className="text-xs text-error">{errors.url}</p>}
            <p className="text-xs text-on-surface-variant">Full URL to the Grafana dashboard or panel</p>
          </div>

          <div className="space-y-2">
            <label className="block text-base font-medium text-on-surface">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setErrors(prev => ({ ...prev, apiKey: undefined })) }}
              placeholder="glsa_xxxxxxxxxxxxx"
              className={`w-full h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border text-base text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                errors.apiKey ? 'border-error' : 'border-outline-variant'
              }`}
            />
            {errors.apiKey && <p className="text-xs text-error">{errors.apiKey}</p>}
            <p className="text-xs text-on-surface-variant">Grafana service account token with Viewer role</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Plus size={16} />
            Add Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function GrafanaDashboards() {
  const [dashboards, setDashboards] = useState(PREBUILT_DASHBOARDS)
  const [selectedDashboardId, setSelectedDashboardId] = useState('fleet-overview')
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')
  const [showAddModal, setShowAddModal] = useState(false)
  const [grafanaUrl, setGrafanaUrl] = useState('') // empty = not configured
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedDashboard = dashboards.find(d => d.id === selectedDashboardId) || dashboards[0]
  const isConfigured = grafanaUrl.trim().length > 0

  const handleAddDashboard = useCallback((dashboard) => {
    setDashboards(prev => [...prev, dashboard])
    setSelectedDashboardId(dashboard.id)
  }, [])

  const handleGoToSettings = useCallback(() => {
    // In a real app this would use react-router navigate
    window.location.hash = '#/settings'
  }, [])

  const handleOpenInGrafana = useCallback(() => {
    if (isConfigured) {
      const timeParam = TIME_RANGES.find(t => t.value === timeRange)?.grafanaValue || 'now-24h'
      const url = `${grafanaUrl}/d/${selectedDashboard.id}?orgId=1&from=${timeParam}&to=now&var-device=${selectedDevice}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [isConfigured, grafanaUrl, selectedDashboard, timeRange, selectedDevice])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Grafana Dashboards</h1>
          <p className="text-sm text-on-surface-variant mt-1">Embedded monitoring dashboards with live variable sync</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="md">
          <Plus size={16} />
          Add Dashboard
        </Button>
      </div>

      {/* Controls Bar */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* Dashboard Selector */}
          <div className="flex-1 min-w-0 space-y-2">
            <label className="block text-base font-medium text-on-surface">Dashboard</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-base text-on-surface text-left flex items-center justify-between transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <selectedDashboard.icon size={18} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{selectedDashboard.name}</span>
                  </div>
                </div>
                <ChevronDown size={16} className={`text-on-surface-variant shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-xl border border-outline-variant shadow-lg z-20 overflow-hidden">
                    {dashboards.map(db => (
                      <button
                        key={db.id}
                        onClick={() => { setSelectedDashboardId(db.id); setDropdownOpen(false) }}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                          db.id === selectedDashboardId
                            ? 'bg-primary/10 text-primary'
                            : 'text-on-surface hover:bg-surface-container-highest'
                        }`}
                      >
                        <db.icon size={16} className={db.id === selectedDashboardId ? 'text-primary' : 'text-on-surface-variant'} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{db.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{db.description}</p>
                        </div>
                        {db.isCustom && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-medium shrink-0">Custom</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Device/Site Filter (Variable Sync) */}
          <div className="w-full lg:w-56 space-y-2">
            <label className="block text-base font-medium text-on-surface">Device / Site Filter</label>
            <Select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              {MOCK_DEVICES.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </Select>
          </div>

          {/* Time Range */}
          <div className="w-full lg:w-48 space-y-2">
            <label className="block text-base font-medium text-on-surface">Time Range</label>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {TIME_RANGES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>

          {/* Open in Grafana */}
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={handleOpenInGrafana}
              disabled={!isConfigured}
              title={!isConfigured ? 'Configure Grafana URL first' : 'Open in new tab'}
            >
              <ExternalLink size={16} />
              Open in Grafana
            </Button>
          </div>
        </div>

        {/* Variable Sync Status */}
        <div className="mt-4 pt-4 border-t border-outline-variant flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-success' : 'bg-outline'}`} />
            <span>{isConfigured ? 'Grafana connected' : 'Grafana not configured'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Search size={12} />
            <span>var-device = <strong className="text-on-surface">{selectedDevice}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>from = <strong className="text-on-surface">{TIME_RANGES.find(t => t.value === timeRange)?.grafanaValue || 'now-24h'}</strong></span>
          </div>
        </div>
      </Card>

      {/* Dashboard Content */}
      {!isConfigured ? (
        <SetupPrompt onGoToSettings={handleGoToSettings} />
      ) : (
        <Card className="overflow-hidden">
          {/* Dashboard Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-3">
              <selectedDashboard.icon size={18} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold text-on-surface">{selectedDashboard.name}</h2>
                <p className="text-xs text-on-surface-variant">{selectedDashboard.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <Clock size={12} />
              <span>{TIME_RANGES.find(t => t.value === timeRange)?.label}</span>
              <span className="mx-1">·</span>
              <Network size={12} />
              <span>{selectedDevice}</span>
            </div>
          </div>

          {/* Embedded iframe area with mock panels */}
          <div className="p-5">
            {/* In production, this would be:
                <iframe
                  src={`${grafanaUrl}/d-solo/${dashboardUid}?orgId=1&from=...&to=...&panelId=1&var-device=...`}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  title={selectedDashboard.name}
                />
            */}

            {/* Mock Grafana panels grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {selectedDashboard.panels.map((panel, i) => (
                <MockPanel
                  key={`${selectedDashboard.id}-panel-${i}`}
                  panel={panel}
                  colorScheme={PANEL_COLORS[i % PANEL_COLORS.length]}
                />
              ))}
            </div>

            {/* Bottom row: 2-wide + 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-2">
                <div className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest overflow-hidden">
                  <div className="px-3 py-2 bg-surface-container border-b border-outline-variant/50 flex items-center justify-between">
                    <p className="text-xs font-semibold text-on-surface">Combined Metrics Overview</p>
                    <span className="text-[10px] text-on-surface-variant">All interfaces</span>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <MockStatValue value="42.8" color="#003d7c" unit="Mbps" />
                      <MockStatValue value="128.3" color="#1a7c3b" unit="Mbps" />
                      <MockStatValue value="99.2" color="#7c5800" unit="%" />
                    </div>
                    <div className="flex gap-2">
                      <MockSparkline color="#003d7c" />
                      <MockSparkline color="#1a7c3b" />
                    </div>
                  </div>
                </div>
              </div>
              <MockPanel
                panel="Quick Stats"
                colorScheme={PANEL_COLORS[4]}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Dashboard Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {dashboards.map(db => (
          <button
            key={db.id}
            onClick={() => setSelectedDashboardId(db.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              db.id === selectedDashboardId
                ? 'bg-primary/5 border-primary/30 shadow-sm'
                : 'bg-surface-container-low border-outline-variant hover:border-primary/20 hover:bg-surface-container'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                db.id === selectedDashboardId ? 'bg-primary/15' : 'bg-surface-container-high'
              }`}>
                <db.icon size={18} className={db.id === selectedDashboardId ? 'text-primary' : 'text-on-surface-variant'} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${db.id === selectedDashboardId ? 'text-primary' : 'text-on-surface'}`}>
                  {db.name}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{db.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-on-surface-variant">{db.panels.length} panels</span>
                  {db.isCustom && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-medium">Custom</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Add Dashboard Modal */}
      <AddDashboardModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDashboard}
      />
    </div>
  )
}
