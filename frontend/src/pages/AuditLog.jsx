import { useState, useMemo, useCallback } from 'react'
import {
  Search, Filter, X, Download, Clock, User, Server,
  ChevronDown, ChevronRight, Shield, FileText, Activity,
  ArrowRight, LogIn, Plus, Minus, Settings, Wifi, WifiOff,
  ClipboardList, Calendar, AlertCircle, CheckCircle, XCircle,
  Eye, LayoutList, ArrowUpDown
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { Select } from '../components/ui/Input'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
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

// ─── Action type configuration ──────────────────────────────────────────────

const ACTION_TYPES = [
  'login', 'logout', 'config_push', 'backup_create', 'backup_restore',
  'device_add', 'device_remove', 'device_reboot', 'firmware_upgrade',
  'user_add', 'user_remove', 'user_role_change', 'permission_change',
  'template_apply', 'bulk_import', 'export_config', 'api_call'
]

const ACTION_LABELS = {
  login: 'Login',
  logout: 'Logout',
  config_push: 'Config Push',
  backup_create: 'Backup Created',
  backup_restore: 'Backup Restored',
  device_add: 'Device Added',
  device_remove: 'Device Removed',
  device_reboot: 'Device Rebooted',
  firmware_upgrade: 'Firmware Upgrade',
  user_add: 'User Added',
  user_remove: 'User Removed',
  user_role_change: 'Role Changed',
  permission_change: 'Permission Changed',
  template_apply: 'Template Applied',
  bulk_import: 'Bulk Import',
  export_config: 'Config Exported',
  api_call: 'API Call',
}

const ACTION_ICONS = {
  login: LogIn,
  logout: LogIn,
  config_push: Settings,
  backup_create: ClipboardList,
  backup_restore: ClipboardList,
  device_add: Plus,
  device_remove: Minus,
  device_reboot: ArrowRight,
  firmware_upgrade: ArrowRight,
  user_add: User,
  user_remove: User,
  user_role_change: User,
  permission_change: Shield,
  template_apply: FileText,
  bulk_import: FileText,
  export_config: Download,
  api_call: Activity,
}

// ─── Mock audit log data ────────────────────────────────────────────────────

const generateMockAuditLog = () => {
  const now = Date.now()
  const users = [
    { name: 'Andi Wijaya', email: 'andi@mikrowize.id', role: 'Admin' },
    { name: 'Budi Santoso', email: 'budi@mikrowize.id', role: 'NetOps' },
    { name: 'Citra Dewi', email: 'citra@mikrowize.id', role: 'DevOps' },
    { name: 'Dimas Prasetyo', email: 'dimas@mikrowize.id', role: 'Operator' },
    { name: 'Eka Putri', email: 'eka@mikrowize.id', role: 'Viewer' },
  ]
  const devices = ['mt-core-01', 'mt-branch-02', 'mt-ap-lobby', 'mt-sw-floor3', 'mt-pppoe-con', 'mt-vpn-gw']
  const subnets = ['10.0.0.1', '10.0.1.1', '10.0.2.10', '10.0.3.1', '10.0.4.1']
  const sourceIPs = ['192.168.1.100', '192.168.1.101', '10.10.0.50', '10.10.0.51', '172.16.0.10']

  const makeEntry = (opts) => ({
    id: opts.id,
    timestamp: opts.timestamp,
    user: opts.user,
    action: opts.action,
    target: opts.target || null,
    result: opts.result || 'success',
    ip: opts.ip || sourceIPs[Math.floor(Math.random() * sourceIPs.length)],
    userAgent: opts.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    sessionId: opts.sessionId || `sess-${Math.random().toString(36).slice(2, 10)}`,
    payload: opts.payload || {},
  })

  return [
    // Authentication events
    makeEntry({
      id: 'AUD-001', timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      user: users[0], action: 'login', result: 'success', ip: '192.168.1.100',
      payload: { method: 'password', mfa: true, mfaMethod: 'totp', location: 'Jakarta, ID' },
    }),
    makeEntry({
      id: 'AUD-002', timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
      user: users[1], action: 'login', result: 'success', ip: '192.168.1.101',
      payload: { method: 'password', mfa: true, mfaMethod: 'totp', location: 'Surabaya, ID' },
    }),
    makeEntry({
      id: 'AUD-003', timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      user: { name: 'Unknown', email: 'admin@mikrowize.id', role: null }, action: 'login', result: 'fail', ip: '45.33.32.156',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      payload: { method: 'password', reason: 'Invalid password', attempts: 3, failedAttempts: ['password1', 'password2'] },
    }),
    makeEntry({
      id: 'AUD-004', timestamp: new Date(now - 22 * 60 * 1000).toISOString(),
      user: users[2], action: 'login', result: 'success', ip: '10.10.0.50',
      payload: { method: 'saml', mfa: false, provider: 'Okta', location: 'Jakarta, ID' },
    }),
    makeEntry({
      id: 'AUD-005', timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
      user: users[1], action: 'logout', result: 'success', ip: '192.168.1.101',
      payload: { reason: 'user_initiated', sessionDuration: '4h 22m' },
    }),
    makeEntry({
      id: 'AUD-200', timestamp: new Date(now - 35 * 60 * 1000).toISOString(),
      user: { name: 'Unknown', email: 'root@mikrowize.id', role: null }, action: 'login', result: 'fail', ip: '103.21.44.100',
      userAgent: 'python-requests/2.31.0',
      payload: { method: 'api_key', reason: 'API key revoked', revokedAt: '2026-06-14T00:00:00Z' },
    }),

    // Device management
    makeEntry({
      id: 'AUD-010', timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      user: users[0], action: 'device_add', target: 'mt-ap-lobby', result: 'success', ip: '192.168.1.100',
      payload: {
        newDevice: { hostname: 'mt-ap-lobby', ip: '10.0.2.10', model: 'cAP ac', site: 'DC Jakarta' },
        discoveryMethod: 'snmp_scan', autoProvisioned: true,
      },
    }),
    makeEntry({
      id: 'AUD-011', timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
      user: users[0], action: 'device_remove', target: 'mt-branch-old-01', result: 'success', ip: '192.168.1.100',
      payload: {
        removedDevice: { hostname: 'mt-branch-old-01', ip: '10.0.5.1', model: 'hAP ac2', site: 'Branch Denpasar' },
        reason: 'decommissioned', backupRetained: true, backupPath: '/backups/archive/mt-branch-old-01_2026-06-16.tar.gz',
      },
    }),
    makeEntry({
      id: 'AUD-012', timestamp: new Date(now - 90 * 60 * 1000).toISOString(),
      user: users[1], action: 'device_reboot', target: 'mt-sw-floor3', result: 'success', ip: '192.168.1.101',
      payload: { reason: 'scheduled_maintenance', delay: 30, notifyUsers: true, beforeReboot: { uptime: '90d 2h', cpu: 3 } },
    }),
    makeEntry({
      id: 'AUD-013', timestamp: new Date(now - 120 * 60 * 1000).toISOString(),
      user: users[2], action: 'firmware_upgrade', target: 'mt-pppoe-con', result: 'success', ip: '10.10.0.50',
      payload: {
        fromVersion: '7.12.1', toVersion: '7.14.3', method: 'webfig',
        packagesUpdated: ['system', 'routing', 'ppp', 'security'], requiresReboot: true,
      },
    }),
    makeEntry({
      id: 'AUD-014', timestamp: new Date(now - 150 * 60 * 1000).toISOString(),
      user: users[1], action: 'firmware_upgrade', target: 'mt-core-01', result: 'fail', ip: '192.168.1.101',
      payload: {
        fromVersion: '7.14.3', toVersion: '7.15.0-beta', method: 'cli',
        error: 'Insufficient flash space (2.1 MB free, 4.5 MB required)', requiresReboot: false,
      },
    }),

    // Config push
    makeEntry({
      id: 'AUD-020', timestamp: new Date(now - 180 * 60 * 1000).toISOString(),
      user: users[0], action: 'config_push', target: 'mt-core-01', result: 'success', ip: '192.168.1.100',
      payload: {
        method: 'terraform', configName: 'bgp-peer-update-v2',
        before: { bgp_hold_time: '90', bgp_keepalive: '30', neighbor_as: '64512' },
        after: { bgp_hold_time: '30', bgp_keepalive: '10', neighbor_as: '64512' },
        commands: [
          '/routing/bgp/connection/set [find name="peer-isp1"] hold-time=30s keepalive-time=10s',
          '/routing/bgp/connection/print detail where name="peer-isp1"',
        ],
        rollbackAvailable: true,
      },
    }),
    makeEntry({
      id: 'AUD-021', timestamp: new Date(now - 200 * 60 * 1000).toISOString(),
      user: users[2], action: 'config_push', target: 'mt-branch-02', result: 'success', ip: '10.10.0.50',
      payload: {
        method: 'webfig', configName: 'vpn-tunnel-update',
        before: { ipsec_peer_address: '0.0.0.0', ipsec_policy_sa_src: '0.0.0.0' },
        after: { ipsec_peer_address: '203.0.113.50', ipsec_policy_sa_src: '10.0.1.0/24' },
        commands: [
          '/ip/ipsec/peer/set [find name="vpn-hub"] address=203.0.113.50/32',
          '/ip/ipsec/policy/set [find dst-address=10.0.0.0/24] sa-src-address=10.0.1.0',
        ],
        rollbackAvailable: true,
      },
    }),
    makeEntry({
      id: 'AUD-022', timestamp: new Date(now - 240 * 60 * 1000).toISOString(),
      user: users[1], action: 'config_push', target: 'mt-pppoe-con', result: 'fail', ip: '192.168.1.101',
      payload: {
        method: 'cli', configName: 'nat-timeout-fix',
        commands: [
          '/ip/firewall/nat/set [find chain=srcnat] timeout=4h',
        ],
        error: 'Device unreachable — connection timeout after 30s',
        rollbackAvailable: false,
      },
    }),

    // Backup operations
    makeEntry({
      id: 'AUD-030', timestamp: new Date(now - 300 * 60 * 1000).toISOString(),
      user: users[0], action: 'backup_create', target: 'mt-core-01', result: 'success', ip: '192.168.1.100',
      payload: { format: 'binary', size: '2.4 MB', encrypted: true, retention: '30d', path: '/backups/mt-core-01/2026-06-16_02-00.rsc' },
    }),
    makeEntry({
      id: 'AUD-031', timestamp: new Date(now - 360 * 60 * 1000).toISOString(),
      user: users[0], action: 'backup_create', target: 'mt-branch-02', result: 'success', ip: '192.168.1.100',
      payload: { format: 'binary', size: '1.1 MB', encrypted: true, retention: '30d', path: '/backups/mt-branch-02/2026-06-16_02-00.rsc' },
    }),
    makeEntry({
      id: 'AUD-032', timestamp: new Date(now - 400 * 60 * 1000).toISOString(),
      user: users[2], action: 'backup_restore', target: 'mt-ap-lobby', result: 'success', ip: '10.10.0.50',
      payload: {
        backupDate: '2026-06-15T02:00:00Z', backupPath: '/backups/mt-ap-lobby/2026-06-15_02-00.rsc',
        restoreMethod: 'full', verified: true, deviceRebooted: true,
      },
    }),

    // User management
    makeEntry({
      id: 'AUD-040', timestamp: new Date(now - 500 * 60 * 1000).toISOString(),
      user: users[0], action: 'user_add', target: 'eka@mikrowize.id', result: 'success', ip: '192.168.1.100',
      payload: {
        newUser: { name: 'Eka Putri', email: 'eka@mikrowize.id', role: 'Viewer' },
        invitedBy: 'andi@mikrowize.id', inviteMethod: 'email', permissions: ['dashboard.view', 'devices.view', 'alerts.view'],
      },
    }),
    makeEntry({
      id: 'AUD-041', timestamp: new Date(now - 600 * 60 * 1000).toISOString(),
      user: users[0], action: 'user_role_change', target: 'budi@mikrowize.id', result: 'success', ip: '192.168.1.100',
      payload: {
        targetUser: { name: 'Budi Santoso', email: 'budi@mikrowize.id' },
        fromRole: 'Operator', toRole: 'NetOps',
        permissionsAdded: ['config.push', 'backup.manage', 'device.reboot'],
        permissionsRemoved: [],
      },
    }),
    makeEntry({
      id: 'AUD-042', timestamp: new Date(now - 700 * 60 * 1000).toISOString(),
      user: users[0], action: 'user_remove', target: 'retired@mikrowize.id', result: 'success', ip: '192.168.1.100',
      payload: {
        removedUser: { name: 'Retired User', email: 'retired@mikrowize.id', role: 'Operator' },
        reason: 'offboarding', dataRetention: '90d', sessionsRevoked: 2,
      },
    }),
    makeEntry({
      id: 'AUD-043', timestamp: new Date(now - 750 * 60 * 1000).toISOString(),
      user: users[0], action: 'permission_change', target: 'role:Viewer', result: 'success', ip: '192.168.1.100',
      payload: {
        role: 'Viewer',
        permissionsAdded: ['audit.view', 'reports.view'],
        permissionsRemoved: [],
        affectedUsers: 3,
      },
    }),

    // Template & bulk operations
    makeEntry({
      id: 'AUD-050', timestamp: new Date(now - 800 * 60 * 1000).toISOString(),
      user: users[2], action: 'template_apply', target: 'mt-branch-02', result: 'success', ip: '10.10.0.50',
      payload: {
        templateName: 'branch-standard-v3',
        templateVersion: '3.2.1',
        parameters: { site_name: 'Surabaya', wan_ip: '10.0.1.1', lan_subnet: '10.0.1.0/24' },
        devicesAffected: 1,
      },
    }),
    makeEntry({
      id: 'AUD-051', timestamp: new Date(now - 900 * 60 * 1000).toISOString(),
      user: users[0], action: 'bulk_import', target: 'multiple', result: 'success', ip: '192.168.1.100',
      payload: {
        source: 'CSV upload', fileName: 'new-devices-q2-2026.csv',
        devicesImported: 12, devicesSkipped: 2, errors: [],
        columns: ['hostname', 'ip', 'model', 'site', 'tags'],
      },
    }),
    makeEntry({
      id: 'AUD-052', timestamp: new Date(now - 1000 * 60 * 1000).toISOString(),
      user: users[0], action: 'export_config', target: 'mt-core-01', result: 'success', ip: '192.168.1.100',
      payload: { format: 'json', sections: ['interfaces', 'routing', 'firewall', 'system'], size: '48 KB' },
    }),

    // API calls
    makeEntry({
      id: 'AUD-060', timestamp: new Date(now - 1100 * 60 * 1000).toISOString(),
      user: users[3], action: 'api_call', target: 'mt-core-01', result: 'success', ip: '10.10.0.51',
      userAgent: 'MikroWize-CLI/2.1.0',
      payload: { method: 'GET', endpoint: '/api/v1/devices/mt-core-01/metrics', responseTime: '120ms', statusCode: 200 },
    }),
    makeEntry({
      id: 'AUD-061', timestamp: new Date(now - 1200 * 60 * 1000).toISOString(),
      user: users[3], action: 'api_call', target: 'mt-pppoe-con', result: 'fail', ip: '10.10.0.51',
      userAgent: 'MikroWize-CLI/2.1.0',
      payload: { method: 'POST', endpoint: '/api/v1/devices/mt-pppoe-con/config', responseTime: '30200ms', statusCode: 504, error: 'Gateway timeout' },
    }),

    // More login/logout for today stats
    makeEntry({
      id: 'AUD-070', timestamp: new Date(now - 1300 * 60 * 1000).toISOString(),
      user: users[4], action: 'login', result: 'success', ip: '172.16.0.10',
      payload: { method: 'password', mfa: true, mfaMethod: 'totp', location: 'Bandung, ID' },
    }),
    makeEntry({
      id: 'AUD-071', timestamp: new Date(now - 1400 * 60 * 1000).toISOString(),
      user: users[4], action: 'logout', result: 'success', ip: '172.16.0.10',
      payload: { reason: 'session_timeout', sessionDuration: '2h 0m' },
    }),
    makeEntry({
      id: 'AUD-072', timestamp: new Date(now - 1500 * 60 * 1000).toISOString(),
      user: users[0], action: 'login', result: 'fail', ip: '192.168.1.100',
      payload: { method: 'password', reason: 'MFA challenge failed — expired TOTP code', attempts: 1 },
    }),
    makeEntry({
      id: 'AUD-073', timestamp: new Date(now - 1550 * 60 * 1000).toISOString(),
      user: users[0], action: 'login', result: 'success', ip: '192.168.1.100',
      payload: { method: 'password', mfa: true, mfaMethod: 'totp', location: 'Jakarta, ID' },
    }),
  ]
}

const MOCK_AUDIT_LOG = generateMockAuditLog()

// ─── Result Badge ────────────────────────────────────────────────────────────

function ResultBadge({ result }) {
  if (result === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-container text-on-success-container">
        <CheckCircle size={12} /> Success
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container">
      <XCircle size={12} /> Failed
    </span>
  )
}

// ─── Action Badge ────────────────────────────────────────────────────────────

function ActionBadge({ action }) {
  const label = ACTION_LABELS[action] || action
  const Icon = ACTION_ICONS[action] || Activity
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-on-surface">
      <span className="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center">
        <Icon size={13} className="text-on-surface-variant" />
      </span>
      {label}
    </span>
  )
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function DetailModal({ entry, onClose }) {
  if (!entry) return null

  const ActionIcon = ACTION_ICONS[entry.action] || Activity

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ActionIcon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">{ACTION_LABELS[entry.action]}</h3>
              <p className="text-xs text-on-surface-variant">{entry.id} · {formatDateTime(entry.timestamp)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Result + Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Result</p>
              <ResultBadge result={entry.result} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Timestamp</p>
              <p className="text-sm text-on-surface">{formatDateTime(entry.timestamp)}</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">User</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-on-surface-variant">Name</p>
                <p className="text-sm text-on-surface font-medium">{entry.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Email</p>
                <p className="text-sm text-on-surface">{entry.user.email}</p>
              </div>
              {entry.user.role && (
                <div>
                  <p className="text-xs text-on-surface-variant">Role</p>
                  <Badge variant="info">{entry.user.role}</Badge>
                </div>
              )}
              <div>
                <p className="text-xs text-on-surface-variant">Session ID</p>
                <p className="text-sm text-on-surface font-mono">{entry.sessionId}</p>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Network</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-on-surface-variant">Source IP</p>
                <p className="text-sm text-on-surface font-mono">{entry.ip}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Target</p>
                <p className="text-sm text-on-surface font-mono">{entry.target || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-on-surface-variant">User Agent</p>
                <p className="text-xs text-on-surface font-mono break-all">{entry.userAgent}</p>
              </div>
            </div>
          </div>

          {/* Payload */}
          {entry.payload && Object.keys(entry.payload).length > 0 && (
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Payload Details</p>
              <div className="space-y-2">
                {Object.entries(entry.payload).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <p className="text-xs text-on-surface-variant font-medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    {typeof value === 'object' && value !== null ? (
                      <pre className="text-xs text-on-surface font-mono bg-surface-container rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-on-surface font-mono">
                        {String(value)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config Before/After (for config_push) */}
          {entry.action === 'config_push' && (entry.payload.before || entry.payload.after) && (
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Configuration Changes</p>
              <div className="grid grid-cols-2 gap-4">
                {entry.payload.before && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-1.5 font-medium">Before</p>
                    <pre className="text-xs text-on-surface font-mono bg-error-container/30 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(entry.payload.before, null, 2)}
                    </pre>
                  </div>
                )}
                {entry.payload.after && (
                  <div>
                    <p className="text-xs text-on-surface-variant mb-1.5 font-medium">After</p>
                    <pre className="text-xs text-on-surface font-mono bg-success-container/30 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(entry.payload.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              {entry.payload.commands && (
                <div>
                  <p className="text-xs text-on-surface-variant mb-1.5 font-medium">Commands Executed</p>
                  <pre className="text-xs text-on-surface font-mono bg-surface-container rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap">
                    {entry.payload.commands.join('\n')}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Timeline View ───────────────────────────────────────────────────────────

function TimelineView({ entries, onSelect }) {
  const grouped = useMemo(() => {
    const map = new Map()
    entries.forEach(entry => {
      const dateKey = formatDate(entry.timestamp)
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey).push(entry)
    })
    return Array.from(map.entries())
  }, [entries])

  return (
    <div className="space-y-6">
      {grouped.map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <Calendar size={14} className="text-on-surface-variant" />
            <h4 className="text-sm font-semibold text-on-surface">{date}</h4>
            <span className="text-xs text-on-surface-variant">({items.length} events)</span>
          </div>
          <div className="ml-2 border-l-2 border-outline-variant pl-5 space-y-0">
            {items.map((entry, idx) => {
              const ActionIcon = ACTION_ICONS[entry.action] || Activity
              const isLast = idx === items.length - 1
              return (
                <div
                  key={entry.id}
                  className={`relative pb-5 ${isLast ? 'pb-0' : ''} cursor-pointer group`}
                  onClick={() => onSelect(entry)}
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    entry.result === 'success'
                      ? 'bg-success-container border-success'
                      : 'bg-error-container border-error'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      entry.result === 'success' ? 'bg-success' : 'bg-error'
                    }`} />
                  </div>

                  <div className="bg-surface-container-low rounded-xl border border-outline-variant p-3.5 group-hover:border-outline transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <ActionIcon size={14} className="text-on-surface-variant" />
                        <span className="text-sm font-medium text-on-surface">{ACTION_LABELS[entry.action]}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-mono">{formatTime(entry.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span>{entry.user.name}</span>
                      <span>·</span>
                      <span className="font-mono">{entry.target || entry.ip}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stats Cards ─────────────────────────────────────────────────────────────

function StatsCards({ entries }) {
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEntries = entries.filter(e => new Date(e.timestamp) >= today)
    const failedEntries = todayEntries.filter(e => e.result === 'fail')
    const uniqueUsers = new Set(todayEntries.map(e => e.user.email))

    return {
      totalToday: todayEntries.length,
      failedToday: failedEntries.length,
      uniqueUsers: uniqueUsers.size,
    }
  }, [entries])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions Today</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{stats.totalToday}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-primary" />
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Failed Actions</p>
            <p className="text-2xl font-bold text-error mt-1">{stats.failedToday}</p>
          </div>
          <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
            <AlertCircle size={20} className="text-error" />
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Unique Users</p>
            <p className="text-2xl font-bold text-on-surface mt-1">{stats.uniqueUsers}</p>
          </div>
          <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
            <User size={20} className="text-info" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function exportCSV(entries) {
  const headers = ['ID', 'Timestamp', 'User', 'Email', 'Role', 'Action', 'Target', 'Result', 'IP Address', 'User Agent']
  const rows = entries.map(e => [
    e.id,
    e.timestamp,
    e.user.name,
    e.user.email,
    e.user.role || '',
    ACTION_LABELS[e.action] || e.action,
    e.target || '',
    e.result,
    e.ip,
    e.userAgent,
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AuditLog() {
  const [search, setSearch] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterTarget, setFilterTarget] = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'timeline'
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map()
    MOCK_AUDIT_LOG.forEach(e => {
      if (!map.has(e.user.email)) map.set(e.user.email, e.user)
    })
    return Array.from(map.values())
  }, [])

  // Filter entries
  const filtered = useMemo(() => {
    let result = [...MOCK_AUDIT_LOG]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.user.name.toLowerCase().includes(q) ||
        e.user.email.toLowerCase().includes(q) ||
        (ACTION_LABELS[e.action] || e.action).toLowerCase().includes(q) ||
        (e.target || '').toLowerCase().includes(q) ||
        e.ip.toLowerCase().includes(q) ||
        e.userAgent.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q) ||
        JSON.stringify(e.payload).toLowerCase().includes(q)
      )
    }

    if (filterUser) {
      result = result.filter(e => e.user.email === filterUser)
    }
    if (filterAction) {
      result = result.filter(e => e.action === filterAction)
    }
    if (filterTarget) {
      result = result.filter(e => e.target && e.target.toLowerCase().includes(filterTarget.toLowerCase()))
    }
    if (filterResult) {
      result = result.filter(e => e.result === filterResult)
    }
    if (dateFrom) {
      const from = new Date(dateFrom)
      result = result.filter(e => new Date(e.timestamp) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter(e => new Date(e.timestamp) <= to)
    }

    result.sort((a, b) => {
      const diff = new Date(a.timestamp) - new Date(b.timestamp)
      return sortDir === 'desc' ? -diff : diff
    })

    return result
  }, [search, filterUser, filterAction, filterTarget, filterResult, dateFrom, dateTo, sortDir])

  const handleExport = useCallback(() => {
    exportCSV(filtered)
  }, [filtered])

  const clearFilters = useCallback(() => {
    setFilterUser('')
    setFilterAction('')
    setFilterTarget('')
    setFilterResult('')
    setDateFrom('')
    setDateTo('')
  }, [])

  const hasActiveFilters = filterUser || filterAction || filterTarget || filterResult || dateFrom || dateTo

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Audit Log</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Immutable record of all system actions and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')}>
            {viewMode === 'table' ? <Clock size={16} /> : <LayoutList size={16} />}
            {viewMode === 'table' ? 'Timeline' : 'Table'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards entries={MOCK_AUDIT_LOG} />

      {/* Search + Filter Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search across all fields — user, action, target, IP, payload..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-container text-on-surface-variant"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-on-surface">Filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              label="User"
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
            >
              <option value="">All users</option>
              {uniqueUsers.map(u => (
                <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
              ))}
            </Select>
            <Select
              label="Action Type"
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="">All actions</option>
              {ACTION_TYPES.map(a => (
                <option key={a} value={a}>{ACTION_LABELS[a]}</option>
              ))}
            </Select>
            <Input
              label="Device Target"
              placeholder="e.g. mt-core-01"
              value={filterTarget}
              onChange={e => setFilterTarget(e.target.value)}
            />
            <Select
              label="Result"
              value={filterResult}
              onChange={e => setFilterResult(e.target.value)}
            >
              <option value="">All results</option>
              <option value="success">Success</option>
              <option value="fail">Failed</option>
            </Select>
            <Input
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
            <Input
              label="Date To"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Results count + sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          Showing <span className="font-medium text-on-surface">{filtered.length}</span> of {MOCK_AUDIT_LOG.length} entries
        </p>
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowUpDown size={12} />
          {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3">Timestamp</th>
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3">User</th>
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3">Action</th>
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3">Target</th>
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3">IP Address</th>
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3">Result</th>
                  <th className="text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-on-surface-variant">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-outline" />
                        <p className="text-sm">No audit log entries match your filters</p>
                        <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(entry => (
                    <tr
                      key={entry.id}
                      className="border-b border-outline-variant/50 hover:bg-surface-container-low/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-on-surface font-mono">{formatDateTime(entry.timestamp)}</span>
                          <span className="text-xs text-on-surface-variant">{timeAgo(entry.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-on-surface font-medium">{entry.user.name}</span>
                          <span className="text-xs text-on-surface-variant">{entry.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-on-surface font-mono">{entry.target || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-on-surface-variant font-mono">{entry.ip}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ResultBadge result={entry.result} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                          onClick={e => { e.stopPropagation(); setSelectedEntry(entry) }}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <div className="flex flex-col items-center gap-2">
                <Search size={24} className="text-outline" />
                <p className="text-sm">No audit log entries match your filters</p>
                <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <TimelineView entries={filtered} onSelect={setSelectedEntry} />
          )}
        </Card>
      )}

      {/* Detail Modal */}
      <DetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  )
}
