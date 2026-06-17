import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Play, Square, Wifi, Route, Globe, Gauge, Network, Shield,
  FileText, Terminal, Pause, PlayCircle, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, XCircle, Clock, Zap, Eye, Send,
  History, ToggleLeft, ToggleRight, Bot, Lightbulb, Copy, Check,
  ArrowDownUp, Radio, Activity
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Textarea } from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { mockDevices, mockInterfaces } from '../mock/data'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockLogs = [
  { id: 1, time: '13:05:42.100', topic: 'firewall', level: 'info', message: 'BLOCKED forward: in:ether1 out:sfp-sfpplus1 src-mac aa:bb:cc:dd:ee:ff proto TCP 10.0.0.15:49832->104.16.249.249:443' },
  { id: 2, time: '13:05:41.890', topic: 'dhcp', level: 'info', message: 'DHCP assigned 192.168.1.105 to aa:bb:cc:11:22:33' },
  { id: 3, time: '13:05:41.200', topic: 'bgp', level: 'warning', message: 'BGP peer 10.0.0.2 (AS65002) state changed to Established' },
  { id: 4, time: '13:05:40.500', topic: 'system', level: 'info', message: 'user admin logged in from 10.0.0.100 via web' },
  { id: 5, time: '13:05:39.800', topic: 'firewall', level: 'info', message: 'BLOCKED input: in:ether1 src-mac ff:ee:dd:cc:bb:aa proto UDP 192.168.1.50:1900->239.255.255.250:1900' },
  { id: 6, time: '13:05:38.100', topic: 'system', level: 'warning', message: 'interface ether3 link down (cable disconnected)' },
  { id: 7, time: '13:05:37.400', topic: 'bgp', level: 'info', message: 'BGP update received from 10.0.0.2: 203.0.113.0/24 via AS65002' },
  { id: 8, time: '13:05:36.900', topic: 'dhcp', level: 'info', message: 'DHCP released 192.168.1.101 from aa:bb:cc:44:55:66' },
  { id: 9, time: '13:05:35.200', topic: 'firewall', level: 'error', message: 'IPsec phase1 negotiation failed: no proposal chosen from 198.51.100.1' },
  { id: 10, time: '13:05:34.600', topic: 'system', level: 'info', message: 'backup saved: auto-backup-20260616-130534.rsc (18 KB)' },
  { id: 11, time: '13:05:33.100', topic: 'bgp', level: 'info', message: 'BGP keepalive sent to 10.0.0.2' },
  { id: 12, time: '13:05:32.800', topic: 'dhcp', level: 'warning', message: 'DHCP pool 192.168.1.0/24 90% full (180/200 leases)' },
  { id: 13, time: '13:05:31.000', topic: 'system', level: 'info', message: 'NTP synchronized to 10.0.0.2, offset -2.3ms' },
  { id: 14, time: '13:05:30.500', topic: 'firewall', level: 'info', message: 'ACCEPT forward: in:bridge1 out:ether2 proto TCP 192.168.1.105:54321->8.8.8.8:443' },
  { id: 15, time: '13:05:29.200', topic: 'system', level: 'error', message: 'critical temperature on board: 78°C (threshold 75°C)' },
]

const mockArpTable = [
  { ip: '10.0.0.2', mac: 'aa:bb:cc:11:22:33', interface: 'ether1', timeout: '2m 15s', type: 'dynamic' },
  { ip: '10.0.0.100', mac: 'dd:ee:ff:aa:bb:cc', interface: 'ether1', timeout: '4m 30s', type: 'dynamic' },
  { ip: '192.168.1.1', mac: '11:22:33:44:55:66', interface: 'bridge1', timeout: '1m 45s', type: 'dynamic' },
  { ip: '192.168.1.105', mac: 'aa:bb:cc:11:22:33', interface: 'bridge1', timeout: '3m 10s', type: 'dynamic' },
  { ip: '192.168.1.101', mac: 'aa:bb:cc:44:55:66', interface: 'bridge1', timeout: '—', type: 'static' },
  { ip: '10.0.1.2', mac: 'ff:ee:dd:cc:bb:aa', interface: 'ether2', timeout: '5m 00s', type: 'dynamic' },
  { ip: '10.10.0.50', mac: 'cc:dd:ee:ff:00:11', interface: 'wlan1', timeout: '0m 45s', type: 'dynamic' },
  { ip: '10.10.0.51', mac: 'cc:dd:ee:ff:00:22', interface: 'wlan1', timeout: '1m 20s', type: 'dynamic' },
]

