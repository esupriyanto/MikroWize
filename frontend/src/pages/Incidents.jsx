import { useState } from 'react'
import { AlertTriangle, Plus, Link, UserPlus, CheckCircle, Clock, FileText, Download, Filter } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input, { Textarea } from '../components/ui/Input'

const mockIncidents = [
  { id: '1', title: 'BGP Session Flap — mt-core-01', status: 'investigating', severity: 'critical', devices: ['mt-core-01'], started: '2026-06-16T11:30:00Z', duration: '1h 30m', alerts: 3 },
  { id: '2', title: 'High CPU — mt-pppoe-con', status: 'open', severity: 'warning', devices: ['mt-pppoe-con'], started: '2026-06-16T12:55:00Z', duration: '5m', alerts: 2 },
  { id: '3', title: 'AP Offline — mt-ap-lobby', status: 'open', severity: 'critical', devices: ['mt-ap-lobby'], started: '2026-06-15T18:30:00Z', duration: '18h 30m', alerts: 1 },
  { id: '4', title: 'Interface Errors — mt-core-01 ether1', status: 'resolved', severity: 'warning', devices: ['mt-core-01'], started: '2026-06-16T08:00:00Z', duration: '2h 15m', alerts: 1 },
]

const timelineEvents = {
  '1': [
    { time: '11:30', type: 'alert', text: 'BGP session flap detected on mt-core-01', icon: AlertTriangle, color: 'error' },
    { time: '11:32', type: 'ai', text: 'AI Analysis: Peer 10.0.0.4 transitioned to Idle. 67 prefixes lost.', icon: CheckCircle, color: 'primary' },
    { time: '11:35', type: 'action', text: 'Auto-remediation suggested: Clear BGP session (confidence: 72%)', icon: Clock, color: 'warning' },
    { time: '11:40', type: 'user', text: 'Eko Supriyanto approved remediation', icon: UserPlus, color: 'success' },
  ],
  '2': [
    { time: '12:55', type: 'alert', text: 'CPU usage above 75% threshold on mt-pppoe-con', icon: AlertTriangle, color: 'error' },
    { time: '12:56', type: 'alert', text: 'RAM usage above 80% threshold on mt-pppoe-con', icon: AlertTriangle, color: 'error' },
  ],
}

const postMortemTemplate = `## Incident Post-Mortem: {{title}}

**Date:** {{date}}
**Duration:** {{duration}}
**Severity:** {{severity}}
**Affected Devices:** {{devices}}

### Summary
{{summary}}

### Timeline
{{timeline}}

### Root Cause
{{rootCause}}

### Impact
{{impact}}

### Resolution
{{resolution}}

### Recommendations
1. {{rec1}}
2. {{rec2}}
3. {{rec3}}
`

