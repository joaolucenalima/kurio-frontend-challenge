import { MobileNavigation } from '#/shared/components/mobile-navigation'
import { MobileCatalogHeader, MobileHero } from './mobile-catalog'
import { Button } from '#/shared/components/ui/button'
import { Header } from '#/shared/components/header'
import { CatalogFilters } from './catalog-filters'
import { CatalogResults } from './catalog-results'
import type { CatalogSearch } from '../../model/contracts'

export function CatalogPage({
  search,
  onSearchChange,
}: {
  search: CatalogSearch
  onSearchChange: (search: CatalogSearch) => void
}) {
  return (
    <div className="px-6 pt-10 pb-36 md:pt-6 md:pb-6">
      <div className="mx-auto max-w-page">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileCatalogHeader search={search} onChange={onSearchChange} />
        <main>
          <MobileHero />
          <section className="hidden md:flex mt-4 items-center overflow-hidden rounded-xl bg-card md:mt-8 md:bg-transparent lg:min-h-hero-section">
            <div className="min-w-0 flex-1 p-4 lg:p-10">
              <p className="font-mono text-sm leading-4 font-medium tracking-widest">
                Bem-vindo à Kurio
              </p>
              <h1 className="mt-2 max-w-xl font-mono text-xl leading-6 font-bold tracking-normal lg:text-[2.75rem] lg:leading-18">
                SEJA DONO DO FUTURO DA ARTE DIGITAL
              </h1>
              <p className="mt-1 max-w-lg font-mono text-sm leading-6 text-muted-foreground">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
                digital rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>
              <Button asChild variant="cta" size="cta" className="mt-3 md:mt-8">
                <a href="#catalog">EXPLORAR</a>
              </Button>
            </div>
            <img
              src="/images/nfts/emerald-ape.png"
              alt="Emerald Ape #042, macaco de jaqueta verde e óculos de sol"
              width="450"
              height="450"
              className="aspect-square w-2/5 shrink-0 rounded-xl object-cover lg:w-hero-image lg:rounded-3xl"
            />
          </section>
          <section
            id="catalog"
            aria-labelledby="catalog-title"
            className="mt-4 md:mt-10 flex scroll-mt-6 flex-col gap-8 lg:mt-24 lg:flex-row lg:gap-12"
          >
            <aside
              aria-label="Filtros do catálogo"
              className="hidden md:block min-w-0 lg:w-sidebar lg:shrink-0"
            >
              <details className="lg:hidden">
                <summary className="cursor-pointer rounded-md border border-border p-3 text-sm">
                  Filtrar NFTs
                </summary>
                <div className="mt-3">
                  <CatalogFilters search={search} onChange={onSearchChange} />
                </div>
              </details>
              <div className="hidden lg:block">
                <CatalogFilters search={search} onChange={onSearchChange} />
              </div>
              <div className="mt-6 hidden bg-secondary pt-6 text-center lg:block">
                <p className="font-mono text-2xl leading-8 font-bold text-primary">
                  NFT EM DESTAQUE
                </p>
                <p className="mt-2 font-mono text-[1.375rem] leading-7 font-bold">
                  OFERTA LIMITADA
                </p>
                <img
                  src="/images/nfts/sage-nomad.png"
                  alt="Sage Nomad #009, macaco com chapéu verde e moletom violeta"
                  loading="lazy"
                  width="310"
                  height="368"
                  className="mt-4 w-full object-cover"
                />
              </div>
            </aside>
            <CatalogResults search={search} onChange={onSearchChange} />
          </section>
        </main>
        <MobileNavigation />
      </div>
    </div>
  )
}