const mockRoutes = [
  { destination: '0.0.0.0/0', gateway: '10.0.0.2', distance: '1', scope: '30', protocol: 'BGP', active: true },
  { destination: '10.0.0.0/24', gateway: '0.0.0.0', distance: '0', scope: '10', protocol: 'Connected', active: true },
  { destination: '10.0.1.0/24', gateway: '0.0.0.0', distance: '0', scope: '10', protocol: 'Connected', active: true },
  { destination: '10.10.0.0/24', gateway: '0.0.0.0', distance: '0', scope: '10', protocol: 'Connected', active: true },
  { destination: '192.168.1.0/24', gateway: '0.0.0.0', distance: '0', scope: '10', protocol: 'Connected', active: true },
  { destination: '203.0.113.0/24', gateway: '10.0.0.2', distance: '20', scope: '40', protocol: 'BGP', active: true },
  { destination: '198.51.100.0/24', gateway: '10.0.0.2', distance: '20', scope: '40', protocol: 'BGP', active: true },
  { destination: '172.16.0.0/16', gateway: '10.0.1.2', distance: '10', scope: '30', protocol: 'OSPF', active: true },
  { destination: '10.0.5.0/24', gateway: '10.0.1.2', distance: '110', scope: '30', protocol: 'OSPF', active: false },
  { destination: '192.168.100.0/24', gateway: '10.0.0.2', distance: '200', scope: '40', protocol: 'Static', active: true },
]

const mockConnections = [
  { protocol: 'TCP', src: '192.168.1.105:54321', dst: '8.8.8.8:443', state: 'ESTABLISHED', timeout: '23h 15m' },
  { protocol: 'TCP', src: '192.168.1.105:54322', dst: '104.16.249.249:443', state: 'TIME_WAIT', timeout: '0m 12s' },
  { protocol: 'TCP', src: '10.0.0.1:179', dst: '10.0.0.2:49812', state: 'ESTABLISHED', timeout: '1h 30m' },
  { protocol: 'TCP', src: '10.0.0.1:443', dst: '10.0.0.100:58234', state: 'ESTABLISHED', timeout: '15m 00s' },
  { protocol: 'UDP', src: '10.0.0.1:123', dst: '10.0.0.2:123', state: '—', timeout: '0m 45s' },
  { protocol: 'TCP', src: '192.168.1.1:53', dst: '192.168.1.105:65001', state: 'ESTABLISHED', timeout: '0m 30s' },
  { protocol: 'TCP', src: '10.0.0.1:22', dst: '10.0.0.100:49876', state: 'ESTABLISHED', timeout: '45m 00s' },
  { protocol: 'ICMP', src: '10.0.0.1', dst: '8.8.8.8', state: '—', timeout: '0m 02s' },
  { protocol: 'TCP', src: '10.0.0.1:443', dst: '198.51.100.1:52000', state: 'SYN_SENT', timeout: '0m 05s' },
  { protocol: 'UDP', src: '192.168.1.50:1900', dst: '239.255.255.250:1900', state: '—', timeout: '0m 00s' },
]

const mockAiResponses = {
  'bgp': {
    rootCause: 'BGP session instability detected. The peer 10.0.0.2 (AS65002) is flapping between Idle and Established states. This is commonly caused by MTU mismatch, hold timer misconfiguration, or intermittent link issues on ether1.',
    severity: 'high',
    suggestions: [
      { command: '/routing bgp peer print detail where name="peer1"', label: 'Check BGP peer config' },
      { command: '/interface ethernet monitor ether1 once', label: 'Check ether1 link status' },
      { command: '/tool sniffer quick interface=ether1 port=179', label: 'Sniff BGP traffic on ether1' },
      { command: '/log print where topics~"bgp" order-by-time', label: 'Review BGP log history' },
    ]
  },
  'cpu': {
    rootCause: 'High CPU usage (78%) on mt-pppoe-con correlates with PPPoE session count approaching limit (480/500). The routing table has 15,000+ entries causing slow path processing. IPsec phase1 failures are also consuming CPU cycles.',
    severity: 'critical',
    suggestions: [
      { command: '/ppp active print count-only', label: 'Count active PPPoE sessions' },
      { command: '/ip route print count-only', label: 'Count routing table entries' },
      { command: '/system resource print', label: 'Check system resource usage' },
      { command: '/ip ipsec policy print', label: 'Check IPsec policies' },
    ]
  },
  'default': {
    rootCause: 'Multiple issues detected: (1) Interface ether3 is down — possible cable disconnection. (2) DHCP pool at 90% capacity. (3) Board temperature critical at 78°C. (4) IPsec negotiation failing with peer 198.51.100.1.',
    severity: 'medium',
    suggestions: [
      { command: '/interface print where disabled=no', label: 'List active interfaces' },
      { command: '/ip dhcp-server lease print', label: 'Check DHCP leases' },
      { command: '/system health print', label: 'Check system health' },
      { command: '/ip ipsec active-peers print', label: 'Check IPsec peers' },
    ]
  }
}

