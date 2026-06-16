import { Plus, FileCode, Copy, Trash2, Play } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const templates = [
  { id: '1', name: 'NTP Configuration', category: 'System', version: 'v3', updated: '2026-06-15', devices: 5, vars: ['ntp_server_1', 'ntp_server_2'] },
  { id: '2', name: 'DNS Configuration', category: 'Network', version: 'v2', updated: '2026-06-14', devices: 5, vars: ['dns_primary', 'dns_secondary'] },
  { id: '3', name: 'Security Hardening', category: 'Security', version: 'v5', updated: '2026-06-10', devices: 8, vars: ['ssh_port', 'allowed_ips'] },
  { id: '4', name: 'PPPoE Config', category: 'ISP', version: 'v1', updated: '2026-06-08', devices: 2, vars: ['pppoe_user', 'pppoe_pass', 'rate_limit'] },
  { id: '5', name: 'BGP Peer Setup', category: 'Routing', version: 'v2', updated: '2026-06-12', devices: 1, vars: ['peer_ip', 'as_number', 'prefix_list'] },
]

export default function TemplateFramework() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Template Framework</h1>
          <p className="text-sm text-on-surface-variant mt-1">Jinja2-based RouterOS configuration templates</p>
        </div>
        <Button><Plus size={16} /> Create Template</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileCode size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{t.name}</p>
                  <p className="text-xs text-on-surface-variant">{t.category}</p>
                </div>
              </div>
              <Badge variant="default">{t.version}</Badge>
            </div>
            <div className="space-y-2 text-xs text-on-surface-variant mb-4">
              <div className="flex justify-between"><span>Applied to</span><span className="text-on-surface">{t.devices} devices</span></div>
              <div className="flex justify-between"><span>Variables</span><span className="text-on-surface">{t.vars.length}</span></div>
              <div className="flex justify-between"><span>Last updated</span><span className="text-on-surface">{t.updated}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm"><Play size={14} /> Push</Button>
              <Button variant="ghost" size="sm"><Copy size={14} /> Clone</Button>
              <Button variant="ghost" size="sm"><Trash2 size={14} className="text-error" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
