import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, Upload, FileText, AlertTriangle, Download, Pause, Play, X, RotateCcw, FileDown, Server, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { mockDevices } from '../mock/data'

const STEPS = ['Template', 'Upload', 'Validate', 'Import', 'Results']

const CSV_COLUMNS = [
  { key: 'hostname', label: 'hostname', required: true, description: 'Unique device hostname' },
  { key: 'ip', label: 'ip', required: true, description: 'IP address (e.g. 10.0.0.1)' },
  { key: 'port', label: 'port', required: false, description: 'API port (default: 8728)' },
  { key: 'username', label: 'username', required: true, description: 'API/SSH username' },
  { key: 'password', label: 'password', required: true, description: 'API/SSH password' },
  { key: 'site', label: 'site', required: false, description: 'Site or location name' },
  { key: 'device_type', label: 'device_type', required: false, description: 'router, switch, or ap' },
  { key: 'tags', label: 'tags', required: false, description: 'Comma-separated tags' },
]

const IMPORT_STAGES = ['pending', 'connecting', 'configuring', 'done', 'failed']

function generateMockCSVContent() {
  const header = CSV_COLUMNS.map(c => c.label).join(',')
  const rows = mockDevices.map(d =>
    [d.hostname, d.ip, '8728', 'admin', 'changeme', d.site, 'router', d.tags.join(';')].join(',')
  )
  // Add a row with errors for demo
  rows.push(',10.0.99.1,8728,,,DC Jakarta,router,')
  // Add a duplicate IP for warning demo
  rows.push(['mt-dup-01', '10.0.0.1', '8728', 'admin', 'secret', 'DC Jakarta', 'switch', 'test'].join(','))
  return [header, ...rows].join('\n')
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim())
    const row = { _line: idx + 2 }
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
  return { headers, rows }
}

