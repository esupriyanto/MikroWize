import { Bell, Search, ChevronDown } from 'lucide-react'

export default function Topbar() {
  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search devices, templates, alerts..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-lg border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-container transition-colors">
          <Bell size={20} className="text-on-surface-variant" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>

        {/* User menu */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container transition-colors">
          <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center">
            <span className="text-on-primary text-xs font-semibold">ES</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-on-surface leading-tight">Eko S.</p>
            <p className="text-xs text-on-surface-variant">Super Admin</p>
          </div>
          <ChevronDown size={14} className="text-outline" />
        </button>
      </div>
    </header>
  )
}
