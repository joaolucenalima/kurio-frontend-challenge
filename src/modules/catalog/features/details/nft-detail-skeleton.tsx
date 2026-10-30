import { Skeleton } from '#/shared/components/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div>
      <output className="sr-only">Carregando detalhes do NFT…</output>
      <div aria-hidden="true">
        <Skeleton className="mb-6 hidden h-5 w-40 md:block" />
        <div className="mb-4 flex justify-between md:hidden">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <div className="grid min-w-0 gap-8 lg:grid-cols-2">
          <div className="flex min-w-0 gap-7 md:items-start">
            <Skeleton className="hidden size-25 shrink-0 rounded-lg md:block" />
            <Skeleton className="aspect-square min-w-0 flex-1 rounded-xl md:max-w-111" />
          </div>
          <div className="min-w-0">
            <Skeleton className="h-7 w-3/4 md:h-10" />
            <Skeleton className="mt-3 hidden h-10 w-full md:block" />
            <Skeleton className="mt-6 h-5 w-32" />
            <Skeleton className="mt-3 h-18 w-full" />
            <Skeleton className="mt-6 h-5 w-20" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-5 hidden h-10 w-full md:block" />
            <div className="mt-5 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>
        <div className="mt-16 md:mt-20">
          <Skeleton className="h-16 w-full md:h-9" />
          <Skeleton className="mt-6 h-18 w-full" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="mt-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-6 w-3/4" />
            </div>
          ))}
        </div>
        <div className="mt-16 md:mt-20">
          <Skeleton className="h-10 w-full" />
          <div className="mt-8 flex gap-6 overflow-hidden">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="basis-3/4 shrink-0 md:basis-1/3 lg:basis-1/5">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-5 w-1/2" />
              </div>
            ))}
          </div>
          <Skeleton className="mx-auto mt-7 h-3 w-20" />
        </div>
      </div>
    </div>
  )
}
