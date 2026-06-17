import { useState } from 'react'
import {
  Plus, UserPlus, Shield, Key, X, Check, Eye, EyeOff,
  Pencil, Trash2, UserX, Clock, Activity, Copy, RefreshCw,
  ChevronDown, Search, Filter, MoreVertical, AlertTriangle,
  Smartphone, Globe, Lock, Unlock
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input, { Select } from '../components/ui/Input'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const ALL_SITES = [
  'All Sites', 'DC Jakarta', 'DC Surabaya', 'Branch Bandung',
  'Branch Yogyakarta', 'Branch Semarang', 'Branch Medan',
]

const ALL_PERMISSIONS = [
  { id: 'devices.view', label: 'View Devices', category: 'Devices' },
  { id: 'devices.config', label: 'Configure Devices', category: 'Devices' },
  { id: 'devices.firmware', label: 'Firmware Updates', category: 'Devices' },
  { id: 'devices.reboot', label: 'Reboot Devices', category: 'Devices' },
  { id: 'monitoring.view', label: 'View Monitoring', category: 'Monitoring' },
  { id: 'monitoring.alerts', label: 'Manage Alerts', category: 'Monitoring' },
  { id: 'monitoring.reports', label: 'Generate Reports', category: 'Monitoring' },
  { id: 'templates.view', label: 'View Templates', category: 'Templates' },
  { id: 'templates.create', label: 'Create Templates', category: 'Templates' },
  { id: 'templates.push', label: 'Push Templates', category: 'Templates' },
  { id: 'users.view', label: 'View Users', category: 'User Management' },
  { id: 'users.manage', label: 'Manage Users', category: 'User Management' },
  { id: 'roles.manage', label: 'Manage Roles', category: 'User Management' },
  { id: 'sites.view', label: 'View Sites', category: 'Sites' },
  { id: 'sites.manage', label: 'Manage Sites', category: 'Sites' },
  { id: 'api.access', label: 'API Access', category: 'API' },
  { id: 'api.keys', label: 'Manage API Keys', category: 'API' },
  { id: 'audit.view', label: 'View Audit Log', category: 'Audit' },
]

const INITIAL_USERS = [
  {
    id: '1', name: 'Eko Supriyanto', email: 'esupriyanto828@gmail.com',
    role: 'Super Admin', sites: ['All Sites'], lastLogin: '2026-06-16 13:00',
    status: 'active', mfaEnabled: true, mfaEnforced: true,
    actionsCount: 342, apiKey: 'mkw_live_a1b2c3d4e5f6...',
    createdAt: '2025-01-15',
  },
  {
    id: '2', name: 'NOC Operator', email: 'noc@mikrowize.io',
    role: 'NOC Engineer', sites: ['DC Jakarta', 'DC Surabaya'],
    lastLogin: '2026-06-16 08:30', status: 'active', mfaEnabled: true, mfaEnforced: true,
    actionsCount: 187, apiKey: null,
    createdAt: '2025-03-22',
  },
  {
    id: '3', name: 'Field Tech', email: 'tech@mikrowize.io',
    role: 'Network Engineer', sites: ['Branch Bandung'],
    lastLogin: '2026-06-15 17:00', status: 'active', mfaEnabled: false, mfaEnforced: false,
    actionsCount: 94, apiKey: null,
    createdAt: '2025-06-10',
  },
  {
    id: '4', name: 'Budi Reader', email: 'budi@mikrowize.io',
    role: 'Read-Only', sites: ['DC Jakarta'],
    lastLogin: '2026-06-14 09:15', status: 'active', mfaEnabled: false, mfaEnforced: false,
    actionsCount: 23, apiKey: null,
    createdAt: '2025-08-01',
  },
  {
    id: '5', name: 'Inactive User', email: 'old@mikrowize.io',
    role: 'NOC Engineer', sites: ['Branch Semarang'],
    lastLogin: '2026-05-01 10:00', status: 'inactive', mfaEnabled: false, mfaEnforced: false,
    actionsCount: 5, apiKey: null,
    createdAt: '2025-02-14',
  },
]

const INITIAL_ROLES = [
  {
    id: '1', name: 'Super Admin', description: 'Full access to all features and sites',
    users: 1, mfaEnforced: true,
    permissions: ALL_PERMISSIONS.map(p => p.id),
  },
  {
    id: '2', name: 'NOC Engineer', description: 'View, troubleshoot, and execute monitoring tasks',
    users: 1, mfaEnforced: true,
    permissions: [
      'devices.view', 'devices.reboot',
      'monitoring.view', 'monitoring.alerts', 'monitoring.reports',
      'templates.view', 'sites.view', 'audit.view',
    ],
  },
  {
    id: '3', name: 'Network Engineer', description: 'Full device configuration and template push',
    users: 1, mfaEnforced: false,
    permissions: [
      'devices.view', 'devices.config', 'devices.firmware', 'devices.reboot',
      'monitoring.view', 'monitoring.alerts',
      'templates.view', 'templates.create', 'templates.push',
      'sites.view',
    ],
  },
  {
    id: '4', name: 'Read-Only', description: 'View monitoring and reports only',
    users: 1, mfaEnforced: false,
    permissions: ['devices.view', 'monitoring.view', 'monitoring.reports', 'sites.view'],
  },
  {
    id: '5', name: 'Customer', description: 'View own devices only',
    users: 0, mfaEnforced: false,
    permissions: ['devices.view', 'monitoring.view'],
  },
]

const INITIAL_INVITATIONS = [
  { id: '1', email: 'newuser@partner.io', role: 'NOC Engineer', sites: ['DC Jakarta'], sentAt: '2026-06-16 10:00', expiresAt: '2026-06-23' },
  { id: '2', email: 'consultant@external.com', role: 'Read-Only', sites: ['Branch Bandung'], sentAt: '2026-06-15 14:30', expiresAt: '2026-06-22' },
]

const ACTIVITY_LOG = [
  { id: '1', userId: '1', action: 'Logged in', timestamp: '2026-06-16 13:00', ip: '192.168.1.100' },
  { id: '2', userId: '1', action: 'Updated device config - Router-JKT-01', timestamp: '2026-06-16 13:05', ip: '192.168.1.100' },
  { id: '3', userId: '2', action: 'Acknowledged alert - High CPU', timestamp: '2026-06-16 08:35', ip: '10.0.0.55' },
  { id: '4', userId: '2', action: 'Generated report - Weekly Uptime', timestamp: '2026-06-16 09:00', ip: '10.0.0.55' },
  { id: '5', userId: '3', action: 'Pushed template - Firmware v3.2', timestamp: '2026-06-15 17:10', ip: '172.16.0.22' },
  { id: '6', userId: '1', action: 'Created role - Auditor', timestamp: '2026-06-15 11:00', ip: '192.168.1.100' },
  { id: '7', userId: '4', action: 'Exported report - Monthly SLA', timestamp: '2026-06-14 09:20', ip: '192.168.1.105' },
]

// ─── Permission Matrix Grid ──────────────────────────────────────────────────

function PermissionMatrix({ roles, permissions }) {
  const categories = [...new Set(permissions.map(p => p.category))]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-outline-variant">
            <th className="text-left py-3 px-4 text-xs font-semibold text-on-surface-variant whitespace-nowrap sticky left-0 bg-surface-container-low z-10 min-w-[200px]">
              Permission
            </th>
            {roles.map(role => (
              <th key={role.id} className="text-center py-3 px-3 text-xs font-semibold text-on-surface-variant whitespace-nowrap min-w-[120px]">
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <>
              <tr key={`cat-${cat}`}>
                <td colSpan={roles.length + 1} className="pt-4 pb-1 px-4">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{cat}</span>
                </td>
              </tr>
              {permissions.filter(p => p.category === cat).map(perm => (
                <tr key={perm.id} className="border-t border-outline-variant/50 hover:bg-surface-container/50">
                  <td className="py-2.5 px-4 text-on-surface-variant sticky left-0 bg-surface-container-low">
                    {perm.label}
                  </td>
                  {roles.map(role => (
                    <td key={role.id} className="py-2.5 px-3 text-center">
                      {role.permissions.includes(perm.id) ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-container">
                          <Check size={14} className="text-on-success-container" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high">
                          <X size={14} className="text-outline" />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Modal Wrapper ───────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-surface-container-high rounded-2xl border border-outline-variant shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant shrink-0">
          <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Invite User Modal ───────────────────────────────────────────────────────

function InviteUserModal({ open, onClose, roles, sites, onInvite }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(roles[0]?.name || '')
  const [selectedSites, setSelectedSites] = useState(['All Sites'])
  const [sending, setSending] = useState(false)

  const toggleSite = (site) => {
    if (site === 'All Sites') {
      setSelectedSites(['All Sites'])
      return
    }
    setSelectedSites(prev => {
      const next = prev.filter(s => s !== 'All Sites')
      if (next.includes(site)) {
        const filtered = next.filter(s => s !== site)
        return filtered.length === 0 ? ['All Sites'] : filtered
      }
      return [...next, site]
    })
  }

  const handleSubmit = () => {
    if (!email) return
    setSending(true)
    setTimeout(() => {
      onInvite({ email, role, sites: selectedSites })
      setEmail('')
      setRole(roles[0]?.name || '')
      setSelectedSites(['All Sites'])
      setSending(false)
      onClose()
    }, 600)
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite User">
      <div className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Select
          label="Role"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {roles.map(r => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </Select>

        <div className="space-y-2">
          <label className="block text-base font-medium text-on-surface">Site Access Scope</label>
          <div className="grid grid-cols-2 gap-2">
            {sites.map(site => (
              <label
                key={site}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedSites.includes(site)
                    ? 'border-primary bg-primary-container/50 text-on-primary-container'
                    : 'border-outline-variant hover:bg-surface-container'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSites.includes(site)}
                  onChange={() => toggleSite(site)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  selectedSites.includes(site) ? 'border-primary bg-primary' : 'border-outline'
                }`}>
                  {selectedSites.includes(site) && <Check size={10} className="text-on-primary" />}
                </div>
                <span className="text-sm">{site}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!email || sending}>
            {sending ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : <><UserPlus size={14} /> Send Invitation</>}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Edit User Modal ─────────────────────────────────────────────────────────

function EditUserModal({ open, onClose, user, roles, sites, onSave }) {
  const [role, setRole] = useState(user?.role || '')
  const [selectedSites, setSelectedSites] = useState(user?.sites || ['All Sites'])
  const [status, setStatus] = useState(user?.status || 'active')

  const toggleSite = (site) => {
    if (site === 'All Sites') {
      setSelectedSites(['All Sites'])
      return
    }
    setSelectedSites(prev => {
      const next = prev.filter(s => s !== 'All Sites')
      if (next.includes(site)) {
        const filtered = next.filter(s => s !== site)
        return filtered.length === 0 ? ['All Sites'] : filtered
      }
      return [...next, site]
    })
  }

  if (!user) return null

  return (
    <Modal open={open} onClose={onClose} title={`Edit User — ${user.name}`}>
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-on-surface">{user.name}</p>
            <p className="text-sm text-on-surface-variant">{user.email}</p>
          </div>
        </div>

        <Select
          label="Role"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {roles.map(r => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </Select>

        <div className="space-y-2">
          <label className="block text-base font-medium text-on-surface">Site Access Scope</label>
          <div className="grid grid-cols-2 gap-2">
            {sites.map(site => (
              <label
                key={site}
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  selectedSites.includes(site)
                    ? 'border-primary bg-primary-container/50 text-on-primary-container'
                    : 'border-outline-variant hover:bg-surface-container'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSites.includes(site)}
                  onChange={() => toggleSite(site)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  selectedSites.includes(site) ? 'border-primary bg-primary' : 'border-outline'
                }`}>
                  {selectedSites.includes(site) && <Check size={10} className="text-on-primary" />}
                </div>
                <span className="text-sm">{site}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-on-surface">Status</label>
          <div className="flex gap-3">
            <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              status === 'active' ? 'border-success bg-success-container/30' : 'border-outline-variant hover:bg-surface-container'
            }`}>
              <input type="radio" name="status" checked={status === 'active'} onChange={() => setStatus('active')} className="sr-only" />
              <Unlock size={16} className={status === 'active' ? 'text-success' : 'text-outline'} />
              <span className="text-sm font-medium">Active</span>
            </label>
            <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              status === 'inactive' ? 'border-warning bg-warning-container/30' : 'border-outline-variant hover:bg-surface-container'
            }`}>
              <input type="radio" name="status" checked={status === 'inactive'} onChange={() => setStatus('inactive')} className="sr-only" />
              <Lock size={16} className={status === 'inactive' ? 'text-warning' : 'text-outline'} />
              <span className="text-sm font-medium">Inactive</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(user.id, { role, sites: selectedSites, status }); onClose(); }}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Create / Edit Role Modal ────────────────────────────────────────────────

function RoleModal({ open, onClose, role, permissions, onSave }) {
  const isEdit = !!role
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [selectedPerms, setSelectedPerms] = useState(role?.permissions || [])
  const [mfaEnforced, setMfaEnforced] = useState(role?.mfaEnforced || false)

  const togglePerm = (id) => {
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const categories = [...new Set(permissions.map(p => p.category))]

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit Role — ${role.name}` : 'Create Role'} wide>
      <div className="space-y-5">
        <Input
          label="Role Name"
          placeholder="e.g. Auditor"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="space-y-2">
          <label className="block text-base font-medium text-on-surface">Description</label>
          <textarea
            className="w-full h-20 px-4 py-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-base text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
            placeholder="Describe what this role can do..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant cursor-pointer hover:bg-surface-container transition-colors">
          <input
            type="checkbox"
            checked={mfaEnforced}
            onChange={e => setMfaEnforced(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
            mfaEnforced ? 'border-primary bg-primary' : 'border-outline'
          }`}>
            {mfaEnforced && <Check size={12} className="text-on-primary" />}
          </div>
          <Smartphone size={18} className="text-on-surface-variant" />
          <div>
            <p className="text-sm font-medium text-on-surface">Enforce MFA for this role</p>
            <p className="text-xs text-on-surface-variant">Users with this role must enable two-factor authentication</p>
          </div>
        </label>

        <div className="space-y-3">
          <label className="block text-base font-medium text-on-surface">Permissions</label>
          {categories.map(cat => (
            <div key={cat} className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">{cat}</p>
              <div className="grid grid-cols-1 gap-1">
                {permissions.filter(p => p.category === cat).map(perm => (
                  <label
                    key={perm.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPerms.includes(perm.id) ? 'bg-primary-container/30' : 'hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.id)}
                      onChange={() => togglePerm(perm.id)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedPerms.includes(perm.id) ? 'border-primary bg-primary' : 'border-outline'
                    }`}>
                      {selectedPerms.includes(perm.id) && <Check size={10} className="text-on-primary" />}
                    </div>
                    <span className="text-sm text-on-surface">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onSave({
              id: role?.id || Date.now().toString(),
              name, description, permissions: selectedPerms,
              mfaEnforced, users: role?.users || 0,
            })
            onClose()
          }}>
            {isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── API Key Modal ───────────────────────────────────────────────────────────

function ApiKeyModal({ open, onClose, user, onGenerate, onRevoke }) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newKey, setNewKey] = useState(null)

  if (!user) return null

  const displayKey = newKey || user.apiKey

  const handleGenerate = () => {
    const key = 'mkw_live_' + Array.from({length: 24}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
    setNewKey(key)
    setShowKey(true)
    onGenerate(user.id, key)
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(displayKey || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = () => {
    onRevoke(user.id)
    setNewKey(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { setNewKey(null); onClose() }} title={`API Keys — ${user.name}`}>
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-surface-container space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-on-surface-variant" />
              <span className="text-sm font-medium text-on-surface">Active API Key</span>
            </div>
            {displayKey && (
              <Badge variant="online">Active</Badge>
            )}
          </div>

          {displayKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-surface-container-high rounded-lg text-sm font-mono text-on-surface-variant truncate">
                  {showKey ? displayKey : displayKey.substring(0, 16) + '••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                  title="Copy"
                >
                  {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Created: {user.createdAt} · Last used: {user.lastLogin}
              </p>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No API key generated yet.</p>
          )}
        </div>

        <div className="flex justify-between">
          {displayKey && (
            <Button variant="danger" size="sm" onClick={handleRevoke}>
              <Trash2 size={14} /> Revoke Key
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="ghost" onClick={() => { setNewKey(null); onClose() }}>Close</Button>
            <Button onClick={handleGenerate}>
              <RefreshCw size={14} /> {displayKey ? 'Regenerate' : 'Generate'} Key
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ open, onClose, title, message, onConfirm, variant: v = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-container/30">
          <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
          <p className="text-sm text-on-surface">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={v} onClick={() => { onConfirm(); onClose(); }}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Activity Log Panel ──────────────────────────────────────────────────────

function ActivityLogPanel({ activities, users }) {
  const getUserName = (userId) => users.find(u => u.id === userId)?.name || 'Unknown'

  return (
    <div className="space-y-2">
      {activities.map(act => (
        <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
            <Activity size={14} className="text-on-surface-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-on-surface">
              <span className="font-medium">{getUserName(act.userId)}</span>
              {' — '}
              {act.action}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <Clock size={10} /> {act.timestamp}
              </span>
              <span className="text-xs text-on-surface-variant">{act.ip}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UsersRoles() {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [roles, setRoles] = useState(INITIAL_ROLES)
  const [invitations, setInvitations] = useState(INITIAL_INVITATIONS)
  const [activities] = useState(ACTIVITY_LOG)

  // Modal states
  const [inviteModal, setInviteModal] = useState(false)
  const [editUserModal, setEditUserModal] = useState(false)
  const [roleModal, setRoleModal] = useState(false)
  const [apiKeyModal, setApiKeyModal] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)

  // Selected items
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  // Tab state
  const [activeTab, setActiveTab] = useState('users')
  const tabs = [
    { id: 'users', label: 'Users', icon: UserPlus },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'matrix', label: 'Permission Matrix', icon: Check },
    { id: 'invitations', label: 'Invitations', icon: Clock },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ]

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleInvite = (data) => {
    setInvitations(prev => [...prev, {
      id: Date.now().toString(),
      ...data,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    }])
  }

  const handleEditUser = (userId, data) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u))
  }

  const handleDeactivateUser = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'inactive' } : u))
  }

  const handleDeleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handleSaveRole = (roleData) => {
    setRoles(prev => {
      const exists = prev.find(r => r.id === roleData.id)
      if (exists) return prev.map(r => r.id === roleData.id ? roleData : r)
      return [...prev, roleData]
    })
  }

  const handleDeleteRole = (roleId) => {
    setRoles(prev => prev.filter(r => r.id !== roleId))
  }

  const handleGenerateApiKey = (userId, key) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, apiKey: key } : u))
  }

  const handleRevokeApiKey = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, apiKey: null } : u))
  }

  const handleResendInvite = (inviteId) => {
    setInvitations(prev => prev.map(inv =>
      inv.id === inviteId
        ? { ...inv, sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }
        : inv
    ))
  }

  const handleCancelInvite = (inviteId) => {
    setInvitations(prev => prev.filter(inv => inv.id !== inviteId))
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status) => {
    if (status === 'active') return <Badge variant="online">Active</Badge>
    return <Badge variant="offline">Inactive</Badge>
  }

  const getMfaBadge = (enabled, enforced) => {
    if (enforced && enabled) return <Badge variant="online"><Smartphone size={10} className="mr-1" />MFA</Badge>
    if (enforced && !enabled) return <Badge variant="warning"><Smartphone size={10} className="mr-1" />Pending</Badge>
    if (!enabled) return <Badge variant="default">No MFA</Badge>
    return <Badge variant="info"><Smartphone size={10} className="mr-1" />MFA</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Users & Roles</h1>
          <p className="text-sm text-on-surface-variant mt-1">Manage platform access, permissions, and security</p>
        </div>
        <Button onClick={() => setInviteModal(true)}>
          <UserPlus size={16} /> Invite User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === 'invitations' && invitations.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-on-primary/20 text-on-primary' : 'bg-primary-container text-on-primary-container'
                }`}>
                  {invitations.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── Users Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-4 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 w-64"
                />
              </div>
            </div>
          </CardHeader>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container">
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Sites</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">MFA</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Last Login</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant">API Key</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{user.name}</p>
                            <p className="text-xs text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="default">{user.role}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.sites.map(site => (
                            <span key={site} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-xs text-on-surface-variant">
                              <Globe size={10} /> {site}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getMfaBadge(user.mfaEnabled, user.mfaEnforced)}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{user.lastLogin}</td>
                      <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                      <td className="px-4 py-3">
                        {user.apiKey ? (
                          <code className="text-xs font-mono text-on-surface-variant">
                            {user.apiKey.substring(0, 12)}…
                          </code>
                        ) : (
                          <span className="text-xs text-outline">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedUser(user); setEditUserModal(true) }}
                            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                            title="Edit user"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setApiKeyModal(true) }}
                            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                            title="API keys"
                          >
                            <Key size={14} />
                          </button>
                          {user.status === 'active' && (
                            <button
                              onClick={() => {
                                setConfirmAction(() => () => handleDeactivateUser(user.id))
                                setConfirmDialog(true)
                              }}
                              className="p-1.5 rounded-lg hover:bg-warning-container text-on-surface-variant hover:text-warning transition-colors"
                              title="Deactivate user"
                            >
                              <UserX size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setConfirmAction(() => () => handleDeleteUser(user.id))
                              setConfirmDialog(true)
                            }}
                            className="p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                            title="Delete user permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Roles Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <Card>
          <CardHeader>
            <CardTitle>Roles ({roles.length})</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => { setSelectedRole(null); setRoleModal(true) }}>
              <Shield size={14} /> Create Role
            </Button>
          </CardHeader>

          <div className="space-y-3">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:border-outline transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-on-primary-container" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-on-surface">{role.name}</p>
                      {role.mfaEnforced && (
                        <Badge variant="info"><Smartphone size={10} className="mr-1" />MFA Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{role.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-on-surface-variant">
                        <span className="font-medium text-on-surface">{role.users}</span> users assigned
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        <span className="font-medium text-on-surface">{role.permissions.length}</span> permissions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedRole(role); setRoleModal(true) }}
                  >
                    <Pencil size={14} /> Edit
                  </Button>
                  {role.users === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfirmAction(() => () => handleDeleteRole(role.id))
                        setConfirmDialog(true)
                      }}
                    >
                      <Trash2 size={14} className="text-error" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Permission Matrix Tab ──────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <p className="text-xs text-on-surface-variant mt-1">
              Overview of all permissions assigned to each role
            </p>
          </CardHeader>
          <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
            <PermissionMatrix roles={roles} permissions={ALL_PERMISSIONS} />
          </div>
        </Card>
      )}

      {/* ─── Invitations Tab ────────────────────────────────────────────────── */}
      {activeTab === 'invitations' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            <Button size="sm" onClick={() => setInviteModal(true)}>
              <Plus size={14} /> New Invitation
            </Button>
          </CardHeader>

          {invitations.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto text-outline mb-3" />
              <p className="text-sm text-on-surface-variant">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-info-container flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-on-info-container" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{inv.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="default">{inv.role}</Badge>
                        <span className="text-xs text-on-surface-variant">
                          Sites: {inv.sites.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-on-surface-variant">Sent: {inv.sentAt}</span>
                        <span className="text-xs text-warning">Expires: {inv.expiresAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleResendInvite(inv.id)}>
                      <RefreshCw size={14} /> Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfirmAction(() => () => handleCancelInvite(inv.id))
                        setConfirmDialog(true)
                      }}
                    >
                      <X size={14} className="text-error" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Activity Log Tab ───────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>User Activity Log</CardTitle>
            <p className="text-xs text-on-surface-variant mt-1">
              Recent user actions across the platform
            </p>
          </CardHeader>
          <ActivityLogPanel activities={activities} users={users} />
        </Card>
      )}

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      <InviteUserModal
        open={inviteModal}
        onClose={() => setInviteModal(false)}
        roles={roles}
        sites={ALL_SITES}
        onInvite={handleInvite}
      />

      <EditUserModal
        open={editUserModal}
        onClose={() => setEditUserModal(false)}
        user={selectedUser}
        roles={roles}
        sites={ALL_SITES}
        onSave={handleEditUser}
      />

      <RoleModal
        open={roleModal}
        onClose={() => setRoleModal(false)}
        role={selectedRole}
        permissions={ALL_PERMISSIONS}
        onSave={handleSaveRole}
      />

      <ApiKeyModal
        open={apiKeyModal}
        onClose={() => setApiKeyModal(false)}
        user={selectedUser}
        onGenerate={handleGenerateApiKey}
        onRevoke={handleRevokeApiKey}
      />

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog()}
        title="Confirm Action"
        message={
          selectedUser?.status === 'active' && !confirmAction?.toString().includes('Delete')
            ? `Are you sure you want to deactivate ${selectedUser?.name}? They will lose access but their history will be preserved.`
            : `Are you sure you want to permanently delete this? This action cannot be undone.`
        }
        onConfirm={() => confirmAction?.()}
      />
    </div>
  )
}
