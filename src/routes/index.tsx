import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage } from '../modules/catalog'

export const Route = createFileRoute('/')({ component: CatalogPage })
