import { useState, useMemo, useCallback } from 'react'
import {
  Plus, FileCode, Copy, Trash2, Play, Eye, Search, Filter,
  X, ChevronDown, ChevronRight, Check, AlertTriangle, Clock,
  Send, Users, History, ShieldCheck, Star, ArrowLeft, Loader2,
  ChevronLeft, ChevronRight as ChevronRightDouble
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input, { Select, Textarea } from '../components/ui/Input'

// ── Mock data ──────────────────────────────────────────────────────────────
const initialTemplates = [
  {
    id: '1', name: 'NTP Configuration', category: 'System', version: 'v3',
    updated: '2026-06-15', devices: 5, isDefault: false, inUse: true,
    content: `/system ntp client set enabled=yes mode=unicast
/system ntp client servers add address=\${ntp_server_1}
/system ntp client servers add address=\${ntp_server_2}
/system clock set time-zone-name=\${timezone}
:log info "NTP configured on \${hostname}"`,
    vars: [
      { name: 'ntp_server_1', type: 'string', default: '0.id.pool.ntp.org' },
      { name: 'ntp_server_2', type: 'string', default: '1.id.pool.ntp.org' },
      { name: 'timezone', type: 'string', default: 'Asia/Jakarta' },
    ],
    versions: [
      { v: 'v3', date: '2026-06-15', author: 'admin', summary: 'Added timezone variable' },
      { v: 'v2', date: '2026-06-10', author: 'admin', summary: 'Added secondary NTP server' },
      { v: 'v1', date: '2026-06-01', author: 'admin', summary: 'Initial template' },
    ],
  },
  {
    id: '2', name: 'DNS Configuration', category: 'Network', version: 'v2',
    updated: '2026-06-14', devices: 5, isDefault: true, inUse: true,
    content: `/ip dns set allow-remote-requests=no servers=\${dns_primary},\${dns_secondary}
/ip dhcp-server network set [ find ] dns-server=\${dns_primary}
:log info "DNS configured on \${hostname}"`,
    vars: [
      { name: 'dns_primary', type: 'string', default: '1.1.1.1' },
      { name: 'dns_secondary', type: 'string', default: '8.8.8.8' },
    ],
    versions: [
      { v: 'v2', date: '2026-06-14', author: 'admin', summary: 'Added DHCP DNS propagation' },
      { v: 'v1', date: '2026-06-05', author: 'admin', summary: 'Initial template' },
    ],
  },
  {
    id: '3', name: 'Security Hardening', category: 'Security', version: 'v5',
    updated: '2026-06-10', devices: 8, isDefault: false, inUse: true,
    content: `/service disable telnet,ftp,www,api,api-ssl
/ip service set ssh address=\${management_subnet}
/ip service set winbox address=\${management_subnet}
/ip firewall filter add chain=input action=drop connection-state=invalid place-before=0
/ip firewall filter add chain=input action=accept connection-state=established,related place-before=0
:log info "Hardening applied to \${hostname}"`,
    vars: [
      { name: 'ssh_port', type: 'number', default: '22' },
      { name: 'management_subnet', type: 'string', default: '10.0.0.0/8' },
      { name: 'allowed_ips', type: 'string', default: '10.0.0.0/8' },
    ],
    versions: [
      { v: 'v5', date: '2026-06-10', author: 'admin', summary: 'Added input firewall rules' },
      { v: 'v4', date: '2026-06-08', author: 'admin', summary: 'Restricted service addresses' },
      { v: 'v3', date: '2026-06-05', author: 'admin', summary: 'Base hardening' },
      { v: 'v2', date: '2026-06-03', author: 'admin', summary: 'Minor fixes' },
      { v: 'v1', date: '2026-06-01', author: 'admin', summary: 'Initial template' },
    ],
  },
  {
    id: '4', name: 'PPPoE Config', category: 'ISP', version: 'v1',
    updated: '2026-06-08', devices: 2, isDefault: false, inUse: false,
    content: `/interface pppoe-client add name=pppoe-out1 interface=\${wan_interface} user=\${pppoe_user} password=\${pppoe_pass} disabled=no
/queue simple add name=pppoe-limit target=pppoe-out1 max-limit=\${rate_limit}
:log info "PPPoE configured on \${hostname}"`,
    vars: [
      { name: 'pppoe_user', type: 'string', default: '' },
      { name: 'pppoe_pass', type: 'secret', default: '' },
      { name: 'rate_limit', type: 'string', default: '50M/50M' },
      { name: 'wan_interface', type: 'string', default: 'ether1' },
    ],
    versions: [
      { v: 'v1', date: '2026-06-08', author: 'admin', summary: 'Initial template' },
    ],
  },
  {
    id: '5', name: 'BGP Peer Setup', category: 'Routing', version: 'v2',
    updated: '2026-06-12', devices: 1, isDefault: false, inUse: true,
    content: `/routing bgp connection add name=peer1 remote.address=\${peer_ip} remote.as=\${peer_as} local.role=ebgp
/routing filter add chain=bgp-in rule="if (dst==\${prefix_list}) { accept }"
:log info "BGP peer \${peer_ip} configured on \${hostname}"`,
    vars: [
      { name: 'peer_ip', type: 'string', default: '' },
      { name: 'peer_as', type: 'number', default: '0' },
      { name: 'prefix_list', type: 'string', default: '0.0.0.0/0' },
    ],
    versions: [
      { v: 'v2', date: '2026-06-12', author: 'admin', summary: 'Added filter chain' },
      { v: 'v1', date: '2026-06-06', author: 'admin', summary: 'Initial template' },
    ],
  },
]

const mockDevices = [
  { id: 'd1', name: 'MT-Core-01', ip: '10.0.1.1', site: 'DC Jakarta', tags: ['core', 'router'], type: 'router' },
  { id: 'd2', name: 'MT-Branch-02', ip: '10.0.2.1', site: 'Branch Bandung', tags: ['branch', 'router'], type: 'router' },
  { id: 'd3', name: 'MT-AP-01', ip: '10.0.3.1', site: 'DC Jakarta', tags: ['access-point'], type: 'ap' },
  { id: 'd4', name: 'MT-Edge-01', ip: '10.0.4.1', site: 'DC Surabaya', tags: ['edge', 'router'], type: 'router' },
  { id: 'd5', name: 'MT-Switch-01', ip: '10.0.5.1', site: 'DC Jakarta', tags: ['switch'], type: 'switch' },
]

const categories = ['All', 'System', 'Network', 'Security', 'ISP', 'Routing']

// ── Helpers ────────────────────────────────────────────────────────────────
let nextId = 100
function uid() { return String(++nextId) }

function renderPreview(content, vars) {
  let result = content
  for (const v of vars) {
    const regex = new RegExp(`\\$\\{${v.name}\\}`, 'g')
    result = result.replace(regex, v.default || `[${v.name}]`)
  }
  return result
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-surface-container-high rounded-2xl p-6 w-full ${wide ? 'max-w-[56rem]' : 'max-w-[36rem]'} max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Confirm dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-scrim/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-surface-container-high rounded-2xl p-6 max-w-[24rem] w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-error-container' : 'bg-warning-container'}`}>
            {danger ? <Trash2 size={20} className="text-error" /> : <AlertTriangle size={20} className="text-warning" />}
          </div>
          <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        </div>
        <p className="text-sm text-on-surface-variant">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TemplateFramework() {
  const [templates, setTemplates] = useState(initialTemplates)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Modal states
  const [formModal, setFormModal] = useState({ open: false, mode: 'create', template: null })
  const [previewModal, setPreviewModal] = useState({ open: false, template: null })
  const [pushDeviceModal, setPushDeviceModal] = useState({ open: false, template: null })
  const [pushGroupModal, setPushGroupModal] = useState({ open: false, template: null })
  const [historyModal, setHistoryModal] = useState({ open: false, template: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, template: null })
  const [validateResult, setValidateResult] = useState(null)

  // Form state
  const [form, setForm] = useState(emptyForm())
  const [formErrors, setFormErrors] = useState({})

  // Push state
  const [selectedDevices, setSelectedDevices] = useState([])
  const [deviceVarValues, setDeviceVarValues] = useState({})
  const [pushGroupMode, setPushGroupMode] = useState('site') // 'site' | 'tag'
  const [pushGroupValue, setPushGroupValue] = useState('')

  // History state
  const [selectedVersions, setSelectedVersions] = useState({ a: 0, b: 1 })

  // ── Derived data ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchCat = categoryFilter === 'All' || t.category === categoryFilter
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [templates, categoryFilter, search])

  const sites = useMemo(() => [...new Set(mockDevices.map(d => d.site))], [])
  const allTags = useMemo(() => [...new Set(mockDevices.flatMap(d => d.tags))], [])

  // ── Form helpers ──────────────────────────────────────────────────────
  function emptyForm() {
    return { name: '', category: 'System', content: '', vars: [] }
  }

  function openCreate() {
    setForm(emptyForm())
    setFormErrors({})
    setFormModal({ open: true, mode: 'create', template: null })
  }

  function openEdit(t) {
    setForm({ name: t.name, category: t.category, content: t.content, vars: [...t.vars] })
    setFormErrors({})
    setFormModal({ open: true, mode: 'edit', template: t })
  }

  function openClone(t) {
    setForm({ name: `${t.name} (copy)`, category: t.category, content: t.content, vars: [...t.vars] })
    setFormErrors({})
    setFormModal({ open: true, mode: 'create', template: null })
  }

  function updateForm(updates) {
    setForm(prev => ({ ...prev, ...updates }))
    setFormErrors(prev => {
      const next = { ...prev }
      Object.keys(updates).forEach(k => delete next[k])
      return next
    })
  }

  function addVar() {
    updateForm({ vars: [...form.vars, { name: '', type: 'string', default: '' }] })
  }

  function updateVar(index, field, value) {
    const vars = form.vars.map((v, i) => i === index ? { ...v, [field]: value } : v)
    updateForm({ vars })
  }

  function removeVar(index) {
    updateForm({ vars: form.vars.filter((_, i) => i !== index) })
  }

  function validateForm() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Template name is required'
    if (!form.content.trim()) errors.content = 'Template content is required'
    form.vars.forEach((v, i) => {
      if (!v.name.trim()) errors[`var_${i}_name`] = 'Variable name required'
    })
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validateForm()) return
    if (formModal.mode === 'edit' && formModal.template) {
      setTemplates(prev => prev.map(t =>
        t.id === formModal.template.id
          ? { ...t, ...form, updated: new Date().toISOString().slice(0, 10), version: `v${t.versions.length + 1}`, versions: [{ v: `v${t.versions.length + 1}`, date: new Date().toISOString().slice(0, 10), author: 'admin', summary: 'Updated template' }, ...t.versions] }
          : t
      ))
    } else {
      const newTemplate = {
        id: uid(),
        ...form,
        version: 'v1',
        updated: new Date().toISOString().slice(0, 10),
        devices: 0,
        isDefault: false,
        inUse: false,
        versions: [{ v: 'v1', date: new Date().toISOString().slice(0, 10), author: 'admin', summary: 'Initial template' }],
      }
      setTemplates(prev => [newTemplate, ...prev])
    }
    setFormModal({ open: false, mode: 'create', template: null })
  }

  // ── Delete ────────────────────────────────────────────────────────────
  function handleDelete() {
    const t = deleteDialog.template
    if (!t) return
    setTemplates(prev => prev.filter(x => x.id !== t.id))
    setDeleteDialog({ open: false, template: null })
  }

  // ── Push to device ────────────────────────────────────────────────────
  function openPushDevice(t) {
    setSelectedDevices([])
    const defaults = {}
    mockDevices.forEach(d => {
      defaults[d.id] = {}
      t.vars.forEach(v => { defaults[d.id][v.name] = v.default })
    })
    setDeviceVarValues(defaults)
    setPushDeviceModal({ open: true, template: t })
  }

  function toggleDevice(id) {
    setSelectedDevices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handlePushDevice() {
    // Simulate push
    setPushDeviceModal({ open: false, template: null })
    setSelectedDevices([])
    setDeviceVarValues({})
  }

  // ── Push to group ─────────────────────────────────────────────────────
  function openPushGroup(t) {
    setPushGroupMode('site')
    setPushGroupValue('')
    setPushGroupModal({ open: true, template: t })
  }

  function getGroupDevices() {
    const t = pushGroupModal.template
    if (!t) return []
    if (pushGroupMode === 'site') return mockDevices.filter(d => d.site === pushGroupValue)
    return mockDevices.filter(d => d.tags.includes(pushGroupValue))
  }

  function handlePushGroup() {
    setPushGroupModal({ open: false, template: null })
    setPushGroupValue('')
  }

  // ── Validate ──────────────────────────────────────────────────────────
  function handleValidate(t) {
    setValidateResult({ status: 'validating', templateId: t.id })
    setTimeout(() => {
      // Simple check: look for unmatched braces
      const openCount = (t.content.match(/\$\{/) || []).length
      const varCount = t.vars.length
      if (openCount !== varCount) {
        setValidateResult({ status: 'warning', templateId: t.id, message: `Found ${openCount} template expressions but ${varCount} variable definitions. Some may be undefined.` })
      } else {
        setValidateResult({ status: 'valid', templateId: t.id, message: 'Template syntax looks good. All variables are defined.' })
      }
    }, 800)
  }

  // ── Set default ───────────────────────────────────────────────────────
  function toggleDefault(t) {
    setTemplates(prev => prev.map(x => ({
      ...x,
      isDefault: x.id === t.id ? !x.isDefault : (x.category === t.category ? false : x.isDefault),
    })))
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Template Framework</h1>
          <p className="text-sm text-on-surface-variant mt-1">Jinja2-based RouterOS configuration templates</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Create Template</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[14rem] max-w-[24rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-on-surface-variant" />
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === c
                  ? 'bg-primary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileCode size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-on-surface truncate">{t.name}</p>
                    {t.isDefault && <Star size={12} className="text-warning shrink-0" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-on-surface-variant">{t.category}</p>
                </div>
              </div>
              <Badge variant="default">{t.version}</Badge>
            </div>

            {/* Validation result inline */}
            {validateResult?.templateId === t.id && (
              <div className={`mb-3 rounded-lg p-2.5 text-xs flex items-start gap-2 ${
                validateResult.status === 'valid' ? 'bg-success-container/50 text-on-success-container' :
                validateResult.status === 'warning' ? 'bg-warning-container/50 text-on-warning-container' :
                'bg-surface-container text-on-surface-variant'
              }`}>
                {validateResult.status === 'validating' && <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" />}
                {validateResult.status === 'valid' && <ShieldCheck size={14} className="shrink-0 mt-0.5" />}
                {validateResult.status === 'warning' && <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                <span>{validateResult.status === 'validating' ? 'Validating...' : validateResult.message}</span>
              </div>
            )}

            <div className="space-y-2 text-xs text-on-surface-variant mb-4">
              <div className="flex justify-between">
                <span>Applied to</span>
                <span className="text-on-surface font-medium">{t.devices} devices</span>
              </div>
              <div className="flex justify-between">
                <span>Variables</span>
                <span className="text-on-surface font-medium">{t.vars.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Last updated</span>
                <span className="text-on-surface font-medium">{t.updated}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setPreviewModal({ open: true, template: t })}>
                <Eye size={14} /> Preview
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openPushDevice(t)}>
                <Send size={14} /> Push
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openClone(t)}>
                <Copy size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ open: true, template: t })}>
                <Trash2 size={14} className="text-error" />
              </Button>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileCode size={40} className="text-outline mx-auto mb-3" />
            <p className="text-on-surface-variant">No templates found</p>
            <p className="text-xs text-outline mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────── */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, mode: 'create', template: null })}
        title={formModal.mode === 'edit' ? 'Edit Template' : 'Create Template'}
        wide
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              placeholder="e.g. NTP Configuration"
              value={form.name}
              onChange={e => updateForm({ name: e.target.value })}
              error={formErrors.name}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={e => updateForm({ category: e.target.value })}
            >
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Template Content"
            placeholder={`/system ntp client set enabled=yes\n/system ntp client servers add address=\${ntp_server_1}\n:log info "Configured on \${hostname}"`}
            value={form.content}
            onChange={e => updateForm({ content: e.target.value })}
            error={formErrors.content}
            className="font-mono text-sm !h-48"
          />

          {/* Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-base font-medium text-on-surface">Variable Definitions</label>
              <Button variant="secondary" size="sm" onClick={addVar}><Plus size={14} /> Add Variable</Button>
            </div>

            {form.vars.length === 0 && (
              <p className="text-sm text-on-surface-variant py-4 text-center bg-surface-container rounded-lg">
                No variables defined. Use {"${var_name}"} syntax in your template content.
              </p>
            )}

            <div className="space-y-2">
              {form.vars.map((v, i) => (
                <div key={i} className="flex items-start gap-2 bg-surface-container rounded-lg p-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      placeholder="Variable name"
                      value={v.name}
                      onChange={e => updateVar(i, 'name', e.target.value)}
                      className={`h-9 px-3 rounded-md border text-sm bg-surface-container-lowest text-on-surface placeholder:text-outline focus:border-primary ${
                        formErrors[`var_${i}_name`] ? 'border-error' : 'border-outline-variant'
                      }`}
                    />
                    <select
                      value={v.type}
                      onChange={e => updateVar(i, 'type', e.target.value)}
                      className="h-9 px-3 rounded-md border border-outline-variant text-sm bg-surface-container-lowest text-on-surface focus:border-primary"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="secret">Secret</option>
                      <option value="ip">IP Address</option>
                    </select>
                    <input
                      placeholder="Default value"
                      value={v.default}
                      onChange={e => updateVar(i, 'default', e.target.value)}
                      className="h-9 px-3 rounded-md border border-outline-variant text-sm bg-surface-container-lowest text-on-surface placeholder:text-outline focus:border-primary"
                    />
                  </div>
                  <button onClick={() => removeVar(i)} className="p-1.5 rounded-md hover:bg-error-container text-on-surface-variant hover:text-error mt-0.5">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="ghost" onClick={() => setFormModal({ open: false, mode: 'create', template: null })}>Cancel</Button>
            <Button onClick={handleSave}>
              {formModal.mode === 'edit' ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Preview Modal ───────────────────────────────────────────── */}
      <Modal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, template: null })}
        title={`Preview: ${previewModal.template?.name || ''}`}
        wide
      >
        {previewModal.template && (() => {
          const t = previewModal.template
          return (
            <div className="space-y-4">
              {/* Variable summary */}
              <div>
                <p className="text-sm font-medium text-on-surface mb-2">Variables ({t.vars.length})</p>
                <div className="bg-surface-container rounded-lg p-3 space-y-1.5">
                  {t.vars.map(v => (
                    <div key={v.name} className="flex items-center gap-2 text-xs">
                      <code className="text-primary font-mono">{`${'${' + v.name + '}'}`}</code>
                      <span className="text-on-surface-variant">→</span>
                      <span className="text-on-surface font-mono">{v.default || '—'}</span>
                      <Badge variant="info">{v.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw template */}
              <div>
                <p className="text-sm font-medium text-on-surface mb-2">Raw Template</p>
                <pre className="bg-surface-container rounded-lg p-4 text-xs font-mono text-on-surface overflow-x-auto whitespace-pre-wrap border border-outline-variant">
                  {t.content}
                </pre>
              </div>

              {/* Rendered output */}
              <div>
                <p className="text-sm font-medium text-on-surface mb-2">Rendered Output (with defaults)</p>
                <pre className="bg-success-container/30 rounded-lg p-4 text-xs font-mono text-on-surface overflow-x-auto whitespace-pre-wrap border border-success/30">
                  {renderPreview(t.content, t.vars)}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <Button variant="ghost" onClick={() => setPreviewModal({ open: false, template: null })}>Close</Button>
                <Button variant="secondary" onClick={() => { handleValidate(t); setPreviewModal({ open: false, template: null }); }}>
                  <ShieldCheck size={14} /> Validate
                </Button>
                <Button onClick={() => { openPushDevice(t); setPreviewModal({ open: false, template: null }); }}>
                  <Send size={14} /> Push to Device
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Push to Device Modal ─────────────────────────────────────── */}
      <Modal
        open={pushDeviceModal.open}
        onClose={() => setPushDeviceModal({ open: false, template: null })}
        title={`Push: ${pushDeviceModal.template?.name || ''}`}
        wide
      >
        {pushDeviceModal.template && (() => {
          const t = pushDeviceModal.template
          return (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">Select target devices and customize variable values per device.</p>

              {/* Device list */}
              <div className="space-y-2">
                {mockDevices.map(d => {
                  const isSelected = selectedDevices.includes(d.id)
                  return (
                    <div key={d.id} className={`rounded-lg border transition-colors ${isSelected ? 'border-primary/40 bg-primary-container/20' : 'border-outline-variant bg-surface-container'}`}>
                      <button
                        onClick={() => toggleDevice(d.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                          {isSelected && <Check size={12} className="text-on-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-on-surface">{d.name}</span>
                            <span className="text-xs text-on-surface-variant">{d.ip}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-on-surface-variant">{d.site}</span>
                            {d.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">{tag}</span>
                            ))}
                          </div>
                        </div>
                        {isSelected ? <ChevronDown size={16} className="text-on-surface-variant" /> : <ChevronRight size={16} className="text-on-surface-variant" />}
                      </button>

                      {/* Per-device variable values */}
                      {isSelected && (
                        <div className="px-3 pb-3 pt-1 border-t border-outline-variant/50">
                          <p className="text-xs font-medium text-on-surface-variant mb-2">Variable values for {d.name}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {t.vars.map(v => (
                              <div key={v.name}>
                                <label className="text-[10px] text-on-surface-variant font-mono">{v.name}</label>
                                <input
                                  type={v.type === 'secret' ? 'password' : 'text'}
                                  value={deviceVarValues[d.id]?.[v.name] ?? v.default}
                                  onChange={e => setDeviceVarValues(prev => ({
                                    ...prev,
                                    [d.id]: { ...(prev[d.id] || {}), [v.name]: e.target.value },
                                  }))}
                                  className="w-full h-8 px-2.5 rounded-md border border-outline-variant text-xs bg-surface-container-lowest text-on-surface font-mono focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t border-outline-variant">
                <Button variant="ghost" onClick={() => { openPushGroup(t); setPushDeviceModal({ open: false, template: null }); }}>
                  <Users size={14} /> Push to Group
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPushDeviceModal({ open: false, template: null })}>Cancel</Button>
                  <Button onClick={handlePushDevice} disabled={selectedDevices.length === 0}>
                    <Send size={14} /> Push to {selectedDevices.length} Device{selectedDevices.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Push to Group Modal ──────────────────────────────────────── */}
      <Modal
        open={pushGroupModal.open}
        onClose={() => setPushGroupModal({ open: false, template: null })}
        title={`Push to Group: ${pushGroupModal.template?.name || ''}`}
      >
        {pushGroupModal.template && (() => {
          const groupDevices = getGroupDevices()
          return (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => { setPushGroupMode('site'); setPushGroupValue('') }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    pushGroupMode === 'site' ? 'bg-primary-container text-on-secondary-container border-primary' : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  By Site
                </button>
                <button
                  onClick={() => { setPushGroupMode('tag'); setPushGroupValue('') }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    pushGroupMode === 'tag' ? 'bg-primary-container text-on-secondary-container border-primary' : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  By Tag
                </button>
              </div>

              {/* Group selector */}
              <div className="flex flex-wrap gap-2">
                {(pushGroupMode === 'site' ? sites : allTags).map(val => (
                  <button
                    key={val}
                    onClick={() => setPushGroupValue(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      pushGroupValue === val
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Affected devices */}
              {pushGroupValue && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-on-surface">
                    {groupDevices.length} device{groupDevices.length !== 1 ? 's' : ''} will receive this template
                  </p>
                  <div className="bg-surface-container rounded-lg p-3 space-y-1.5 max-h-[12rem] overflow-y-auto">
                    {groupDevices.map(d => (
                      <div key={d.id} className="flex items-center gap-2 text-xs">
                        <Check size={12} className="text-success shrink-0" />
                        <span className="text-on-surface font-medium">{d.name}</span>
                        <span className="text-on-surface-variant">{d.ip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-outline-variant">
                <Button variant="ghost" onClick={() => { openPushDevice(pushGroupModal.template); setPushGroupModal({ open: false, template: null }); }}>
                  <ArrowLeft size={14} /> Push to Device
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPushGroupModal({ open: false, template: null })}>Cancel</Button>
                  <Button onClick={handlePushGroup} disabled={!pushGroupValue || groupDevices.length === 0}>
                    <Users size={14} /> Push to Group
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Version History Modal ────────────────────────────────────── */}
      <Modal
        open={historyModal.open}
        onClose={() => setHistoryModal({ open: false, template: null })}
        title={`Version History: ${historyModal.template?.name || ''}`}
        wide
      >
        {historyModal.template && (() => {
          const t = historyModal.template
          const versions = t.versions
          const verA = versions[selectedVersions.a]
          const verB = versions[selectedVersions.b]

          // Simple line-by-line diff
          const linesA = verA?.content?.split('\n') || t.content.split('\n')
          const linesB = verB?.content?.split('\n') || []

          return (
            <div className="space-y-4">
              {/* Version timeline */}
              <div className="space-y-1">
                {versions.map((v, i) => (
                  <button
                    key={v.v}
                    onClick={() => setSelectedVersions(prev => ({ ...prev, a: i }))}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      i === selectedVersions.a ? 'bg-primary-container/40 border border-primary/30' : 'hover:bg-surface-container border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === selectedVersions.a ? 'bg-primary' : i === 0 ? 'bg-success' : 'bg-outline'}`} />
                      {i < versions.length - 1 && <div className="w-0.5 h-4 bg-outline-variant" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface">{v.v}</span>
                        {i === 0 && <Badge variant="success">Latest</Badge>}
                      </div>
                      <p className="text-xs text-on-surface-variant">{v.date} · {v.author}</p>
                      <p className="text-xs text-on-surface mt-0.5">{v.summary}</p>
                    </div>
                    <History size={14} className="text-on-surface-variant shrink-0" />
                  </button>
                ))}
              </div>

              {/* Diff view */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-on-surface">Changes</p>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <ChevronLeft size={14} />
                    <span>Comparing {verA?.v} → {verB?.v || 'current'}</span>
                    <ChevronRightDouble size={14} />
                  </div>
                </div>
                <div className="bg-surface-container rounded-lg p-4 text-xs font-mono border border-outline-variant max-h-[16rem] overflow-y-auto">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-2 pb-2 border-b border-outline-variant">
                    <Clock size={12} />
                    <span>{verA?.date} → {verB?.date || 'now'}</span>
                  </div>
                  <p className="text-on-surface-variant italic">
                    Version diff viewer — in production this would show a line-by-line diff between {verA?.v} and {verB?.v || 'current'}.
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-on-surface-variant">Template content at {verA?.v}:</p>
                    <pre className="text-on-surface whitespace-pre-wrap">{t.content.split('\n').slice(0, 6).join('\n')}{t.content.split('\n').length > 6 ? '\n...' : ''}</pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-outline-variant">
                <Button variant="ghost" onClick={() => setHistoryModal({ open: false, template: null })}>Close</Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Delete Confirmation ──────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, template: null })}
        onConfirm={handleDelete}
        title="Delete Template"
        message={
          deleteDialog.template?.inUse
            ? `"${deleteDialog.template?.name}" is currently applied to ${deleteDialog.template?.devices} device(s). Deleting it will remove it from all devices. Are you sure?`
            : `Are you sure you want to delete "${deleteDialog.template?.name}"? This action cannot be undone.`
        }
        danger
      />
    </div>
  )
}
