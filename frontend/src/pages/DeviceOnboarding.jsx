import { useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Check, Server, Loader2, Shield, ClipboardList, Save, ChevronDown, ChevronUp, Zap, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'

const steps = ['Connection', 'Identity', 'Template', 'Hardening', 'Review']
const totalSteps = steps.length

const hardeningOptions = [
  {
    id: 'telnet',
    label: 'Disable Telnet',
    description: 'Turn off the unencrypted Telnet service',
    detail: 'Telnet transmits all data including credentials in plain text. Disabling it forces all administrators to use SSH, which encrypts the entire session. The service will be stopped immediately and disabled from starting on boot.',
  },
  {
    id: 'ssh-port',
    label: 'Change SSH port',
    description: 'Move SSH from port 22 to custom port',
    detail: 'Changing the default SSH port from 22 to a non-standard port reduces automated scanning and brute-force attacks by up to 90%. You will configure the new port number and the firewall will be updated to allow connections only on the new port.',
  },
  {
    id: 'ntp',
    label: 'Set NTP server',
    description: 'Configure time synchronization',
    detail: 'Accurate time is essential for log correlation, certificate validation, and scheduled tasks. This will configure the device to sync with reliable NTP pool servers and set the correct timezone. Proper time synchronization is a prerequisite for many security features.',
  },
  {
    id: 'dns',
    label: 'Set DNS servers',
    description: 'Configure public DNS resolvers',
    detail: 'Sets reliable and fast DNS resolvers (e.g., 1.1.1.1, 8.8.8.8) to replace potentially insecure or slow default DNS. DNS-over-HTTPS can also be configured for encrypted DNS queries, preventing DNS spoofing and eavesdropping.',
  },
  {
    id: 'unused',
    label: 'Disable unused services',
    description: 'Turn off FTP, API, Winbox on unused interfaces',
    detail: 'MikroTik devices run several services by default (FTP, API, API-SSL, Winbox, bandwidth-test, proxy, socks). Each open service is a potential attack surface. This step disables services that are not explicitly needed on interfaces where they are not required.',
  },
  {
    id: 'firewall',
    label: 'Apply basic firewall',
    description: 'Enable default firewall rules',
    detail: 'Applies a baseline firewall policy: drop all invalid connections, accept established/related traffic, allow ICMP for diagnostics, and drop everything else from the WAN interface. This creates a "default deny" posture that is the foundation of network security.',
  },
]

const templatePreview = {
  'ntp': `/system ntp client set enabled=yes mode=unicast
/system ntp client servers add address=0.id.pool.ntp.org
/system ntp client servers add address=1.id.pool.ntp.org
/system clock set time-zone-name=Asia/Jakarta
:log info "NTP configured for ${hostname}"`,
  'dns': `/ip dns set allow-remote-requests=no servers=1.1.1.1,8.8.8.8
/ip dhcp-server network set [ find ] dns-server=1.1.1.1
:log info "DNS configured for ${hostname}"`,
  'hardening': `/service disable telnet,ftp,www,api,api-ssl
/ip service set ssh address=10.0.0.0/8
/ip service set winbox address=10.0.0.0/8
:log info "Hardening applied to ${hostname}"`,
  'full': `# Full Base Config for ${hostname}
/system identity set name=\${hostname}
/system ntp client set enabled=yes
/system ntp client servers add address=0.id.pool.ntp.org
/ip dns set servers=1.1.1.1,8.8.8.8
/service disable telnet,ftp,www,api,api-ssl
/user set [ find name=admin ] password=${admin_pass}
/ip firewall filter add chain=input action=drop connection-state=invalid
/ip firewall filter add chain=input action=accept connection-state=established,related
/ip firewall filter add chain=input action=accept protocol=icmp
/ip firewall filter add chain=input action=drop
:log info "Full config applied to ${hostname}"`,
}

export default function DeviceOnboarding() {
  const [step, setStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    ip: '', port: '8728', sshPort: '22', username: 'admin', password: '',
    authMethod: 'password', // 'password' | 'ssh-key'
    sshKey: '',
    hostname: '', site: '', deviceType: 'router', tags: '',
    template: '', hardening: ['telnet', 'ntp', 'dns', 'firewall'],
  })
  const [errors, setErrors] = useState({})
  const [expandedHardening, setExpandedHardening] = useState(null)
  // Connection test state
  const [connectionTest, setConnectionTest] = useState({
    status: 'idle', // idle | testing | success | failed
    deviceInfo: null, // { model, routerosVersion, currentHostname }
    error: null,
  })
  // Deploy progress modal
  const [deployModal, setDeployModal] = useState({ open: false, progress: 0, phase: '', done: false })

  const updateForm = useCallback((updates) => {
    setForm(prev => ({ ...prev, ...updates }))
    // Clear related errors on change
    const keys = Object.keys(updates)
    setErrors(prev => {
      const next = { ...prev }
      keys.forEach(k => delete next[k])
      return next
    })
  }, [])

  const toggleHardening = (id) => {
    setForm(f => ({
      ...f,
      hardening: f.hardening.includes(id) ? f.hardening.filter(h => h !== id) : [...f.hardening, id],
    }))
  }

  // --- Validation ---
  const validateStep = useCallback((stepIndex) => {
    const newErrors = {}
    if (stepIndex === 0) {
      if (!form.ip.trim()) newErrors.ip = 'IP address is required'
      else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(form.ip.trim())) newErrors.ip = 'Invalid IP address format'
      if (!form.port.trim()) newErrors.port = 'API port is required'
      if (!form.sshPort.trim()) newErrors.sshPort = 'SSH port is required'
      if (!form.username.trim()) newErrors.username = 'Username is required'
      if (form.authMethod === 'password' && !form.password.trim()) newErrors.password = 'Password is required'
      if (form.authMethod === 'ssh-key' && !form.sshKey.trim()) newErrors.sshKey = 'SSH private key is required'
    }
    if (stepIndex === 1) {
      if (!form.hostname.trim()) newErrors.hostname = 'Hostname is required'
      if (!form.site.trim()) newErrors.site = 'Site / Location is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const goNext = () => {
    if (!validateStep(step)) return
    const stepName = steps[step]
    setCompletedSteps(prev => prev.includes(stepName) ? prev : [...prev, stepName])
    setStep(s => Math.min(s + 1, totalSteps - 1))
  }

  const goBack = () => {
    setStep(s => Math.max(s - 1, 0))
  }

  // --- Connection Test ---
  const testConnection = () => {
    setConnectionTest({ status: 'testing', deviceInfo: null, error: null })
    // Simulate 2-second connection test
    setTimeout(() => {
      // Simulate success 80% of the time
      if (form.ip && Math.random() > 0.2) {
        setConnectionTest({
          status: 'success',
          deviceInfo: {
            model: 'RB4011iGS+RM',
            routerosVersion: '7.15.3 (stable)',
            currentHostname: 'MikroTik',
          },
          error: null,
        })
        // Auto-populate hostname if empty
        if (!form.hostname) {
          const suggested = form.site
            ? `mt-${form.site.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-01`
            : 'mt-new-device-01'
          updateForm({ hostname: suggested })
        }
      } else {
        setConnectionTest({
          status: 'failed',
          deviceInfo: null,
          error: 'Could not connect to device. Check IP, port, and credentials.',
        })
      }
    }, 2000)
  }

  // --- Deploy ---
  const startDeploy = () => {
    setDeployModal({ open: true, progress: 0, phase: 'Connecting to device...', done: false })
    // Start simulation after modal renders
    setTimeout(() => simulateDeploy(), 100)
  }

  const simulateDeploy = () => {
    const phases = [
      { p: 10, phase: 'Connecting to device...' },
      { p: 25, phase: 'Verifying credentials...' },
      { p: 40, phase: 'Applying identity settings...' },
      { p: 55, phase: 'Pushing template configuration...' },
      { p: 75, phase: 'Applying hardening rules...' },
      { p: 90, phase: 'Verifying configuration...' },
      { p: 100, phase: 'Done!' },
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < phases.length) {
        setDeployModal(prev => ({ ...prev, progress: phases[i].p, phase: phases[i].phase }))
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setDeployModal(prev => ({ ...prev, done: true }))
        }, 600)
      }
    }, 700)
  }

  // --- Save Draft ---
  const saveDraft = () => {
    const draft = { ...form, savedAt: new Date().toISOString() }
    localStorage.setItem('device-onboarding-draft', JSON.stringify(draft))
    alert('Draft saved successfully!')
  }

  // --- Progress ---
  const progressPercent = success ? 100 : Math.round((step / (totalSteps - 1)) * 100)

  // --- Success Screen ---
  if (success) {
    return (
      <div className="max-w-[28rem] mx-auto space-y-6 pt-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto">
            <Check size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Device Onboarded!</h1>
          <p className="text-on-surface-variant">
            <strong className="text-on-surface">{form.hostname}</strong> at {form.ip} is being configured.
            You can track its progress in the Task Queue.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/tasks">
              <Button className="w-full">
                <ClipboardList size={16} /> View Task Queue
              </Button>
            </Link>
            <Link to="/devices">
              <Button variant="secondary" className="w-full">
                <ArrowLeft size={16} /> Back to Devices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // --- Deploy Progress Modal ---
  if (deployModal.open) {
    return (
      <div className="fixed inset-0 bg-scrim/50 flex items-center justify-center z-50">
        <div className="bg-surface-container-high rounded-2xl p-6 max-w-[24rem] w-full mx-4 space-y-4">
          {!deployModal.done ? (
            <>
              <div className="flex items-center gap-3">
                {!deployModal.done && <Loader2 size={20} className="text-primary animate-spin" />}
                <h3 className="text-lg font-semibold text-on-surface">Deploying Configuration</h3>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${deployModal.progress}%` }}
                  />
                </div>
                <p className="text-sm text-on-surface-variant">{deployModal.phase}</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mx-auto">
                  <Check size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface">Deployment Started!</h3>
                <p className="text-sm text-on-surface-variant">Configuration is being applied to {form.hostname}.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/tasks" onClick={() => { setDeployModal({ open: false, progress: 0, phase: '', done: false }); setSuccess(true) }}>
                  <Button className="w-full">
                    <ClipboardList size={16} /> View Task Queue
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => { setDeployModal({ open: false, progress: 0, phase: '', done: false }); setSuccess(true) }}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[48rem] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/devices" className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ArrowLeft size={14} /> Back to Devices
        </Link>
        <Button variant="ghost" size="sm" onClick={saveDraft}>
          <Save size={14} /> Save as Draft
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-on-surface">Device Onboarding</h1>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant font-medium">
            Step {step + 1} of {totalSteps}: {steps[step]}
          </span>
          <span className="text-primary font-semibold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                  completedSteps.includes(s) ? 'bg-primary text-on-primary' :
                  i === step ? 'bg-primary-container text-primary ring-2 ring-primary' :
                  'bg-surface-container-high text-outline'
                }`}
              >
                {completedSteps.includes(s) ? <Check size={12} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded mx-1 ${
                  completedSteps.includes(steps[i + 1]) || (i < step) ? 'bg-primary' : 'bg-surface-container-high'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <span key={s} className={`text-[10px] font-medium ${
              i === step ? 'text-primary' : completedSteps.includes(s) ? 'text-primary' : 'text-outline'
            }`}>{s}</span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        {/* Step 0: Connection */}
        {step === 0 && (
          <div className="space-y-4">
            <CardTitle>Connection Details</CardTitle>
            <Input
              label="IP Address"
              placeholder="10.0.0.1"
              value={form.ip}
              onChange={e => updateForm({ ip: e.target.value })}
              error={errors.ip}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="API Port"
                placeholder="8728"
                value={form.port}
                onChange={e => updateForm({ port: e.target.value })}
                error={errors.port}
              />
              <Input
                label="SSH Port"
                placeholder="22"
                value={form.sshPort}
                onChange={e => updateForm({ sshPort: e.target.value })}
                error={errors.sshPort}
              />
            </div>

            {/* Auth method toggle */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-on-surface">Authentication Method</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateForm({ authMethod: 'password', sshKey: '' })}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                    form.authMethod === 'password'
                      ? 'bg-primary-container text-on-secondary-container border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => updateForm({ authMethod: 'ssh-key', password: '' })}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                    form.authMethod === 'ssh-key'
                      ? 'bg-primary-container text-on-secondary-container border-primary'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  SSH Key
                </button>
              </div>
            </div>

            <Input
              label="Username"
              placeholder="admin"
              value={form.username}
              onChange={e => updateForm({ username: e.target.value })}
              error={errors.username}
            />

            {form.authMethod === 'password' && (
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => updateForm({ password: e.target.value })}
                error={errors.password}
              />
            )}

            {form.authMethod === 'ssh-key' && (
              <Textarea
                label="SSH Private Key"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                value={form.sshKey}
                onChange={e => updateForm({ sshKey: e.target.value })}
                error={errors.sshKey}
              />
            )}

            {/* Test Connection Button & Result */}
            <Button
              variant="secondary"
              onClick={testConnection}
              disabled={connectionTest.status === 'testing' || !form.ip.trim()}
              className="w-full"
            >
              {connectionTest.status === 'testing' ? (
                <><Loader2 size={16} className="animate-spin" /> Testing Connection...</>
              ) : (
                <><Zap size={16} /> Test Connection</>
              )}
            </Button>

            {connectionTest.status === 'success' && connectionTest.deviceInfo && (
              <div className="rounded-lg border border-primary/30 bg-primary-container/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                  <Check size={16} /> Connection Successful
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-on-surface-variant">Model</span>
                  <span className="text-on-surface font-medium">{connectionTest.deviceInfo.model}</span>
                  <span className="text-on-surface-variant">RouterOS</span>
                  <span className="text-on-surface font-medium">{connectionTest.deviceInfo.routerosVersion}</span>
                  <span className="text-on-surface-variant">Current Hostname</span>
                  <span className="text-on-surface font-medium">{connectionTest.deviceInfo.currentHostname}</span>
                </div>
              </div>
            )}

            {connectionTest.status === 'failed' && (
              <div className="rounded-lg border border-error/30 bg-error-container/40 p-4">
                <div className="flex items-center gap-2 text-error font-medium text-sm">
                  <X size={16} /> Connection Failed
                </div>
                <p className="text-xs text-error mt-1">{connectionTest.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <CardTitle>Identity</CardTitle>
            <Input
              label="Hostname"
              placeholder="mt-branch-01"
              value={form.hostname}
              onChange={e => updateForm({ hostname: e.target.value })}
              error={errors.hostname}
            />
            {connectionTest.deviceInfo && (
              <p className="text-xs text-on-surface-variant">Suggested from connection test. Current device name: {connectionTest.deviceInfo.currentHostname}</p>
            )}
            <Input
              label="Site / Location"
              placeholder="DC Jakarta"
              value={form.site}
              onChange={e => updateForm({ site: e.target.value })}
              error={errors.site}
            />
            <Select
              label="Device Type"
              value={form.deviceType}
              onChange={e => updateForm({ deviceType: e.target.value })}
            >
              <option value="router">Router</option>
              <option value="switch">Switch</option>
              <option value="ap">Access Point</option>
            </Select>
            <Input
              label="Tags (comma separated)"
              placeholder="production, core"
              value={form.tags}
              onChange={e => updateForm({ tags: e.target.value })}
            />
          </div>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <div className="space-y-4">
            <CardTitle>Template (Optional)</CardTitle>
            <Select
              label="Initial Template"
              value={form.template}
              onChange={e => updateForm({ template: e.target.value })}
            >
              <option value="">No template</option>
              <option value="ntp">NTP Configuration</option>
              <option value="dns">DNS Configuration</option>
              <option value="hardening">Security Hardening</option>
              <option value="full">Full Base Config</option>
            </Select>
            <p className="text-xs text-on-surface-variant">Template will be applied during onboarding. You can push templates later from the Template Framework.</p>

            {/* Template Preview */}
            {form.template && templatePreview[form.template] && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface">Template Preview</p>
                <pre className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 text-xs text-on-surface font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {templatePreview[form.template]}
                </pre>
                <p className="text-[10px] text-on-surface-variant">
                  Variables like {'${hostname}'} will be replaced with actual values during deployment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Hardening */}
        {step === 3 && (
          <div className="space-y-4">
            <CardTitle>Hardening Checklist</CardTitle>
            <p className="text-sm text-on-surface-variant">Select security hardening steps to apply:</p>
            {hardeningOptions.map(opt => (
              <div
                key={opt.id}
                className="rounded-lg border border-outline-variant hover:border-primary/30 transition-colors"
              >
                <label className="flex items-start gap-3 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hardening.includes(opt.id)}
                    onChange={() => toggleHardening(opt.id)}
                    className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">{opt.label}</p>
                    <p className="text-xs text-on-surface-variant">{opt.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedHardening(expandedHardening === opt.id ? null : opt.id)
                    }}
                    className="shrink-0 p-1 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {expandedHardening === opt.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </label>
                {expandedHardening === opt.id && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="bg-surface-container rounded-md p-3 text-xs text-on-surface-variant leading-relaxed border border-outline-variant/50">
                      {opt.detail}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <CardTitle>Review & Deploy</CardTitle>

            {/* Connection Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <Server size={14} /> Connection
              </h4>
              <div className="bg-surface-container-lowest rounded-lg p-3 space-y-1.5 text-sm border border-outline-variant">
                <div className="flex justify-between"><span className="text-on-surface-variant">IP Address</span><span className="text-on-surface font-medium">{form.ip || '—'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">API Port</span><span className="text-on-surface font-medium">{form.port}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">SSH Port</span><span className="text-on-surface font-medium">{form.sshPort}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Username</span><span className="text-on-surface font-medium">{form.username}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Auth Method</span><span className="text-on-surface font-medium">{form.authMethod === 'password' ? 'Password' : 'SSH Key'}</span></div>
                {connectionTest.deviceInfo && (
                  <>
                    <div className="border-t border-outline-variant my-1.5" />
                    <div className="flex justify-between"><span className="text-on-surface-variant">Model</span><span className="text-on-surface font-medium">{connectionTest.deviceInfo.model}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">RouterOS</span><span className="text-on-surface font-medium">{connectionTest.deviceInfo.routerosVersion}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Identity Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <Shield size={14} /> Identity
              </h4>
              <div className="bg-surface-container-lowest rounded-lg p-3 space-y-1.5 text-sm border border-outline-variant">
                <div className="flex justify-between"><span className="text-on-surface-variant">Hostname</span><span className="text-on-surface font-medium">{form.hostname || '—'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Site</span><span className="text-on-surface font-medium">{form.site || '—'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Device Type</span><span className="text-on-surface font-medium">{form.deviceType}</span></div>
                {form.tags && (
                  <div className="flex justify-between"><span className="text-on-surface-variant">Tags</span><span className="text-on-surface font-medium">{form.tags}</span></div>
                )}
              </div>
            </div>

            {/* Template Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <ClipboardList size={14} /> Template & Hardening
              </h4>
              <div className="bg-surface-container-lowest rounded-lg p-3 space-y-1.5 text-sm border border-outline-variant">
                <div className="flex justify-between"><span className="text-on-surface-variant">Template</span><span className="text-on-surface font-medium">{form.template || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Hardening Steps</span><span className="text-on-surface font-medium">{form.hardening.length} selected</span></div>
                {form.hardening.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {form.hardening.map(id => {
                      const opt = hardeningOptions.find(o => o.id === id)
                      return (
                        <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-container text-primary">
                          {opt?.label || id}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Deploy Button */}
            <Button className="w-full" size="lg" onClick={startDeploy}>
              <Server size={16} /> Deploy Configuration
            </Button>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={goBack} disabled={step === 0}>
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          {steps.map((s, i) => (
            <span key={s} className={`w-2 h-2 rounded-full ${
              i === step ? 'bg-primary' : completedSteps.includes(s) ? 'bg-primary/40' : 'bg-surface-container-high'
            }`} />
          ))}
        </div>
        {step === 4 ? (
          <Button size="lg" onClick={startDeploy}>
            <Server size={16} /> Deploy
          </Button>
        ) : (
          <Button onClick={goNext}>
            Next <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}
