import * as React from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { cn } from '#/shared/lib/utils'

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('inline-flex items-center', className)} {...props} />
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center justify-center border-b-2 border-transparent px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-accent focus-visible:relative focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('min-w-0 outline-none', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
