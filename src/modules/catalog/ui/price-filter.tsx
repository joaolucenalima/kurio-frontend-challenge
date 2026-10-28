import { useId, useState } from 'react'
import { Button } from '#/shared/components/ui/button'
import { Slider } from '#/shared/components/ui/slider'
import { ethToWei } from '../model/contracts'
import type { CatalogSearch } from '../model/contracts'

const weiPerCent = 10n ** 16n
const lowerLimit = 2
const upperLimit = 1230

function toCents(price: string | undefined, fallback: number) {
  if (!price) return fallback
  return Number(ethToWei(price) / weiPerCent)
}

function toEth(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

export function PriceFilter({
  search,
  onChange,
}: {
  search: CatalogSearch
  onChange: (search: CatalogSearch) => void
}) {
  const headingId = useId()
  const applied = [toCents(search.minPrice, lowerLimit), toCents(search.maxPrice, upperLimit)]

  const [range, setRange] = useState(applied)

  const modified = range[0] !== applied[0] || range[1] !== applied[1]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!modified) return
        onChange({ ...search, minPrice: toEth(range[0]), maxPrice: toEth(range[1]), page: 1 })
      }}
    >
      <h3 id={headingId} className="text-lg leading-4 font-bold">
        Faixa de preço
      </h3>
      <div className="mt-3 space-y-3 pl-3">
        <Slider
          aria-labelledby={headingId}
          thumbLabels={['Preço mínimo em centésimos de ETH', 'Preço máximo em centésimos de ETH']}
          value={range}
          min={Math.min(lowerLimit, applied[0])}
          max={Math.max(upperLimit, applied[1])}
          step={1}
          onValueChange={setRange}
          className="h-5"
        />
        <p className="text-sm leading-5">
          Preço: {toEth(range[0])} - {toEth(range[1])} ETH
        </p>
        {modified && (
          <Button type="submit" className="h-9 px-3 text-base font-bold">
            Aplicar
          </Button>
        )}
      </div>
    </form>
  )
}
