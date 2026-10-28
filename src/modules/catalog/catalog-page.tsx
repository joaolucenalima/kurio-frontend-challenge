import { Button } from '#/shared/components/ui/button'
import { Header } from '#/shared/components/header'

export function CatalogPage() {
  return (
    <div className="px-6 py-6">
      <div className="mx-auto max-w-page">
        <Header />
        <main>
          <section className="mt-8 flex items-center lg:min-h-hero-section">
            <div className="min-w-0 flex-1 py-4 pr-4 lg:p-10">
              <p className="font-mono text-sm leading-4 font-medium tracking-widest">
                Bem-vindo à Kurio
              </p>
              <h1 className="max-w-xl mt-2 font-mono text-xl leading-6 font-bold tracking-normal lg:text-[2.75rem] lg:leading-18 ">
                SEJA DONO DO FUTURO DA ARTE DIGITAL
              </h1>
              <p className="mt-1 max-w-lg font-mono text-sm leading-6 font-normal tracking-normal text-muted-foreground">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
                digital rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>
              <Button asChild variant="cta" size="cta" className="mt-8">
                <a href="#catalog">EXPLORAR</a>
              </Button>
            </div>
            <img
              src="/images/image-import.png"
              alt="Arte digital da coleção em destaque"
              width="450"
              height="450"
              className="aspect-square w-2/5 shrink-0 rounded-xl object-cover lg:w-hero-image lg:rounded-3xl"
            />
          </section>
          <section
            id="catalog"
            aria-labelledby="catalog-title"
            className="mt-10 flex scroll-mt-6 gap-12 lg:mt-24"
          >
            <aside aria-label="Filtros do catálogo" className="hidden w-sidebar shrink-0 lg:block">
              <div className="space-y-10 bg-card p-5">
                <div>
                  <h2 className="text-lg leading-6 font-bold tracking-normal">Coleções</h2>
                  <ul className="mt-3 space-y-5 pl-3 text-base leading-5 font-normal tracking-normal text-muted-foreground">
                    {[
                      'Arte digital',
                      'Fotografia',
                      'Música',
                      'Arte 3D',
                      'Colecionáveis',
                      'Generativa',
                      'Jogos',
                      'Assinaturas',
                      'Utilidade',
                    ].map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-lg leading-6 font-bold tracking-normal">Faixa de preço</h2>
                  <p className="mt-3 text-xs leading-4 font-normal tracking-normal text-muted-foreground">
                    Filtro em implementação
                  </p>
                </div>
                <div>
                  <h2 className="text-lg leading-6 font-bold tracking-normal">Rede</h2>
                  <p className="mt-3 text-sm leading-5 font-normal tracking-normal text-muted-foreground">
                    Ethereum · Polygon · Solana
                  </p>
                </div>
              </div>
              <div className="mt-6 bg-secondary pt-6 text-center">
                <p className="font-mono text-2xl leading-8 font-bold tracking-normal text-primary">
                  NFT EM DESTAQUE
                </p>
                <p className="mt-2 font-mono text-[1.375rem] leading-7 font-bold tracking-normal">
                  OFERTA LIMITADA
                </p>
                <img
                  src="/images/image-import-1.png"
                  alt="Arte digital em destaque"
                  loading="lazy"
                  width="310"
                  height="368"
                  className="mt-4 w-full object-cover"
                />
              </div>
            </aside>
            <div className="min-w-0 flex-1">
              <h2
                id="catalog-title"
                className="border-b border-border pb-3 font-mono text-sm leading-5 font-bold tracking-normal text-primary"
              >
                Todos os NFTs
              </h2>
              <div
                className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-8"
                aria-label="Espaços reservados para NFTs"
              >
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index} aria-hidden="true" className="space-y-3">
                    <div className="aspect-square rounded-lg bg-card" />
                    <div className="h-4 w-4/5 rounded bg-card" />
                    <div className="h-4 w-1/2 rounded bg-secondary" />
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm leading-5 font-normal tracking-normal text-muted-foreground">
                Catálogo em implementação. Os NFTs serão carregados pela API simulada.
              </p>
            </div>
          </section>
        </main>
        <footer className="mt-24 border-t border-border py-8 text-xs leading-4 font-normal tracking-normal text-muted-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </footer>
      </div>
    </div>
  )
}
