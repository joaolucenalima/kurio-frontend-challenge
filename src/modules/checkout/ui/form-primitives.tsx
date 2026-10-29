import { Children, cloneElement, isValidElement, type ReactNode } from 'react'

export function Field({
  label,
  error,
  className = '',
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  const id = `checkout-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`
  const applyId = (child: ReactNode) =>
    isValidElement<{ id?: string; 'aria-describedby'?: string }>(child)
      ? cloneElement(child, { id, 'aria-describedby': error ? `${id}-error` : undefined })
      : child
  const child = Children.map(children, (child, index) => (index === 0 ? applyId(child) : child))
  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm">
        {label}
      </label>
      {child && <div className="*:w-full">{child}</div>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}
