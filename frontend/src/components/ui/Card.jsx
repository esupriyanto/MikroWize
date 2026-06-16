export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-surface-container-low rounded-xl border border-outline-variant p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-on-surface ${className}`}>
      {children}
    </h3>
  )
}
