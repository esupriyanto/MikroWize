const variants = {
  online: 'bg-success-container text-on-success-container',
  offline: 'bg-error-container text-on-error-container',
  warning: 'bg-warning-container text-on-warning-container',
  info: 'bg-info-container text-on-info-container',
  default: 'bg-surface-container-high text-on-surface-variant',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