const logTopics = ['all', 'firewall', 'bgp', 'dhcp', 'system']

const tools = [
  { id: 'ping', icon: Wifi, label: 'Ping', description: 'Test connectivity to target' },
  { id: 'traceroute', icon: Route, label: 'Traceroute', description: 'Hop-by-hop path analysis' },
  { id: 'dns', icon: Globe, label: 'DNS Lookup', description: 'Resolve hostname' },
  { id: 'bandwidth', icon: Gauge, label: 'Bandwidth Test', description: 'Test throughput' },
  { id: 'torch', icon: Network, label: 'Torch', description: 'Real-time traffic capture' },
  { id: 'ports', icon: Shield, label: 'Port Scan', description: 'Check open ports' },
]

const tabs = [
  { id: 'tools', label: 'Tools', icon: Zap },
  { id: 'logs', label: 'Log Viewer', icon: FileText },
  { id: 'arp', label: 'ARP Table', icon: ArrowDownUp },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'connections', label: 'Connections', icon: Activity },
  { id: 'interfaces', label: 'Interfaces', icon: Network },
  { id: 'scripts', label: 'Scripts', icon: Terminal },
  { id: 'ai', label: 'AI Troubleshooter', icon: Bot },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getLevelColor(level) {
  switch (level) {
    case 'error': return 'text-error'
    case 'warning': return 'text-warning'
    case 'info': return 'text-on-surface-variant'
    default: return 'text-on-surface-variant'
  }
}

function getLevelBadge(level) {
  switch (level) {
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'default'
  }
}

function getTopicColor(topic) {
  switch (topic) {
    case 'firewall': return 'bg-error-container text-on-error-container'
    case 'bgp': return 'bg-info-container text-on-info-container'
    case 'dhcp': return 'bg-success-container text-on-success-container'
    case 'system': return 'bg-warning-container text-on-warning-container'
    default: return 'bg-surface-container-high text-on-surface-variant'
  }
}

function getStatusColor(status) {
  if (status === 'up' || status === 'running' || status === 'ESTABLISHED') return 'text-success'
  if (status === 'down' || status === 'offline') return 'text-error'
  if (status === 'SYN_SENT' || status === 'TIME_WAIT') return 'text-warning'
  return 'text-on-surface-variant'
}