export default function Incidents() {
  const [incidents, setIncidents] = useState(mockIncidents)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newIncident, setNewIncident] = useState({ title: '', severity: 'warning', devices: '', description: '' })
  const [newNote, setNewNote] = useState('')

  const filtered = incidents.filter(i => filterStatus === 'all' || i.status === filterStatus)

  const updateStatus = (id, status) => {
    setIncidents(prev => prev.map(i => i.id === id ? {...i, status} : i))
  }

  const exportPDF = (incident) => {
    const content = postMortemTemplate
      .replace('{{title}}', incident.title)
      .replace('{{date}}', new Date(incident.started).toLocaleDateString())
      .replace('{{duration}}', incident.duration)
      .replace('{{severity}}', incident.severity)
      .replace('{{devices}}', incident.devices.join(', '))
      .replace('{{summary}}', 'This is an AI-generated summary of the incident.')
      .replace('{{timeline}}', (timelineEvents[incident.id] || []).map(e => `- ${e.time}: ${e.text}`).join('\n'))
      .replace('{{rootCause}}', '[AI will analyze and fill this section]')
      .replace('{{impact}}', `Affected ${incidents.length} device(s). Service degradation observed.`)
      .replace('{{resolution}}', incident.status === 'resolved' ? 'Issue has been resolved.' : 'Under investigation.')
      .replace('{{rec1}}', 'Implement proactive monitoring for early detection.')
      .replace('{{rec2}}', 'Review and update alert thresholds.')
      .replace('{{rec3}}', 'Document recovery procedures in runbook.')

    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incident-${incident.id}-report.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Incidents</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track and manage network incidents</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create Incident</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-on-surface">{incidents.filter(i => i.status === 'open').length}</p>
          <p className="text-xs text-on-surface-variant">Open</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-warning">{incidents.filter(i => i.status === 'investigating').length}</p>
          <p className="text-xs text-on-surface-variant">Investigating</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-success">{incidents.filter(i => i.status === 'resolved').length}</p>
          <p className="text-xs text-on-surface-variant">Resolved</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-error">{incidents.filter(i => i.severity === 'critical').length}</p>
          <p className="text-xs text-on-surface-variant">Critical</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'open', 'investigating', 'resolved'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${filterStatus === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1 space-y-3">
          {filtered.map(inc => (
            <Card key={inc.id} className={`cursor-pointer transition-colors ${selected?.id === inc.id ? 'border-primary bg-primary/5' : 'hover:border-primary/20'}`}
              onClick={() => setSelected(inc)}>
              <div className="flex items-start justify-between mb-2">
                <Badge variant={inc.severity === 'critical' ? 'offline' : 'warning'}>{inc.severity}</Badge>
                <Badge variant={inc.status === 'resolved' ? 'online' : inc.status === 'investigating' ? 'warning' : 'info'}>{inc.status}</Badge>
              </div>
              <p className="text-sm font-medium text-on-surface mb-1">{inc.title}</p>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1"><Clock size={12} /> {inc.duration}</span>
                <span>{inc.devices.length} device(s)</span>
                <span>{inc.alerts} alert(s)</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Incident Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-on-surface">{selected.title}</h2>
                      <Badge variant={selected.severity === 'critical' ? 'offline' : 'warning'}>{selected.severity}</Badge>
                    </div>
                    <p className="text-sm text-on-surface-variant">Started: {new Date(selected.started).toLocaleString()} · Duration: {selected.duration}</p>
                  </div>
                  <div className="flex gap-2">
                    {selected.status !== 'resolved' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => updateStatus(selected.id, 'investigating')}><CheckCircle size={14} /> Investigate</Button>
                        <Button size="sm" onClick={() => updateStatus(selected.id, 'resolved')}><CheckCircle size={14} /> Resolve</Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => exportPDF(selected)}><Download size={14} /> Export</Button>
                  </div>
                </div>

                {/* Status update */}
                <div className="flex gap-2">
                  {selected.status === 'open' && (
                    <Button variant="secondary" size="sm" onClick={() => updateStatus(selected.id, 'investigating')}>Start Investigation</Button>
                  )}
                  {selected.status === 'investigating' && (
                    <Button size="sm" onClick={() => updateStatus(selected.id, 'resolved')}>Mark Resolved</Button>
                  )}
                </div>
              </Card>

              {/* AI Root Cause Summary */}
              <Card>
                <CardHeader><CardTitle>AI Root Cause Analysis</CardTitle></CardHeader>
                <div className="bg-surface-container rounded-lg p-4 text-sm text-on-surface">
                  {selected.id === '1' && (
                    <div>
                      <p className="mb-2">The BGP session flap on <strong>mt-core-01</strong> was caused by a connectivity issue with peer 10.0.0.4. The session dropped from Established to Idle state, resulting in loss of 67 prefixes.</p>
                      <p className="mb-2"><strong>Contributing factors:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-on-surface-variant">
                        <li>Intermittent packet loss on the uplink (0.3% observed)</li>
                        <li>Peer router undergoing maintenance window</li>
                        <li>BGP hold timer mismatch (90s vs 180s)</li>
                      </ul>
                    </div>
                  )}
                  {selected.id === '2' && (
                    <div>
                      <p className="mb-2">High CPU and RAM on <strong>mt-pppoe-con</strong> is caused by excessive PPPoE sessions (480/500). The device is approaching its session limit, causing resource exhaustion.</p>
                      <p><strong>Recommendation:</strong> Clean up stale PPPoE sessions and consider load balancing to additional concentrators.</p>
                    </div>
                  )}
                  {selected.id === '3' && (
                    <div>
                      <p className="mb-2"><strong>mt-ap-lobby</strong> has been offline for over 18 hours. Last communication was at 18:30 on June 15. No graceful shutdown was detected.</p>
                      <p><strong>Likely cause:</strong> Power failure or physical disconnection. Requires on-site inspection.</p>
                    </div>
                  )}
                  {selected.id === '4' && (
                    <div>
                      <p>Interface errors on <strong>ether1</strong> were caused by a faulty SFP module. After replacement, error counters stabilized. Issue resolved.</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                <div className="space-y-0">
                  {(timelineEvents[selected.id] || []).map((event, i) => (
                    <div key={i} className="flex gap-3 pb-4 relative">
                      {i < (timelineEvents[selected.id]?.length || 0) - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-outline-variant" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${event.color === 'error' ? 'bg-error/10' : event.color === 'primary' ? 'bg-primary/10' : event.color === 'warning' ? 'bg-warning/10' : 'bg-success/10'}`}>
                        <event.icon size={14} className={event.color === 'error' ? 'text-error' : event.color === 'primary' ? 'text-primary' : event.color === 'warning' ? 'text-warning' : 'text-success'} />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm text-on-surface">{event.text}</p>
                        <p className="text-xs text-on-surface-variant">{event.time}</p>
                      </div>
                    </div>
                  ))}
                  {(!timelineEvents[selected.id] || timelineEvents[selected.id].length === 0) && (
                    <p className="text-sm text-on-surface-variant text-center py-4">No timeline events yet</p>
                  )}
                </div>

                {/* Add note */}
                <div className="mt-4 pt-4 border-t border-outline-variant">
                  <div className="flex gap-2">
                    <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                      placeholder="Add a note to the timeline..."
                      className="flex-1 px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20" />
                    <Button size="sm" onClick={() => setNewNote('')}>Add Note</Button>
                  </div>
                </div>
              </Card>

              {/* Post-Mortem Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Post-Mortem Template</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => exportPDF(selected)}><FileText size={14} /> Export</Button>
                </CardHeader>
                <pre className="bg-surface-container p-4 rounded-lg text-xs text-on-surface font-mono whitespace-pre-wrap max-h-[16rem] overflow-y-auto">
                  {postMortemTemplate.replace('{{title}}', selected.title).replace('{{date}}', new Date(selected.started).toLocaleDateString()).replace('{{duration}}', selected.duration).replace('{{severity}}', selected.severity).replace('{{devices}}', selected.devices.join(', '))}
                </pre>
              </Card>
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <AlertTriangle size={48} className="text-outline mx-auto mb-4" />
                <p className="text-on-surface-variant">Select an incident to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Incident Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-container-high rounded-xl p-6 w-full max-w-[32rem] space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-on-surface">Create Incident</h3>
            <Input label="Title" value={newIncident.title} onChange={e => setNewIncident({...newIncident, title: e.target.value})} placeholder="BGP Session Flap — mt-core-01" />
            <select value={newIncident.severity} onChange={e => setNewIncident({...newIncident, severity: e.target.value})}
              className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-sm text-on-surface">
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <Input label="Affected Devices (comma separated)" value={newIncident.devices} onChange={e => setNewIncident({...newIncident, devices: e.target.value})} placeholder="mt-core-01, mt-branch-02" />
            <Textarea label="Description" value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} placeholder="Describe the incident..." rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => setShowCreate(false)}>Create Incident</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
