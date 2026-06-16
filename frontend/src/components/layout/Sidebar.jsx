import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Server, Upload, HardDrive, Wrench,
  FileCode, ListTodo, Bell, Users, Settings, Network
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/devices', icon: Server, label: 'Devices' },
  { to: '/devices/onboard', icon: Upload, label: 'Onboarding' },
  { to: '/backups', icon: HardDrive, label: 'Backups' },
  { to: '/troubleshoot/1', icon: Wrench, label: 'Troubleshoot' },
  { to: '/templates', icon: FileCode, label: 'Templates' },
  { to: '/tasks', icon: ListTodo, label: 'Task Queue' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/topology', icon: Network, label: 'Topology' },
]

const bottomItems = [
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-surface-container-low border-r border-outline-variant flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-on-primary font-bold text-sm">MW</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-on-surface leading-tight">MikroWize</h1>
            <p className="text-xs text-on-surface-variant">Network Manager</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-3 border-t border-outline-variant space-y-1">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
