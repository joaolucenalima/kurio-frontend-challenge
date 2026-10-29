import { Link, useRouterState } from '@tanstack/react-router'
import { ShieldCheck, Palette, Bell } from 'lucide-react'

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    icon: Palette,
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    icon: Bell,
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]
const groups = [
  {
    title: 'Meu perfil',
    items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    items: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  { title: 'Coleções', items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

const linkStyle =
  'inline-flex min-h-11 items-center py-2 text-sm leading-5 text-muted-foreground transition-colors hover:text-accent focus-visible:text-accent'

export function SiteFooter() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const reserve =
    pathname === '/' || pathname === '/profile'
      ? 'pb-[calc(8rem+env(safe-area-inset-bottom))]'
      : pathname.startsWith('/nfts/')
        ? 'pb-[calc(13rem+env(safe-area-inset-bottom))]'
        : 'pb-[max(1.5rem,env(safe-area-inset-bottom))]'

  return (
    <footer aria-label="Rodapé do site" className={`mt-12 text-foreground ${reserve} md:pb-0`}>
      <div className="bg-card">
        <div className="mx-auto grid max-w-page gap-8 px-6 py-8 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, text }) => (
            <section
              key={title}
              className="min-w-0 border-b border-primary/30 pb-6 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0"
            >
              <Icon className="mb-4 size-8 text-primary" aria-hidden="true" />
              <h2 className="text-sm leading-5 font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </section>
          ))}
          <section className="min-w-0">
            <h2 className="text-sm leading-5 font-bold">Antecipe-se ao próximo lançamento</h2>
            <label htmlFor="footer-email" className="sr-only">
              Seu e-mail
            </label>
            <div className="mt-4 flex overflow-hidden rounded-md border border-input bg-secondary">
              <input
                id="footer-email"
                type="email"
                disabled
                placeholder="digite seu e-mail..."
                aria-describedby="footer-newsletter-status"
                className="min-h-11 min-w-0 flex-1 px-3 text-xs placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="min-h-11 bg-primary px-3 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
            </p>
            <p
              id="footer-newsletter-status"
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Inscrição indisponível nesta demonstração.
            </p>
          </section>
        </div>

        <div className="bg-surface-warm">
          <div className="mx-auto grid max-w-page gap-8 px-6 py-6 md:grid-cols-2 md:items-center lg:grid-cols-4">
            <Link
              to="/"
              search={{ ranking: 'all', sort: 'featured', page: 1 }}
              className="inline-flex min-h-11 w-fit items-center text-lg font-bold tracking-widest hover:text-accent"
            >
              KURIO
            </Link>
            <p className="text-sm leading-6">
              Feito para colecionadores,
              <br />
              criadores e cultura
            </p>
            <span className="wrap-break-word text-sm text-muted-foreground">contato@email.com</span>
            <span className="text-sm text-muted-foreground">+55 11 4002 8922</span>
          </div>
        </div>

        <div className="mx-auto max-w-page px-6 py-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {groups.map((group) => (
              <section key={group.title} className="min-w-0">
                <h2 className="mb-3 text-sm font-bold">{group.title}</h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>
                      {item === 'Meu perfil' || item === 'Lista de interesse' ? (
                        <Link
                          to="/profile"
                          search={{ tab: item === 'Meu perfil' ? 'profile' : 'watchlist' }}
                          className={linkStyle}
                        >
                          {item}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="inline-block py-2 text-sm leading-5 text-muted-foreground"
                        >
                          {item}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <div className="col-span-2 min-w-0 space-y-8 lg:col-span-1">
              <section>
                <h2 className="mb-4 text-sm font-bold">Redes sociais</h2>
                <ul className="flex flex-wrap gap-4">
                  {[
                    { name: 'Facebook', icon: 'f' },
                    { name: 'Instagram', icon: 'IG' },
                    { name: 'LinkedIn', icon: 'in' },
                    { name: 'YouTube', icon: 'YT' },
                  ].map(({ name, icon: Icon }) => (
                    <li key={name}>
                      <span
                        aria-disabled="true"
                        className="inline-flex size-11 items-center justify-center rounded-sm border border-primary/50 text-primary"
                      >
                        <span aria-hidden="true" className="text-xs font-bold">
                          {Icon}
                        </span>
                        <span className="sr-only">{name}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="mb-3 text-sm font-bold">Carteiras compatíveis</h2>
                <p className="flex min-h-7 flex-wrap items-center justify-between rounded-md border border-input bg-surface-warm px-2 py-2 text-center text-xs leading-3 font-bold tracking-[0.1px] text-accent">
                  <span>METAMASK</span> • <span>WALLETCONNECT</span> • <span>COINBASE</span>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 mb-6 text-center text-sm leading-6">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
