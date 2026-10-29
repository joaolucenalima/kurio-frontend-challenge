import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collectionOptions, networkOptions } from '../../model/contracts'
import type { CatalogSearch } from '../../model/contracts'
import { catalogQueries } from '../../api/queries'
import { PriceFilter } from './price-filter'

function FilterList({
  name,
  title,
  options,
  value,
  counts,
  onSelect,
}: {
  name: string
  title: string
  options: readonly { id: string; name: string }[]
  value?: string
  counts?: Record<string, number>
  onSelect: (value: string) => void
}) {
  const groupId = useId()

  return (
    <fieldset>
      <legend className="text-lg leading-4 font-bold">{title}</legend>
      <ul className={name === 'network' ? 'mt-3 pl-3' : 'mt-3 px-3'}>
        {[{ id: '', name: 'Todas' }, ...options].map((option) => (
          <li key={option.id}>
            <label aria-label={option.name} className="relative block cursor-pointer">
              <input
                type="radio"
                name={groupId}
                value={option.id}
                checked={(value || '') === option.id}
                onChange={() => onSelect(option.id)}
                className="peer sr-only"
              />
              <span className="flex min-h-10 items-center justify-between gap-3 text-[0.9375rem] leading-5 text-muted-foreground peer-checked:text-accent peer-focus-visible:rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring hover:text-accent">
                <span>{option.name}</span>
                <span
                  className={name === 'collection' && value === option.id ? 'font-bold' : undefined}
                >
                  {counts
                    ? `(${option.id ? counts[option.id] : Object.values(counts).reduce((sum, count) => sum + count, 0)})`
                    : '—'}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

interface Props {
  search: CatalogSearch
  onChange: (search: CatalogSearch) => void
}

export function CatalogFilters({ search, onChange }: Props) {
  const { data } = useQuery(catalogQueries.list(search))
  const counts = data?.counts
  const availableNetworks = networkOptions.filter(
    ({ id }) => !counts?.networks || (counts.networks[id] ?? 0) > 0,
  )

  return (
    <div className="space-y-10 bg-card p-5">
      <FilterList
        name="collection"
        title="Coleções"
        options={collectionOptions}
        value={search.collection}
        counts={counts?.collections}
        onSelect={(value) =>
          onChange({
            ...search,
            collection: value ? collectionOptions.find(({ id }) => id === value)?.id : undefined,
            page: 1,
          })
        }
      />
      <PriceFilter
        key={`${search.minPrice ?? ''}:${search.maxPrice ?? ''}`}
        search={search}
        onChange={onChange}
      />
      <FilterList
        name="network"
        title="Rede"
        options={availableNetworks}
        value={search.network}
        counts={counts?.networks}
        onSelect={(value) =>
          onChange({
            ...search,
            network: (value || undefined) as CatalogSearch['network'],
            page: 1,
          })
        }
      />
    </div>
  )
}
