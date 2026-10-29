export function ReviewSummary({ count }: { count: number }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-normal text-foreground">
      <span aria-hidden="true" className="whitespace-nowrap tracking-wider text-xl text-accent">
        {count ? '★★★★☆' : '☆☆☆☆☆'}
      </span>
      <span>{count} avaliações de colecionadores</span>
    </span>
  )
}
