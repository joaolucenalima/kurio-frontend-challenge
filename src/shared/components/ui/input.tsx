import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '#/shared/lib/utils'

const inputVariants = cva(
  'min-w-0 text-foreground placeholder:text-subtle transition-colors focus:border-primary focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'h-10 w-full rounded-[5px] border border-border bg-transparent px-4 text-sm',
        coupon:
          'h-[50px] flex-1 rounded-full border border-border bg-card px-4 text-[13px] lg:h-10 lg:rounded-none lg:border-input lg:border-r-0 lg:bg-transparent lg:px-2 lg:text-xs',
        search: 'h-11 w-full rounded-lg border border-transparent bg-card px-3 text-sm',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Input({
  className,
  variant,
  type,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
