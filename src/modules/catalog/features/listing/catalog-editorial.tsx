import { ArrowRight } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import type { CatalogSearch } from '../../model/contracts'

const articles = [
  {
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    date: '12 de setembro',
    minutes: 6,
    image: 'Gvfl8',
  },
  {
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    date: '13 de setembro',
    minutes: 2,
    image: 'Noi7e',
  },
  {
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    date: '15 de setembro',
    minutes: 3,
    image: 'uCbi0',
  },
  {
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    date: '15 de setembro',
    minutes: 2,
    image: 'WFWwK',
  },
]

const promotions = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/nfts/emerald-ape.png',
    ranking: 'new-releases',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/journal/Gvfl8.webp',
    ranking: 'all',
  },
] as const

export function CatalogEditorial({
  onSearchChange,
}: {
  onSearchChange: (search: CatalogSearch) => void
}) {
  return (
    <div className="mt-12 space-y-12 md:mt-16 md:space-y-16 lg:mt-24 lg:space-y-24">
      <section aria-label="Destaques de coleções" className="grid gap-6 lg:grid-cols-2">
        {promotions.map((promotion) => (
          <article
            key={promotion.title}
            className="grid overflow-hidden rounded-lg bg-card min-[32rem]:grid-cols-2"
          >
            <img
              src={promotion.image}
              alt=""
              width="292"
              height="280"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] h-full w-full object-cover md:aspect-auto"
            />
            <div className="flex flex-col items-end gap-4 p-6 text-right">
              <h2 className="text-lg leading-6 font-bold">{promotion.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{promotion.description}</p>
              <Button asChild className="mt-auto min-h-11 gap-3">
                <a
                  href="#catalog"
                  aria-label={`Explorar: ${promotion.title}`}
                  onClick={() =>
                    onSearchChange({ ranking: promotion.ranking, sort: 'recently-listed', page: 1 })
                  }
                >
                  Explorar <ArrowRight aria-hidden="true" className="size-4" />
                </a>
              </Button>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="journal-title">
        <header className="mx-auto max-w-3xl space-y-3 text-center">
          <h2
            id="journal-title"
            className="text-2xl leading-8 font-bold md:text-[1.75rem] md:leading-9"
          >
            Diário da Cunhagem
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </header>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:mt-10 lg:grid-cols-4">
          {articles.map((article) => (
            <article
              key={article.title}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-card"
            >
              <img
                src={`/images/journal/${article.image}.webp`}
                alt=""
                width="536"
                height="390"
                loading="lazy"
                decoding="async"
                className="aspect-[268/195] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="text-xs leading-5 text-muted-foreground">
                  {article.date} <span aria-hidden="true"> | </span> Leitura de {article.minutes}{' '}
                  min
                </p>
                <h3 className="text-base leading-6 font-bold">{article.title}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{article.description}</p>
                <div className="mt-auto pt-1">
                  <button
                    type="button"
                    disabled
                    aria-describedby="journal-status"
                    className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 text-xs font-bold text-accent"
                  >
                    Ler mais <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
