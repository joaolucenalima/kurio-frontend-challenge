import * as React from 'react'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { cn } from '#/shared/lib/utils'
import { Button } from '#/shared/components/ui/button'

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('font-mono text-lg leading-6 font-bold text-foreground', className)}
      {...props}
    />
  )
}
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <AlertDialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[95vh] w-[min(95vw,500px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-b-10 border-primary bg-card p-6 text-foreground shadow-xl focus:outline-none',
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-2', className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant = 'destructive',
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button variant={variant} className={cn('min-h-10', className)} {...props} />
    </AlertDialogPrimitive.Action>
  )
}

function AlertDialogCancel({
  className,
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button variant={variant} className={cn('min-h-10', className)} {...props} />
    </AlertDialogPrimitive.Cancel>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
