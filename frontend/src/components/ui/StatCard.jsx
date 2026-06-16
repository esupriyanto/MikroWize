import { TrendingUp, TrendingDown } from 'lucide-react'

const trendColors = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-outline',
}

export default function StatCard({ title, value, trend, trendValue, icon: Icon, className = '' }) {
  return (
    <div className={`bg-surface-container-low rounded-xl border border-outline-variant p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-on-surface-variant">{title}</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon size={20} className="text-primary" />
          </div>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trendColors[trend]}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
