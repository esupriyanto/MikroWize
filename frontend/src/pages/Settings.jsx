import { useState } from 'react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Select } from '../components/ui/Input'

const tabs = ['General', 'Credential Vault', 'Backup Policy', 'Notifications', 'Integrations', 'Change Freeze', 'System']

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">Platform configuration and integrations</p>
      </div>

      <div className="flex border-b border-outline-variant">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && (
        <Card>
          <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
          <div className="space-y-4 max-w-[32rem]">
            <Input label="Platform Name" defaultValue="MikroWize" />
            <Select label="Timezone">
              <option>Asia/Jakarta (WIB)</option>
              <option>Asia/Makassar (WITA)</option>
              <option>Asia/Jayapura (WIT)</option>
            </Select>
            <Input label="Session Timeout (minutes)" defaultValue="30" type="number" />
            <Button>Save Changes</Button>
          </div>
        </Card>
      )}

      {activeTab === 'Notifications' && (
        <Card>
          <CardHeader><CardTitle>Notification Channels</CardTitle></CardHeader>
          <div className="space-y-4 max-w-[32rem]">
            <Input label="SMTP Server" placeholder="smtp.gmail.com" />
            <Input label="SMTP Port" placeholder="587" />
            <Input label="SMTP Username" placeholder="alerts@mikrowize.io" />
            <Input label="SMTP Password" type="password" placeholder="••••••••" />
            <Input label="Telegram Bot Token" placeholder="123456:ABC-DEF..." />
            <Input label="Telegram Chat ID" placeholder="-1001234567890" />
            <div className="flex gap-2">
              <Button>Save</Button>
              <Button variant="secondary">Test Notification</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'Integrations' && (
        <Card>
          <CardHeader><CardTitle>API & Integrations</CardTitle></CardHeader>
          <div className="space-y-4 max-w-[32rem]">
            <Input label="Zabbix API Endpoint" placeholder="http://zabbix.local/api_jsonrpc.php" />
            <Input label="Prometheus Endpoint" placeholder="http://prometheus:9090" />
            <Input label="Grafana URL" placeholder="http://grafana:3000" />
            <Input label="Grafana API Key" type="password" placeholder="••••••••" />
            <Button>Save</Button>
          </div>
        </Card>
      )}

      {activeTab === 'System' && (
        <Card>
          <CardHeader><CardTitle>System Management</CardTitle></CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container">
              <div><p className="text-sm font-medium text-on-surface">Celery Workers</p><p className="text-xs text-on-surface-variant">3 workers active</p></div>
              <Button variant="secondary" size="sm">Restart</Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container">
              <div><p className="text-sm font-medium text-on-surface">Platform Version</p><p className="text-xs text-on-surface-variant">v0.1.0-alpha</p></div>
              <Button variant="ghost" size="sm">Check Updates</Button>
            </div>
          </div>
        </Card>
      )}

      {!['General', 'Notifications', 'Integrations', 'System'].includes(activeTab) && (
        <Card>
          <div className="text-center py-12">
            <p className="text-on-surface-variant">{activeTab} settings — coming soon</p>
          </div>
        </Card>
      )}
    </div>
  )
}
