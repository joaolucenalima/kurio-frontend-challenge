import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/shared/components/ui/button'

export function Header() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-y-4">
      <a
        href="/"
        className="cursor-pointer transition-colors duration-200 ease-out hover:text-accent focus-visible:text-accent flex h-9 items-center font-mono text-sm leading-5 font-bold tracking-widest lg:w-40"
      >
        KURIO
      </a>
      <nav
        aria-label="Navegação principal"
        className="order-last flex w-full justify-center h-11 gap-6 font-mono text-base leading-6 font-normal tracking-normal lg:order-0 lg:w-auto lg:gap-10"
      >
        <Link
          to="/"
          search={{ sort: 'featured', page: 1 }}
          activeOptions={{ exact: true, includeSearch: false }}
          className="cursor-pointer transition-colors duration-200 ease-out hover:text-accent focus-visible:text-accent aria-[current=page]:border-b-4 aria-[current=page]:border-primary aria-[current=page]:font-bold aria-[current=page]:text-accent aria-[current=page]:hover:text-primary"
        >
          Início
        </Link>
        <Link
          to="/"
          search={{ sort: 'featured', page: 1 }}
          hash="catalog"
          className="cursor-pointer transition-colors duration-200 ease-out hover:text-accent focus-visible:text-accent aria-[current=page]:border-b-4 aria-[current=page]:border-primary aria-[current=page]:font-bold aria-[current=page]:text-accent aria-[current=page]:hover:text-primary"
        >
          Mercado
        </Link>
        <span
          aria-disabled="true"
          className="cursor-not-allowed"
          title="Disponível em uma próxima etapa"
        >
          Criadores
        </span>
        <span aria-disabled="true" className="cursor-not-allowed" title="Conteúdo fora do escopo">
          Aprenda
        </span>
      </nav>
      <div className="flex h-9 items-center gap-7" aria-label="Ações da conta">
        <Button
          asChild
          variant="icon"
          size="icon"
          className="size-5 rounded-none p-0"
          aria-label="Buscar NFTs"
        >
          <Link to="/" search={{ sort: 'featured', page: 1 }} hash="catalog">
            <Search className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="icon"
          size="icon"
          className="size-5 rounded-none p-0"
          aria-label="Carrinho indisponível nesta etapa"
          disabled
        >
          <ShoppingCart className="size-5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          disabled
          title="Login indisponível nesta etapa"
          className="font-mono text-base leading-6 font-medium tracking-normal text-primary-foreground"
        >
          <LogIn aria-hidden="true" />
          Entrar
        </Button>
      </div>
    </header>
  )
}
