export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-base font-medium text-on-surface">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border text-base text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
          error ? 'border-error' : 'border-outline-variant'
        }`}
        {...props}
      />
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-base font-medium text-on-surface">
          {label}
        </label>
      )}
      <select
        className={`w-full h-12 px-4 py-3 bg-surface-container-lowest rounded-lg border text-base text-on-surface transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
          error ? 'border-error' : 'border-outline-variant'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-base font-medium text-on-surface">
          {label}
        </label>
      )}
      <textarea
        className={`w-full h-32 px-4 py-3 bg-surface-container-lowest rounded-lg border text-base text-on-surface placeholder:text-outline transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
          error ? 'border-error' : 'border-outline-variant'
        }`}
        {...props}
      />
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}
