import * as React from 'react'
import { cn } from '#/shared/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-28 w-full resize-y rounded-sm border border-border bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-subtle outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
