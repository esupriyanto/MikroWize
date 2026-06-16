import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play, Wifi, Route, Globe, Gauge, Network, Shield, FileText, Terminal } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { mockDevices } from '../mock/data'

const tools = [
  { id: 'ping', icon: Wifi, label: 'Ping', description: 'Test connectivity to target' },
  { id: 'traceroute', icon: Route, label: 'Traceroute', description: 'Hop-by-hop path analysis' },
  { id: 'dns', icon: Globe, label: 'DNS Lookup', description: 'Resolve hostname' },
  { id: 'bandwidth', icon: Gauge, label: 'Bandwidth Test', description: 'Test throughput' },
  { id: 'torch', icon: Network, label: 'Torch', description: 'Real-time traffic capture' },
  { id: 'ports', icon: Shield, label: 'Port Scan', description: 'Check open ports' },
]

export default function TroubleshootPanel() {
  const { id } = useParams()
  const device = mockDevices.find(d => d.id === id) || mockDevices[0]
  const [activeTool, setActiveTool] = useState('ping')
  const [target, setTarget] = useState('8.8.8.8')
  const [output, setOutput] = useState('')

  const runTool = () => {
    setOutput(`[${activeTool.toUpperCase()}] Running on ${device.hostname} (${device.ip})...\nTarget: ${target}\n\nSequence=1  ttl=56  time=12.3ms\nSequence=2  ttl=56  time=11.8ms\nSequence=3  ttl=56  time=12.1ms\n\n--- Statistics ---\n3 packets transmitted, 3 received, 0% packet loss\navg RTT: 12.1ms`)
  }

  return (
    <div className="space-y-6">
      <Link to={`/devices/${device.id}`} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
        <ArrowLeft size={14} /> Back to {device.hostname}
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-on-surface">Troubleshoot</h1>
        <Badge variant={device.status === 'online' ? 'online' : 'offline'}>{device.hostname}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tool List */}
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

        {/* Tool Panel */}
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

          <Card>
            <CardHeader><CardTitle>Script Executor</CardTitle></CardTitle></CardHeader>
            <p className="text-sm text-on-surface-variant mb-3">Run RouterOS commands directly (with approval for production devices)</p>
            <textarea
              className="w-full h-32 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-sm font-mono text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20"
              placeholder="/interface print where status=running"
            />
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm"><Terminal size={14} /> Execute</Button>
              <Button variant="ghost" size="sm">Dry Run</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
