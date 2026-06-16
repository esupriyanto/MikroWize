import { Bell, Radio, Wifi } from 'lucide-react'

export default function Topbar() {
  return (
    <header className="flex justify-between items-center h-14 px-4 ml-[186px] w-[calc(100%-186px)] sticky top-0 bg-surface-container-lowest border-b border-outline-variant z-40">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search devices, IPs, or logs..."
          className="pl-9 pr-4 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-xs w-80 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="flex items-center gap-3 pr-4 border-r border-outline-variant">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-on-surface-variant font-bold uppercase">System Status</span>
            <span className="text-[10px] font-bold text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Operational
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="relative p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded">
            <Bell size={18} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded">
            <Radio size={18} />
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded">
            <Wifi size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
