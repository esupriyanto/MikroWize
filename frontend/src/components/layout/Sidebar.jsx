import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Network, Server, Upload, FileUp,
  HardDrive, Wrench, FileCode, ListTodo, Activity,
  Bell, BarChart3, Bot, AlertTriangle, Users, ClipboardList, Settings
} from 'lucide-react'

const sections = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/topology', icon: Network, label: 'Topology Map' },
    ],
  },
  {
    title: 'Device Management',
    items: [
      { to: '/devices', icon: Server, label: 'Device Inventory', badge: '247' },
      { to: '/devices/onboard', icon: Upload, label: 'Onboarding' },
      { to: '/devices/import', icon: FileUp, label: 'Mass Import' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/backups', icon: HardDrive, label: 'Backup Manager', badge: '2', badgeColor: 'error' },
      { to: '/troubleshoot', icon: Wrench, label: 'Troubleshoot Panel' },
      { to: '/templates', icon: FileCode, label: 'Template Framework' },
      { to: '/tasks', icon: ListTodo, label: 'Task Queue', badge: '3', badgeColor: 'error' },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/metrics', icon: Activity, label: 'Live Metrics' },
      { to: '/alerts', icon: Bell, label: 'Alerts', badge: '5', badgeColor: 'error' },
      { to: '/grafana', icon: BarChart3, label: 'Grafana Dashboards' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/ai', icon: Bot, label: 'AI Agent Hermes' },
      { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/users', icon: Users, label: 'Users & Roles' },
      { to: '/audit', icon: ClipboardList, label: 'Audit Log' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="h-screen w-[186px] fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-bold text-[15px] text-on-surface leading-none">MikroWize</span>
        </div>
        <div className="text-[10px] text-on-surface-variant mt-1">NOC Dashboard</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-4 pt-3 pb-1 text-[9px] font-bold text-on-surface-variant tracking-wider uppercase">
              {section.title}
            </div>
            {section.items.map(({ to, icon: Icon, label, end, badge, badgeColor }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    isActive
                      ? 'bg-secondary-container text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`
                }
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
                {badge && (
                  <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    badgeColor === 'error'
                      ? 'bg-error-container text-error'
                      : 'bg-success-container text-on-success-container'
                  }`}>
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto px-4 py-2 border-t border-outline-variant">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-1 rounded transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
            EK
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-on-surface font-semibold text-[11px] truncate">Eko</span>
            <span className="text-on-surface-variant text-[9px]">Super Admin</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