function validateRow(row, allRows, idx) {
  const errors = []
  const warnings = []

  // Required fields
  if (!row.hostname) errors.push('Missing hostname')
  if (!row.ip) errors.push('Missing IP address')
  if (!row.username) errors.push('Missing username')
  if (!row.password) errors.push('Missing password')

  // IP format check
  if (row.ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(row.ip)) {
    errors.push('Invalid IP format')
  }

  // Port check
  if (row.port && (isNaN(Number(row.port)) || Number(row.port) < 1 || Number(row.port) > 65535)) {
    errors.push('Invalid port number')
  }

  // Duplicate IP check
  if (row.ip) {
    const dupIdx = allRows.findIndex((r, i) => i !== idx && r.ip === row.ip)
    if (dupIdx !== -1) warnings.push(`Duplicate IP with row ${dupIdx + 2}`)
  }

  // Duplicate hostname check
  if (row.hostname) {
    const dupIdx = allRows.findIndex((r, i) => i !== idx && r.hostname === row.hostname)
    if (dupIdx !== -1) warnings.push(`Duplicate hostname with row ${dupIdx + 2}`)
  }

  return { errors, warnings }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
              i < currentStep
                ? 'bg-success text-on-success'
                : i === currentStep
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-outline'
            }`}>
              {i < currentStep ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${
              i === currentStep ? 'text-primary' : i < currentStep ? 'text-success' : 'text-outline'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight size={14} className={`shrink-0 ${i < currentStep ? 'text-success' : 'text-outline-variant'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MassImport() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [csvData, setCsvData] = useState(null)
  const [validatedRows, setValidatedRows] = useState([])
  const [importDevices, setImportDevices] = useState([])
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const importTimerRef = useRef(null)
  const pausedRef = useRef(false)

  // Parse and validate when file is uploaded
  useEffect(() => {
    if (file && file.content) {
      const { headers, rows } = parseCSV(file.content)
      const validated = rows.map((row, idx) => {
        const { errors, warnings } = validateRow(row, rows, idx)
        return { ...row, errors, warnings, valid: errors.length === 0 }
      })
      setCsvData({ headers, rows: validated })
      setValidatedRows(validated)
    }
  }, [file])

  // Simulate import progress
  const startImport = useCallback(() => {
    const validRows = validatedRows.filter(r => r.valid)
    const devices = validRows.map((row, idx) => ({
      id: idx,
      hostname: row.hostname,
      ip: row.ip,
      site: row.site || '—',
      status: 'pending',
      error: null,
    }))
    // Inject a couple failures for demo
    if (devices.length > 2) {
      devices[1].willFail = true
      if (devices.length > 4) devices[3].willFail = true
    }
    setImportDevices(devices)
    setIsImporting(true)
    setIsPaused(false)
    pausedRef.current = false
    setImportProgress(0)
    setImportDone(false)

    let currentIdx = 0
    const total = devices.length

    const tick = () => {
      if (pausedRef.current) {
        importTimerRef.current = setTimeout(tick, 500)
        return
      }

      if (currentIdx >= total) {
        setIsImporting(false)
        setImportDone(true)
        setImportProgress(100)
        return
      }

      setImportDevices(prev => prev.map((d, i) => {
        if (i === currentIdx) {
          if (d.status === 'pending') return { ...d, status: 'connecting' }
          if (d.status === 'connecting') return { ...d, status: 'configuring' }
          if (d.status === 'configuring') {
            if (d.willFail) return { ...d, status: 'failed', error: 'Connection refused — check API credentials' }
            return { ...d, status: 'done' }
          }
        }
        return d
      }))

      setImportProgress(Math.round((currentIdx / total) * 100))
      currentIdx++
      importTimerRef.current = setTimeout(tick, 1200)
    }

    importTimerRef.current = setTimeout(tick, 500)
  }, [validatedRows])

  const togglePause = () => {
    setIsPaused(p => {
      pausedRef.current = !p
      return !p
    })
  }

  const cancelImport = () => {
    if (importTimerRef.current) clearTimeout(importTimerRef.current)
    setIsImporting(false)
    setIsPaused(false)
    pausedRef.current = false
    setImportDevices(prev => prev.map(d =>
      d.status === 'pending' || d.status === 'connecting' || d.status === 'configuring'
        ? { ...d, status: 'failed', error: 'Cancelled by user' }
        : d
    ))
    setImportDone(true)
  }

  const retryFailed = () => {
    const failedCount = importDevices.filter(d => d.status === 'failed').length
    if (failedCount === 0) return
    // Reset failed devices to pending
    setImportDevices(prev => prev.map(d =>
      d.status === 'failed' ? { ...d, status: 'pending', error: null, willFail: false } : d
    ))
    setIsImporting(true)
    setIsPaused(false)
    pausedRef.current = false
    setImportDone(false)

    const failedDevices = importDevices.filter(d => d.status === 'failed')
    let currentIdx = 0
    const total = failedDevices.length

    const tick = () => {
      if (pausedRef.current) {
        importTimerRef.current = setTimeout(tick, 500)
        return
      }
      if (currentIdx >= total) {
        setIsImporting(false)
        setImportDone(true)
        setImportProgress(100)
        return
      }

      const targetHostname = failedDevices[currentIdx].hostname
      setImportDevices(prev => prev.map(d => {
        if (d.hostname === targetHostname && d.status === 'failed') {
          return { ...d, status: 'connecting' }
        }
        if (d.hostname === targetHostname && d.status === 'connecting') {
          return { ...d, status: 'configuring' }
        }
        if (d.hostname === targetHostname && d.status === 'configuring') {
          return { ...d, status: 'done' }
        }
        return d
      }))

      currentIdx++
      importTimerRef.current = setTimeout(tick, 1200)
    }

    importTimerRef.current = setTimeout(tick, 500)
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        content: e.target.result,
      })
    }
    reader.readAsText(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const downloadTemplate = () => {
    const header = CSV_COLUMNS.map(c => c.label).join(',')
    const example = ['mt-router-01', '10.0.0.1', '8728', 'admin', 'password123', 'DC Jakarta', 'router', 'production;core'].join(',')
    const csvContent = `${header}\n${example}\n`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mass_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadReport = () => {
    const lines = ['hostname,ip,site,status,error']
    importDevices.forEach(d => {
      lines.push(`${d.hostname},${d.ip},${d.site},${d.status},${d.error || ''}`)
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import_report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadDemoData = () => {
    const content = generateMockCSVContent()
    setFile({
      name: 'demo_import.csv',
      size: content.length,
      content,
    })
  }

  const validCount = validatedRows.filter(r => r.valid).length
  const invalidCount = validatedRows.filter(r => !r.valid).length
  const warningCount = validatedRows.reduce((acc, r) => acc + r.warnings.length, 0)

  const successCount = importDevices.filter(d => d.status === 'done').length
  const failedCount = importDevices.filter(d => d.status === 'failed').length
  const skippedCount = validatedRows.filter(r => !r.valid).length

  const statusIcon = (status) => {
    switch (status) {
      case 'done': return <Check size={14} className="text-success" />
      case 'failed': return <X size={14} className="text-error" />
      case 'connecting': return <div className="w-3.5 h-3.5 rounded-full border-2 border-info border-t-transparent animate-spin" />
      case 'configuring': return <div className="w-3.5 h-3.5 rounded-full border-2 border-warning border-t-transparent animate-spin" />
      default: return <div className="w-3.5 h-3.5 rounded-full bg-surface-container-high" />
    }
  }

  const statusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'connecting': return 'Connecting'
      case 'configuring': return 'Configuring'
      case 'done': return 'Done'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  return (
    <div className="max-w-[64rem] mx-auto space-y-6">
      <Link to="/devices" className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
        <ArrowLeft size={14} /> Back to Devices
      </Link>
      <h1 className="text-2xl font-bold text-on-surface">Mass Import Devices</h1>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Step 1 — Download Template */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Download CSV Template</CardTitle>
          </CardHeader>
          <p className="text-sm text-on-surface-variant mb-4">
            Download the CSV template with the required columns, fill in your device data, then upload it in the next step.
          </p>
          <div className="bg-surface-container rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-on-surface mb-3">CSV Columns</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CSV_COLUMNS.map(col => (
                <div key={col.key} className="flex items-start gap-2 text-sm">
                  <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded text-primary font-mono shrink-0">
                    {col.label}
                  </code>
                  <div>
                    <span className="text-on-surface-variant">{col.description}</span>
                    {col.required && <span className="text-error ml-1">*</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadTemplate}>
              <Download size={16} /> Download CSV Template
            </Button>
            <Button variant="secondary" onClick={loadDemoData}>
              <FileText size={16} /> Load Demo Data
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 — Upload File */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Upload CSV File</CardTitle>
          </CardHeader>
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-primary bg-primary/5'
                : file
                  ? 'border-success bg-success/5'
                  : 'border-outline-variant hover:border-primary hover:bg-surface-container'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            {file ? (
              <div className="space-y-2">
                <FileText size={40} className="mx-auto text-success" />
                <p className="text-base font-medium text-on-surface">{file.name}</p>
                <p className="text-sm text-on-surface-variant">{formatFileSize(file.size)}</p>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                >
                  Remove and choose another file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload size={40} className="mx-auto text-outline" />
                <div>
                  <p className="text-base font-medium text-on-surface">
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    or click to browse — supports .csv and .xlsx
                  </p>
                </div>
              </div>
            )}
          </div>
          {file && (
            <div className="mt-4 p-3 bg-success-container rounded-lg flex items-center gap-2">
              <Check size={16} className="text-success" />
              <span className="text-sm text-on-success-container">
                File loaded — {validatedRows.length} rows detected
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Step 3 — Preview & Validate */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-success">{validCount}</p>
              <p className="text-xs text-on-surface-variant mt-1">Valid Rows</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-error">{invalidCount}</p>
              <p className="text-xs text-on-surface-variant mt-1">Invalid Rows</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-warning">{warningCount}</p>
              <p className="text-xs text-on-surface-variant mt-1">Warnings</p>
            </Card>
          </div>

          {/* Validation Table */}
          <Card>
            <CardHeader>
              <CardTitle>Preview & Validation</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="text-left px-5 py-2 text-xs font-semibold text-on-surface-variant">#</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Hostname</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">IP</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Port</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Username</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Site</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-outline-variant/50 ${
                        !row.valid ? 'bg-error/5' : row.warnings.length > 0 ? 'bg-warning/5' : ''
                      }`}
                    >
                      <td className="px-5 py-2.5 text-on-surface-variant font-mono text-xs">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <span className={!row.hostname ? 'text-error italic' : 'text-on-surface'}>
                          {row.hostname || '(empty)'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={row.errors.some(e => e.includes('IP')) ? 'text-error' : 'text-on-surface'}>
                          {row.ip || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-on-surface">{row.port || '8728'}</td>
                      <td className="px-3 py-2.5">
                        <span className={!row.username ? 'text-error italic' : 'text-on-surface'}>
                          {row.username || '(empty)'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-on-surface">{row.site || '—'}</td>
                      <td className="px-3 py-2.5 text-on-surface">{row.device_type || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {row.valid ? (
                            <Check size={14} className="text-success" />
                          ) : (
                            <X size={14} className="text-error" />
                          )}
                          {!row.valid && (
                            <span className="text-xs text-error">{row.errors[0]}</span>
                          )}
                          {row.valid && row.warnings.length > 0 && (
                            <span className="text-xs text-warning flex items-center gap-1">
                              <AlertTriangle size={12} /> {row.warnings[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {invalidCount > 0 && (
            <Card className="border-error/30 bg-error/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-error shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-error">{invalidCount} row(s) have errors</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Invalid rows will be skipped during import. Fix the errors in your CSV and re-upload, or proceed to import only valid rows.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 4 — Import Progress */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Progress</CardTitle>
              <div className="flex items-center gap-2">
                {isImporting && !isPaused && (
                  <Badge variant="info">Importing...</Badge>
                )}
                {isPaused && (
                  <Badge variant="warning">Paused</Badge>
                )}
                {importDone && (
                  <Badge variant="online">Complete</Badge>
                )}
              </div>
            </CardHeader>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-on-surface-variant">
                  {importDevices.filter(d => d.status === 'done').length} of {importDevices.length} devices
                </span>
                <span className="text-on-surface font-medium">{importProgress}%</span>
              </div>
              <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            {isImporting && (
              <div className="flex gap-2 mb-4">
                <Button variant="secondary" size="sm" onClick={togglePause}>
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="danger" size="sm" onClick={cancelImport}>
                  <X size={14} /> Cancel
                </Button>
              </div>
            )}

            {/* Device Status List */}
            <div className="space-y-2">
              {importDevices.map((device) => (
                <div
                  key={device.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    device.status === 'done'
                      ? 'border-success/30 bg-success/5'
                      : device.status === 'failed'
                        ? 'border-error/30 bg-error/5'
                        : device.status === 'configuring'
                          ? 'border-warning/30 bg-warning/5'
                          : device.status === 'connecting'
                            ? 'border-info/30 bg-info/5'
                            : 'border-outline-variant/30 bg-surface-container-low'
                  }`}
                >
                  {statusIcon(device.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface truncate">{device.hostname}</span>
                      <span className="text-xs text-on-surface-variant">{device.ip}</span>
                    </div>
                    {device.error && (
                      <p className="text-xs text-error mt-0.5">{device.error}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${
                    device.status === 'done' ? 'text-success' :
                    device.status === 'failed' ? 'text-error' :
                    device.status === 'configuring' ? 'text-warning' :
                    device.status === 'connecting' ? 'text-info' :
                    'text-outline'
                  }`}>
                    {statusLabel(device.status)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Step 5 — Results */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center py-5 border-success/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Check size={20} className="text-success" />
                <p className="text-2xl font-bold text-success">{successCount}</p>
              </div>
              <p className="text-xs text-on-surface-variant">Successful</p>
            </Card>
            <Card className="text-center py-5 border-error/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <X size={20} className="text-error" />
                <p className="text-2xl font-bold text-error">{failedCount}</p>
              </div>
              <p className="text-xs text-on-surface-variant">Failed</p>
            </Card>
            <Card className="text-center py-5 border-warning/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle size={20} className="text-warning" />
                <p className="text-2xl font-bold text-warning">{skippedCount}</p>
              </div>
              <p className="text-xs text-on-surface-variant">Skipped (invalid)</p>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="text-left px-5 py-2 text-xs font-semibold text-on-surface-variant">Hostname</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">IP</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Site</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Status</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {importDevices.map((device) => (
                    <tr key={device.id} className="border-b border-outline-variant/50">
                      <td className="px-5 py-2.5 font-medium text-on-surface">{device.hostname}</td>
                      <td className="px-3 py-2.5 text-on-surface">{device.ip}</td>
                      <td className="px-3 py-2.5 text-on-surface">{device.site}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={device.status === 'done' ? 'online' : 'offline'}>
                          {device.status === 'done' ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        {device.error ? (
                          <span className="text-xs text-error">{device.error}</span>
                        ) : device.status === 'done' ? (
                          <span className="text-xs text-success">Imported successfully</span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {failedCount > 0 && (
              <Button variant="secondary" onClick={retryFailed}>
                <RotateCcw size={16} /> Retry Failed ({failedCount})
              </Button>
            )}
            <Button variant="secondary" onClick={downloadReport}>
              <FileDown size={16} /> Download Report
            </Button>
            <Link to="/devices">
              <Button>
                <Server size={16} /> View Devices
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ArrowLeft size={16} /> Back
        </Button>
        {step === 0 && (
          <Button onClick={() => setStep(1)}>
            Next <ArrowRight size={16} />
          </Button>
        )}
        {step === 1 && (
          <Button onClick={() => setStep(2)} disabled={!file}>
            Validate <ArrowRight size={16} />
          </Button>
        )}
        {step === 2 && (
          <Button onClick={() => { setStep(3); setTimeout(startImport, 300) }} disabled={validCount === 0}>
            Import {validCount} Device{validCount !== 1 ? 's' : ''} <ArrowRight size={16} />
          </Button>
        )}
        {step === 3 && importDone && (
          <Button onClick={() => setStep(4)}>
            View Results <ArrowRight size={16} />
          </Button>
        )}
        {step === 4 && (
          <Button variant="secondary" onClick={() => {
            setStep(0)
            setFile(null)
            setCsvData(null)
            setValidatedRows([])
            setImportDevices([])
            setImportProgress(0)
            setIsImporting(false)
            setImportDone(false)
          }}>
            <RotateCcw size={16} /> Start New Import
          </Button>
        )}
      </div>
    </div>
  )
}
