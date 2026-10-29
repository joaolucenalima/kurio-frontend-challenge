import type { ComponentProps } from 'react'
import { cn } from '#/shared/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:bg-size-[200%_100%] before:animate-[shimmer_1.5s_infinite] before:bg-linear-to-r before:from-transparent before:via-foreground/10 before:to-transparent motion-reduce:before:animate-none',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
