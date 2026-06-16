const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80',
  secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 active:bg-secondary-container/70',
  ghost: 'text-on-surface hover:bg-surface-container active:bg-surface-container-high',
  danger: 'bg-error text-on-error hover:bg-error/90 active:bg-error/80',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ variant = 'primary', size = 'lg', children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