function getStatusBadge(status) {
  if (status === 'up' || status === 'running' || status === 'ESTABLISHED') return 'online'
  if (status === 'down' || status === 'offline') return 'offline'
  if (status === 'SYN_SENT' || status === 'TIME_WAIT') return 'warning'
  return 'default'
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TroubleshootPanel() {
  const { id } = useParams()
  const device = mockDevices.find(d => d.id === id) || mockDevices[0]
  const isProduction = device.tags?.includes('production')

  const [activeTab, setActiveTab] = useState('tools')
  const [activeTool, setActiveTool] = useState('ping')
  const [target, setTarget] = useState('8.8.8.8')
  const [output, setOutput] = useState('')

  // Log viewer state
  const [logFilter, setLogFilter] = useState('all')
  const [logPaused, setLogPaused] = useState(false)
  const [visibleLogs, setVisibleLogs] = useState(mockLogs.slice(0, 8))
  const logEndRef = useRef(null)
  const logContainerRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const logIndexRef = useRef(8)

  // Script executor state
  const [scriptCmd, setScriptCmd] = useState('')
  const [scriptOutput, setScriptOutput] = useState('')
  const [scriptHistory, setScriptHistory] = useState([
    { cmd: '/interface print', time: '13:02:15', status: 'success' },
    { cmd: '/ip route print where active=yes', time: '13:01:42', status: 'success' },
    { cmd: '/system resource print', time: '13:00:10', status: 'success' },
  ])
  const [showHistory, setShowHistory] = useState(false)
  const [dryRun, setDryRun] = useState(false)
  const [approvalPending, setApprovalPending] = useState(false)
  const [approvalGranted, setApprovalGranted] = useState(false)

  // AI Troubleshooter state
  const [symptoms, setSymptoms] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(null)

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    logs: true, arp: true, routes: true, connections: true, interfaces: true, scripts: true, ai: true
  })

  // ─── Log streaming simulation ────────────────────────────────────────────

  useEffect(() => {
    if (logPaused || activeTab !== 'logs') return
    const interval = setInterval(() => {
      const newLog = mockLogs[logIndexRef.current % mockLogs.length]
      const logWithId = { ...newLog, id: Date.now(), time: new Date().toLocaleTimeString('en-GB', { hour12:0 }) + '.' + String(Math.floor(Math.random() * 1000)).padStart(3, '0') }
      setVisibleLogs(prev => {
        const updated = [...prev, logWithId]
        return updated.slice(-50) // keep last 50
      })
      logIndexRef.current++
    }, 2000)
    return () => clearInterval(interval)
  }, [logPaused, activeTab])

  useEffect(() => {
    if (autoScroll && logEndRef.current && activeTab === 'logs') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [visibleLogs, autoScroll, activeTab])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const runTool = () => {
    const toolOutputs = {
      ping: `PING ${target} (${target}) 56(84) bytes of data.\n64 bytes from ${target}: icmp_seq=1 ttl=56 time=12.3 ms\n64 bytes from ${target}: icmp_seq=2 ttl=56 time=11.8 ms\n64 bytes from ${target}: icmp_seq=3 ttl=56 time=12.1 ms\n64 bytes from ${target}: icmp_seq=4 ttl=56 time=11.9 ms\n\n--- ${target} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss\nround-trip min/avg/max/stddev = 11.8/12.0/12.3/0.2 ms`,
      traceroute: `traceroute to ${target}, 30 hops max, 60 byte packets\n 1  10.0.0.2 (10.0.0.2)  1.234 ms  1.012 ms  0.987 ms\n 2  10.1.0.1 (10.1.0.1)  5.432 ms  5.100 ms  5.234 ms\n 3  203.0.113.1 (203.0.113.1)  10.234 ms  10.500 ms  10.123 ms\n 4  * * *\n 5  ${target} (${target})  12.345 ms  12.100 ms  12.234 ms`,
      dns: `Server:  8.8.8.8\nAddress: 8.8.8.8#53\n\nNon-authoritative answer:\nName:    ${target === '8.8.8.8' ? 'dns.google' : target}\nAddress: ${target === '8.8.8.8' ? '8.8.8.8' : '151.101.1.140'}\nName:    ${target === '8.8.8.8' ? 'dns.google' : target}\nAddress: ${target === '8.8.8.8' ? '8.8.4.4' : '2a04:4e42::732'}`,
      bandwidth: `Testing bandwidth to ${target}...\n\nDownload:  94.2 Mbit/s\nUpload:    47.8 Mbit/s\nLatency:   12.3 ms\nJitter:    1.2 ms\nLoss:      0.0%\n\nTest duration: 10.0s\nDirection: bidirectional`,
      torch: `Torch on ${device.hostname} - Target: ${target}\n\n  Src-address          Dst-address          Tx-packets  Rx-packets  Tx-bytes    Rx-bytes\n  192.168.1.105        8.8.8.8              1,234       2,456       125 KB      1.2 MB\n  192.168.1.105        104.16.249.249       890         1,567       89 KB       890 KB\n  10.0.0.1             10.0.0.2             456         456         45 KB       45 KB\n  192.168.1.1          192.168.1.105        234         123         23 KB       12 KB`,
      ports: `Port scan on ${target}\n\nPORT      STATE    SERVICE\n22/tcp    open     ssh\n53/tcp    open     domain\n80/tcp    open     http\n443/tcp   open     https\n8291/tcp  open     winbox\n8728/tcp  open     api\n8729/tcp  open     api-ssl\n\n6 open ports found. Scan completed in 2.3s.`,
    }
    setOutput(toolOutputs[activeTool] || toolOutputs.ping)
  }

  const executeScript = () => {
    if (!scriptCmd.trim()) return
    if (isProduction && !approvalGranted) {
      setApprovalPending(true)
      return
    }
    if (dryRun) {
      setScriptOutput(`[DRY RUN] Command would execute on ${device.hostname}:\n> ${scriptCmd}\n\nNo changes were made.`)
    } else {
      const outputs = {
        '/interface print': ' 0  R  ether1        ether                   running  aa:bb:cc:dd:ee:ff\n 1  R  ether2        ether                   running  aa:bb:cc:dd:ee:00\n 2     ether3        ether                   disabled aa:bb:cc:dd:ee:01\n 3  R  sfp-sfpplus1  ether                   running  aa:bb:cc:dd:ee:02\n 4  R  bridge1       bridge                  running\n 5  R  wlan1         wireless                running  aa:bb:cc:dd:ee:03',
        '/ip route print': '#      DST-ADDRESS        PREF-SRC        GATEWAY         DISTANCE\n  A S  0.0.0.0/0                          10.0.0.2        1\n  ADC  10.0.0.0/24        10.0.0.1        ether1          0\n  ADC  10.0.1.0/24        10.0.1.1        ether2          0\n  ADC  192.168.1.0/24     192.168.1.1     bridge1         0',
        '/system resource print': '                   uptime: 45d 12h 30m 15s\n                  version: 7.14.3 (stable)\n               board-name: CCR2116-12G-4S+\n             architecture: tile\n                  cpu: ARMv8\n            cpu-count: 16\n                cpu-load: 12%\n          free-memory: 2048 MiB\n         total-memory: 4096 MiB\n          free-hdd-space: 238 MiB\n         total-hdd-space: 256 MiB\n                  write-sect-since-reboot: 1,234,567\n                  write-sect-total: 45,678,901',
      }
      setScriptOutput(outputs[scriptCmd.trim()] || `> ${scriptCmd}\n\nCommand executed successfully on ${device.hostname}.\n\n[No output returned]`)
    }
    setScriptHistory(prev => [{ cmd: scriptCmd, time: new Date().toLocaleTimeString('en-GB', { hour12: 12 }).slice(0, 8), status: 'success' }, ...prev].slice(0, 20))
    setApprovalPending(false)
    setApprovalGranted(false)
  }

  const runAiAnalysis = () => {
    if (!symptoms.trim()) return
    setAiLoading(true)
    setAiResponse(null)
    setTimeout(() => {
      const lower = symptoms.toLowerCase()
      let key = 'default'
      if (lower.includes('bgp') || lower.includes('peer') || lower.includes('flap')) key = 'bgp'
      else if (lower.includes('cpu') || lower.includes('high load') || lower.includes('slow')) key = 'cpu'
      setAiResponse(mockAiResponses[key])
      setAiLoading(false)
    }, 1500)
  }

  const copyCommand = (cmd) => {
    navigator.clipboard?.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  const executeAiCommand = (cmd) => {
    setScriptCmd(cmd)
    setActiveTab('scripts')
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const filteredLogs = logFilter === 'all' ? visibleLogs : visibleLogs.filter(l => l.topic === logFilter)

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/devices/${device.id}`} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
            <ArrowLeft size={14} /> Back
          </Link>
          <span className="text-on-surface-variant">/</span>
          <h1 className="text-2xl font-bold text-on-surface">Troubleshoot</h1>
          <Badge variant={device.status === 'online' ? 'online' : device.status === 'warning' ? 'warning' : 'offline'}>{device.hostname}</Badge>
        </div>
        <Badge variant={isProduction ? 'warning' : 'info'}>
          {isProduction ? '⚡ Production' : '🧪 Lab'}
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 border border-outline-variant overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tools Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setOutput(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                  activeTool === tool.id ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <tool.icon size={18} />
                <div>
                  <p className="font-medium">{tool.label}</p>
                  <p className="text-xs opacity-70">{tool.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{tools.find(t => t.id === activeTool)?.label}</CardTitle>
              </CardHeader>
              <div className="flex gap-3">
                <Input placeholder="Target IP or hostname" value={target} onChange={e => setTarget(e.target.value)} className="flex-1" />
                <Button onClick={runTool}><Play size={16} /> Run</Button>
              </div>
            </Card>
            {output && (
              <Card>
                <CardHeader><CardTitle>Output</CardTitle></CardHeader>
                <pre className="bg-surface-container p-4 rounded-lg text-sm text-on-surface font-mono whitespace-pre-wrap overflow-x-auto">{output}</pre>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── Log Viewer Tab ────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>Live Log Viewer</CardTitle>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${logPaused ? 'bg-warning animate-none' : 'bg-success animate-pulse'}`} />
                <span className="text-xs text-on-surface-variant">{logPaused ? 'Paused' : 'Live'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLogPaused(!logPaused)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant" title={logPaused ? 'Resume' : 'Pause'}>
                {logPaused ? <PlayCircle size={18} /> : <Pause size={18} />}
              </button>
              <button onClick={() => setAutoScroll(!autoScroll)} className={`p-1.5 rounded-lg hover:bg-surface-container ${autoScroll ? 'text-primary' : 'text-on-surface-variant'}`} title="Auto-scroll">
                <Eye size={18} />
              </button>
              <button onClick={() => setVisibleLogs([])} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant" title="Clear">
                <Square size={14} />
              </button>
            </div>
          </CardHeader>

          {/* Topic Filters */}
          <div className="flex gap-2 mb-4">
            {logTopics.map(topic => (
              <button
                key={topic}
                onClick={() => setLogFilter(topic)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  logFilter === topic
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {topic === 'all' ? 'All' : topic.charAt(0).toUpperCase() + topic.slice(1)}
                {topic !== 'all' && (
                  <span className="ml-1 opacity-70">
                    ({visibleLogs.filter(l => l.topic === topic).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Log Entries */}
          <div ref={logContainerRef} className="bg-surface-container rounded-lg border border-outline-variant max-h-[500px] overflow-y-auto font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No log entries{logFilter !== 'all' && ` for topic: ${logFilter}`}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-surface-container-high text-on-surface-variant text-xs">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium w-28">Time</th>
                    <th className="text-left px-3 py-2 font-medium w-10"></th>
                    <th className="text-left px-3 py-2 font-medium w-20">Topic</th>
                    <th className="text-left px-3 py-2 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="border-t border-outline-variant/30 hover:bg-surface-container-high/50">
                      <td className="px-3 py-1.5 text-on-surface-variant">{log.time}</td>
                      <td className="px-3 py-1.5">
                        {log.level === 'error' && <XCircle size={12} className="text-error" />}
                        {log.level === 'warning' && <AlertTriangle size={12} className="text-warning" />}
                        {log.level === 'info' && <CheckCircle size={12} className="text-on-surface-variant/50" />}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTopicColor(log.topic)}`}>
                          {log.topic}
                        </span>
                      </td>
                      <td className={`px-3 py-1.5 ${getLevelColor(log.level)}`}>{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div ref={logEndRef} />
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            Showing {filteredLogs.length} entries · {logPaused ? 'Streaming paused' : 'Streaming live'} · Auto-scroll {autoScroll ? 'on' : 'off'}
          </p>
        </Card>
      )}

      {/* ─── ARP Table Tab ─────────────────────────────────────────────── */}
      {activeTab === 'arp' && (
        <Card>
          <button onClick={() => toggleSection('arp')} className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>ARP Table</CardTitle>
                <Badge variant="info">{mockArpTable.length} entries</Badge>
              </div>
              {expandedSections.arp ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
            </CardHeader>
          </button>
          {expandedSections.arp && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-on-surface-variant text-xs">
                    <th className="text-left px-4 py-3 font-medium">IP Address</th>
                    <th className="text-left px-4 py-3 font-medium">MAC Address</th>
                    <th className="text-left px-4 py-3 font-medium">Interface</th>
                    <th className="text-left px-4 py-3 font-medium">Timeout</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {mockArpTable.map((entry, i) => (
                    <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container-high/30">
                      <td className="px-4 py-2.5 font-mono text-on-surface">{entry.ip}</td>
                      <td className="px-4 py-2.5 font-mono text-on-surface-variant">{entry.mac}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-medium text-on-surface-variant">{entry.interface}</span>
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">{entry.timeout}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={entry.type === 'static' ? 'warning' : 'info'}>{entry.type}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── Routing Table Tab ─────────────────────────────────────────── */}
      {activeTab === 'routes' && (
        <Card>
          <button onClick={() => toggleSection('routes')} className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Routing Table</CardTitle>
                <Badge variant="info">{mockRoutes.length} routes</Badge>
                <Badge variant="success">{mockRoutes.filter(r => r.active).length} active</Badge>
              </div>
              {expandedSections.routes ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
            </CardHeader>
          </button>
          {expandedSections.routes && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-on-surface-variant text-xs">
                    <th className="text-left px-4 py-3 font-medium w-8"></th>
                    <th className="text-left px-4 py-3 font-medium">Destination</th>
                    <th className="text-left px-4 py-3 font-medium">Gateway</th>
                    <th className="text-left px-4 py-3 font-medium">Protocol</th>
                    <th className="text-left px-4 py-3 font-medium">Distance</th>
                    <th className="text-left px-4 py-3 font-medium">Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRoutes.map((route, i) => (
                    <tr key={i} className={`border-b border-outline-variant/30 hover:bg-surface-container-high/30 ${!route.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        {route.active ? (
                          <span className="text-success text-xs">●</span>
                        ) : (
                          <span className="text-on-surface-variant/40 text-xs">○</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-on-surface">{route.destination}</td>
                      <td className="px-4 py-2.5 font-mono text-on-surface-variant">{route.gateway}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          route.protocol === 'BGP' ? 'bg-info-container text-on-info-container' :
                          route.protocol === 'OSPF' ? 'bg-success-container text-on-success-container' :
                          route.protocol === 'Connected' ? 'bg-surface-container-high text-on-surface-variant' :
                          'bg-warning-container text-on-warning-container'
                        }`}>
                          {route.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant">{route.distance}</td>
                      <td className="px-4 py-2.5 text-on-surface-variant">{route.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── Active Connections Tab ────────────────────────────────────── */}
      {activeTab === 'connections' && (
        <Card>
          <button onClick={() => toggleSection('connections')} className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Active Connections</CardTitle>
                <Badge variant="info">{mockConnections.length} connections</Badge>
                <Badge variant="success">{mockConnections.filter(c => c.state === 'ESTABLISHED').length} established</Badge>
              </div>
              {expandedSections.connections ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
            </CardHeader>
          </button>
          {expandedSections.connections && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-on-surface-variant text-xs">
                    <th className="text-left px-4 py-3 font-medium">Protocol</th>
                    <th className="text-left px-4 py-3 font-medium">Source</th>
                    <th className="text-left px-4 py-3 font-medium">Destination</th>
                    <th className="text-left px-4 py-3 font-medium">State</th>
                    <th className="text-left px-4 py-3 font-medium">Timeout</th>
                  </tr>
                </thead>
                <tbody>
                  {mockConnections.map((conn, i) => (
                    <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container-high/30">
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          conn.protocol === 'TCP' ? 'bg-info-container text-on-info-container' :
                          conn.protocol === 'UDP' ? 'bg-success-container text-on-success-container' :
                          'bg-warning-container text-on-warning-container'
                        }`}>
                          {conn.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-on-surface text-xs">{conn.src}</td>
                      <td className="px-4 py-2.5 font-mono text-on-surface text-xs">{conn.dst}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${getStatusColor(conn.state)}`}>
                          {conn.state || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-on-surface-variant text-xs">{conn.timeout}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─── Interface Snapshot Tab ────────────────────────────────────── */}
      {activeTab === 'interfaces' && (
        <Card>
          <button onClick={() => toggleSection('interfaces')} className="w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Interface Snapshot</CardTitle>
                <Badge variant="success">{mockInterfaces.filter(i => i.status === 'up').length} up</Badge>
                <Badge variant="offline">{mockInterfaces.filter(i => i.status === 'down').length} down</Badge>
              </div>
              {expandedSections.interfaces ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
            </CardHeader>
          </button>
          {expandedSections.interfaces && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {mockInterfaces.map((iface, i) => (
                <div key={i} className={`rounded-lg border p-4 transition-colors ${
                  iface.status === 'up'
                    ? 'border-success/30 bg-success-container/10'
                    : 'border-outline-variant bg-surface-container'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Radio size={14} className={iface.status === 'up' ? 'text-success' : 'text-on-surface-variant/40'} />
                      <span className="font-mono font-medium text-on-surface text-sm">{iface.name}</span>
                    </div>
                    <Badge variant={iface.status === 'up' ? 'online' : 'offline'}>{iface.status}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Type</span>
                      <span className="text-on-surface font-medium">{iface.type}</span>
                    </div>
                    {iface.ip !== '—' && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">IP</span>
                        <span className="text-on-surface font-mono">{iface.ip}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">TX</span>
                      <span className="text-on-surface font-mono">{iface.tx}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">RX</span>
                      <span className="text-on-surface font-mono">{iface.rx}</span>
                    </div>
                    {iface.errors > 0 && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Errors</span>
                        <span className="text-error font-medium">{iface.errors}</span>
                      </div>
                    )}
                    {/* Traffic bar */}
                    {iface.txBytes > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-on-surface-variant mb-1">
                          <span>TX Load</span>
                          <span>{formatBytes(iface.txBytes)}/s</span>
                        </div>
                        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, (iface.txBytes / 1200000000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Script Executor Tab ───────────────────────────────────────── */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          <Card>
            <button onClick={() => toggleSection('scripts')} className="w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Script Executor</CardTitle>
                  {isProduction && (
                    <Badge variant="warning">⚠ Approval Required</Badge>
                  )}
                </div>
                {expandedSections.scripts ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
              </CardHeader>
            </button>
            {expandedSections.scripts && (
              <>
                <p className="text-sm text-on-surface-variant mb-3">
                  Run RouterOS commands directly on <span className="font-medium text-on-surface">{device.hostname}</span> ({device.ip})
                </p>

                {/* Approval Warning */}
                {isProduction && !approvalGranted && (
                  <div className="mb-4 p-3 rounded-lg bg-warning-container/30 border border-warning/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-on-surface">Production Device</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          This device is tagged as production. Commands will require approval before execution.
                          {approvalPending && ' Click "Approve" to proceed.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Command Input */}
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-surface-container rounded-l-lg border border-outline-variant border-r-0 text-on-surface-variant font-mono text-sm">
                    &gt;
                  </span>
                  <input
                    type="text"
                    value={scriptCmd}
                    onChange={e => setScriptCmd(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && executeScript()}
                    className="flex-1 h-12 px-3 bg-surface-container-lowest rounded-r-lg border border-outline-variant text-base font-mono text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="/interface print where status=running"
                  />
                </div>

                {/* Controls */}
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Button onClick={executeScript} disabled={!scriptCmd.trim()}>
                    <Terminal size={14} /> Execute
                  </Button>
                  <Button
                    variant={dryRun ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDryRun(!dryRun)}
                  >
                    {dryRun ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    Dry Run
                  </Button>
                  {isProduction && !approvalGranted && (
                    <Button
                      variant={approvalPending ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        if (approvalPending) {
                          setApprovalGranted(true)
                          setApprovalPending(false)
                        } else {
                          setApprovalPending(true)
                        }
                      }}
                    >
                      {approvalPending ? '✓ Approve Execution' : 'Request Approval'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History size={14} /> History ({scriptHistory.length})
                  </Button>
                </div>

                {/* Command History */}
                {showHistory && (
                  <div className="mt-3 bg-surface-container rounded-lg border border-outline-variant">
                    <div className="px-3 py-2 border-b border-outline-variant text-xs font-medium text-on-surface-variant">
                      Recent Commands
                    </div>
                    {scriptHistory.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { setScriptCmd(item.cmd); setShowHistory(false) }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-container-high border-b border-outline-variant/20 last:border-0"
                      >
                        <code className="text-on-surface font-mono text-xs">{item.cmd}</code>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-on-surface-variant">{item.time}</span>
                          <CheckCircle size={12} className="text-success" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Output */}
                {scriptOutput && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-on-surface-variant">Output</span>
                      <button
                        onClick={() => copyCommand(scriptOutput)}
                        className="text-xs text-on-surface-variant hover:text-primary"
                      >
                        {copiedCmd === scriptOutput ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <pre className="bg-surface-container p-4 rounded-lg text-sm text-on-surface font-mono whitespace-pre-wrap overflow-x-auto">{scriptOutput}</pre>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* ─── AI Troubleshooter Tab ─────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <Card>
            <button onClick={() => toggleSection('ai')} className="w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>AI Troubleshooter</CardTitle>
                  <Badge variant="info">Beta</Badge>
                </div>
                {expandedSections.ai ? <ChevronUp size={18} className="text-on-surface-variant" /> : <ChevronDown size={18} className="text-on-surface-variant" />}
              </CardHeader>
            </button>
            {expandedSections.ai && (
              <>
                <p className="text-sm text-on-surface-variant mb-4">
                  Describe the symptoms or paste error messages. The AI will analyze the issue and suggest diagnostic commands.
                </p>

                {/* Symptom Input */}
                <div className="space-y-3">
                  <Textarea
                    label="Symptoms / Error Messages"
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    placeholder="e.g., BGP peer 10.0.0.2 keeps flapping between Idle and Established. Also seeing high CPU on mt-pppoe-con..."
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button onClick={runAiAnalysis} disabled={!symptoms.trim() || aiLoading}>
                      {aiLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Analyze
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSymptoms('BGP peer 10.0.0.2 keeps flapping. High CPU on mt-pppoe-con. IPsec negotiation failing with 198.51.100.1.')
                      }}
                    >
                      <Lightbulb size={14} /> Try Example
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* AI Response */}
          {aiResponse && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-primary" />
                  <CardTitle>Analysis Result</CardTitle>
                  <Badge variant={
                    aiResponse.severity === 'critical' ? 'error' :
                    aiResponse.severity === 'high' ? 'warning' :
                    'info'
                  }>
                    {aiResponse.severity} severity
                  </Badge>
                </div>
              </CardHeader>

              {/* Root Cause */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-on-surface mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-warning" />
                  Root Cause Analysis
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container p-4 rounded-lg">
                  {aiResponse.rootCause}
                </p>
              </div>

              {/* Suggested Commands */}
              <div>
                <h4 className="text-sm font-medium text-on-surface mb-3 flex items-center gap-2">
                  <Terminal size={14} className="text-primary" />
                  Suggested Diagnostic Commands
                </h4>
                <div className="space-y-2">
                  {aiResponse.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg group hover:bg-surface-container-high transition-colors">
                      <span className="text-xs text-on-surface-variant font-mono w-6">{i + 1}.</span>
                      <code className="flex-1 text-sm font-mono text-on-surface">{suggestion.command}</code>
                      <span className="text-xs text-on-surface-variant hidden sm:block">{suggestion.label}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyCommand(suggestion.command)}
                          className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                          title="Copy command"
                        >
                          {copiedCmd === suggestion.command ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={() => executeAiCommand(suggestion.command)}
                          className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                          title="Execute in Script Runner"
                        >
                          <Play size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
