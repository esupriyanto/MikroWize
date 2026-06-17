import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Upload, Search, Download, Wrench, HardDrive,
  ChevronUp, ChevronDown, ChevronsUpDown, X, FileUp, Trash2, Tag, BookTemplate
} from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { mockDevices } from '../mock/data'

const statusVariant = { online: 'online', offline: 'offline', warning: 'warning' }

const DEVICE_TYPES = ['all', 'router', 'switch', 'ap']
const TEMPLATES = ['NTP Config', 'SNMP Config', 'Firewall Rules', 'Interface Config', 'Backup Schedule']

function getDeviceType(model) {
  const m = model.toLowerCase()
  if (m.includes('ap') || m.includes('cap')) return 'ap'
  if (m.includes('sw') || m.includes('crs') || m.includes('css')) return 'switch'
  return 'router'
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) return <ChevronsUpDown size={12} className="text-outline" />
  return sortConfig.direction === 'asc'
    ? <ChevronUp size={12} className="text-primary" />
    : <ChevronDown size={12} className="text-primary" />
}

function ImportModal({ open, onClose }) {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')

  if (!open) return null

  const handleFile = (file) => {
    if (file) setFileName(file.name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-surface-container-low rounded-xl border border-outline-variant w-full max-w-[32rem] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Import Devices from CSV</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-high">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files[0])
          }}
        >
          <FileUp size={40} className="mx-auto text-outline mb-3" />
          {fileName ? (
            <p className="text-sm text-on-surface font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-sm text-on-surface mb-1">Drag & drop your CSV file here</p>
              <p className="text-xs text-on-surface-variant mb-3">or</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload size={14} />
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-4 p-3 bg-surface-container rounded-lg">
          <p className="text-xs text-on-surface-variant font-medium mb-1">Expected CSV columns:</p>
          <p className="text-xs text-on-surface-variant font-mono">hostname, ip, model, routerOsVersion, site</p>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!fileName}>
            <Upload size={14} /> Import
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-surface-container-low rounded-xl border border-outline-variant w-full max-w-[24rem] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-on-surface mb-2">{title}</h2>
        <p className="text-sm text-on-surface-variant mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

export default function DeviceInventory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [siteFilter, setSiteFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [rosFilter, setRosFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selected, setSelected] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [bulkTag, setBulkTag] = useState('')
  const [bulkTemplate, setBulkTemplate] = useState('')
  const [bulkTemplateOpen, setBulkTemplateOpen] = useState(false)
  const [bulkTagOpen, setBulkTagOpen] = useState(false)

  const perPage = 10

  // Derive unique sites and ROS versions from data
  const sites = useMemo(() => {
    const s = new Set(mockDevices.map(d => d.site))
    return ['all', ...Array.from(s).sort()]
  }, [])

  const rosVersions = useMemo(() => {
    const v = new Set(mockDevices.map(d => d.routerOsVersion))
    return ['all', ...Array.from(v).sort()]
  }, [])

  // Filter
  const filtered = useMemo(() => {
    return mockDevices.filter(d => {
      const matchSearch = d.hostname.toLowerCase().includes(search.toLowerCase()) || d.ip.includes(search)
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      const matchSite = siteFilter === 'all' || d.site === siteFilter
      const matchType = typeFilter === 'all' || getDeviceType(d.model) === typeFilter
      const matchRos = rosFilter === 'all' || d.routerOsVersion === rosFilter
      return matchSearch && matchStatus && matchSite && matchType && matchRos
    })
  }, [search, statusFilter, siteFilter, typeFilter, rosFilter])

  // Sort
  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered
    return [...filtered].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortConfig])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage)

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { online: 0, offline: 0, warning: 0 }
    filtered.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++ })
    return counts
  }, [filtered])

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        return { key: null, direction: 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map(d => d.id)))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSiteFilter('all')
    setTypeFilter('all')
    setRosFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = search || statusFilter !== 'all' || siteFilter !== 'all' || typeFilter !== 'all' || rosFilter !== 'all'

  const selectedCount = selected.size

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Device Inventory</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Showing {paginated.length} of {filtered.length} devices
            {filtered.length > 0 && (
              <span className="ml-1">
                ({statusCounts.online} online, {statusCounts.offline} offline, {statusCounts.warning} warning)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/devices/onboard">
            <Button size="sm"><Plus size={16} /> Add Device</Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> Import CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[14rem] max-w-[20rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search by hostname, IP..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="warning">Warning</option>
        </select>

        <select
          value={siteFilter}
          onChange={(e) => { setSiteFilter(e.target.value); setCurrentPage(1) }}
          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
        >
          {sites.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Sites' : s}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
        >
          {DEVICE_TYPES.map(t => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Types' : t === 'ap' ? 'Access Point' : t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={rosFilter}
          onChange={(e) => { setRosFilter(e.target.value); setCurrentPage(1) }}
          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface"
        >
          {rosVersions.map(v => (
            <option key={v} value={v}>{v === 'all' ? 'All RouterOS' : 'v' + v}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X size={14} /> Clear
          </Button>
        )}

        <Button variant="ghost" size="sm"><Download size={16} /> Export</Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-primary-container/30 border border-primary/30 rounded-xl">
          <span className="text-sm font-medium text-primary mr-2">
            {selectedCount} selected
          </span>

          {/* Assign Template */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setBulkTemplateOpen(!bulkTemplateOpen); setBulkTagOpen(false) }}
            >
              <BookTemplate size={14} /> Assign Template
            </Button>
            {bulkTemplateOpen && (
              <div className="absolute top-full left-0 mt-1 bg-surface-container-low border border-outline-variant rounded-lg shadow-lg z-10 w-48">
                <div className="p-2">
                  <select
                    value={bulkTemplate}
                    onChange={(e) => setBulkTemplate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface-container-lowest rounded border border-outline-variant text-sm text-on-surface"
                  >
                    <option value="">Select template...</option>
                    {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex justify-end gap-1 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setBulkTemplateOpen(false)}>Cancel</Button>
                    <Button size="sm" disabled={!bulkTemplate} onClick={() => { setBulkTemplateOpen(false); setBulkTemplate('') }}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assign Tag */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setBulkTagOpen(!bulkTagOpen); setBulkTemplateOpen(false) }}
            >
              <Tag size={14} /> Assign Tag
            </Button>
            {bulkTagOpen && (
              <div className="absolute top-full left-0 mt-1 bg-surface-container-low border border-outline-variant rounded-lg shadow-lg z-10 w-56">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Enter tag name..."
                    value={bulkTag}
                    onChange={(e) => setBulkTag(e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface-container-lowest rounded border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                  <div className="flex justify-end gap-1 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setBulkTagOpen(false)}>Cancel</Button>
                    <Button size="sm" disabled={!bulkTag} onClick={() => { setBulkTagOpen(false); setBulkTag('') }}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button variant="secondary" size="sm">
            <HardDrive size={14} /> Trigger Backup
          </Button>

          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selected.size > 0 && selected.size < paginated.length
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-outline-variant accent-primary"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('hostname')}
                >
                  <span className="inline-flex items-center gap-1">
                    Hostname <SortIcon column="hostname" sortConfig={sortConfig} />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('ip')}
                >
                  <span className="inline-flex items-center gap-1">
                    IP Address <SortIcon column="ip" sortConfig={sortConfig} />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('model')}
                >
                  <span className="inline-flex items-center gap-1">
                    Model <SortIcon column="model" sortConfig={sortConfig} />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('routerOsVersion')}
                >
                  <span className="inline-flex items-center gap-1">
                    RouterOS <SortIcon column="routerOsVersion" sortConfig={sortConfig} />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('site')}
                >
                  <span className="inline-flex items-center gap-1">
                    Site <SortIcon column="site" sortConfig={sortConfig} />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('status')}
                >
                  <span className="inline-flex items-center gap-1">
                    Status <SortIcon column="status" sortConfig={sortConfig} />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-on-surface-variant cursor-pointer select-none hover:text-on-surface"
                  onClick={() => handleSort('alerts')}
                >
                  <span className="inline-flex items-center gap-1">
                    Alerts <SortIcon column="alerts" sortConfig={sortConfig} />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                    No devices found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map(device => (
                  <tr
                    key={device.id}
                    className={`border-b border-outline-variant last:border-0 transition-colors ${
                      selected.has(device.id)
                        ? 'bg-primary-container/20'
                        : 'hover:bg-surface-container'
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(device.id)}
                        onChange={() => toggleSelect(device.id)}
                        className="w-4 h-4 rounded border-outline-variant accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/devices/${device.id}`} className="text-sm font-medium text-primary hover:underline">
                        {device.hostname}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface">{device.ip}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{device.model}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">v{device.routerOsVersion}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{device.site}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[device.status]}>{device.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface">{device.alerts}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/troubleshoot/${device.id}`} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                          <Wrench size={14} className="text-on-surface-variant" />
                        </Link>
                        <button className="p-1.5 rounded-lg hover:bg-surface-container-high">
                          <HardDrive size={14} className="text-on-surface-variant" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > perPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-surface-container">
            <p className="text-sm text-on-surface-variant">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? '' : ''}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <ConfirmModal
        open={deleteConfirm}
        title="Delete Devices"
        message={`Are you sure you want to delete ${selectedCount} selected device(s)? This action cannot be undone.`}
        onConfirm={() => { setDeleteConfirm(false); setSelected(new Set()) }}
        onCancel={() => setDeleteConfirm(false)}
      />

      {/* Click-away handlers for dropdowns */}
      {(bulkTemplateOpen || bulkTagOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => { setBulkTemplateOpen(false); setBulkTagOpen(false) }}
        />
      )}
    </div>
  )
}
