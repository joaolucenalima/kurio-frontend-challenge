import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '#/shared/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('group/dialog-header mb-6 space-y-2 pr-6 text-left', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'group-data-[slot=dialog-header]/dialog-header:font-mono group-data-[slot=dialog-header]/dialog-header:text-lg group-data-[slot=dialog-header]/dialog-header:leading-6 group-data-[slot=dialog-header]/dialog-header:font-bold group-data-[slot=dialog-header]/dialog-header:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn(
        'group-data-[slot=dialog-header]/dialog-header:text-sm group-data-[slot=dialog-header]/dialog-header:leading-6 group-data-[slot=dialog-header]/dialog-header:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[95vh] w-[min(95vw,500px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-b-[10px] border-[#d28a4c] bg-[#241612] p-4 pb-6 text-foreground shadow-xl focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute top-3 right-3 rounded-sm text-[#d28a4c] hover:text-[#e9a66c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d28a4c]"
            aria-label="Fechar"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
}
