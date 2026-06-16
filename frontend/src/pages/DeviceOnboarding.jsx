import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Server } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Select } from '../components/ui/Input'

const steps = ['Connection', 'Identity', 'Template', 'Hardening', 'Review']

const hardeningOptions = [
  { id: 'telnet', label: 'Disable Telnet', description: 'Turn off unencrypted Telnet service' },
  { id: 'ssh-port', label: 'Change SSH port', description: 'Move SSH from port 22 to custom port' },
  { id: 'ntp', label: 'Set NTP server', description: 'Configure time synchronization' },
  { id: 'dns', label: 'Set DNS servers', description: 'Configure public DNS resolvers' },
  { id: 'unused', label: 'Disable unused services', description: 'Turn off FTP, API, Winbox on unused interfaces' },
  { id: 'firewall', label: 'Apply basic firewall', description: 'Enable default firewall rules' },
]

export default function DeviceOnboarding() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    ip: '', port: '8728', sshPort: '22', username: 'admin', password: '',
    hostname: '', site: '', deviceType: 'router', tags: '',
    template: '', hardening: ['telnet', 'ntp', 'dns', 'firewall'],
  })

  const toggleHardening = (id) => {
    setForm(f => ({
      ...f,
      hardening: f.hardening.includes(id) ? f.hardening.filter(h => h !== id) : [...f.hardening, id],
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/devices" className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
        <ArrowLeft size={14} /> Back to Devices
      </Link>
      <h1 className="text-2xl font-bold text-on-surface">Device Onboarding</h1>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              i < step ? 'bg-primary text-on-primary' : i === step ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-outline'
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-primary' : 'text-outline'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? 'bg-primary' : 'bg-surface-container-high'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {step === 0 && (
          <div className="space-y-4">
            <CardTitle>Connection Details</CardTitle>
            <Input label="IP Address" placeholder="10.0.0.1" value={form.ip} onChange={e => setForm({...form, ip: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="API Port" placeholder="8728" value={form.port} onChange={e => setForm({...form, port: e.target.value})} />
              <Input label="SSH Port" placeholder="22" value={form.sshPort} onChange={e => setForm({...form, sshPort: e.target.value})} />
            </div>
            <Input label="Username" placeholder="admin" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <Button variant="secondary">Test Connection</Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <CardTitle>Identity</CardTitle>
            <Input label="Hostname" placeholder="mt-branch-01" value={form.hostname} onChange={e => setForm({...form, hostname: e.target.value})} />
            <Input label="Site / Location" placeholder="DC Jakarta" value={form.site} onChange={e => setForm({...form, site: e.target.value})} />
            <Select label="Device Type" value={form.deviceType} onChange={e => setForm({...form, deviceType: e.target.value})}>
              <option value="router">Router</option>
              <option value="switch">Switch</option>
              <option value="ap">Access Point</option>
            </Select>
            <Input label="Tags (comma separated)" placeholder="production, core" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <CardTitle>Template (Optional)</CardTitle>
            <Select label="Initial Template" value={form.template} onChange={e => setForm({...form, template: e.target.value})}>
              <option value="">No template</option>
              <option value="ntp">NTP Configuration</option>
              <option value="dns">DNS Configuration</option>
              <option value="hardening">Security Hardening</option>
              <option value="full">Full Base Config</option>
            </Select>
            <p className="text-xs text-on-surface-variant">Template will be applied during onboarding. You can push templates later from the Template Framework.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <CardTitle>Hardening Checklist</CardTitle>
            <p className="text-sm text-on-surface-variant">Select security hardening steps to apply:</p>
            {hardeningOptions.map(opt => (
              <label key={opt.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hardening.includes(opt.id)}
                  onChange={() => toggleHardening(opt.id)}
                  className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-on-surface">{opt.label}</p>
                  <p className="text-xs text-on-surface-variant">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <CardTitle>Review</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">IP Address</span><span className="text-on-surface">{form.ip || '—'}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Hostname</span><span className="text-on-surface">{form.hostname || '—'}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Site</span><span className="text-on-surface">{form.site || '—'}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Device Type</span><span className="text-on-surface">{form.deviceType}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Template</span><span className="text-on-surface">{form.template || 'None'}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Hardening</span><span className="text-on-surface">{form.hardening.length} steps</span></div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ArrowLeft size={16} /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)}>
            Next <ArrowRight size={16} />
          </Button>
        ) : (
          <Button>
            <Server size={16} /> Start Onboarding
          </Button>
        )}
      </div>
    </div>
  )
}
