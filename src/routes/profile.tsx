import { usePageTitle } from '#/shared/hooks/use-page-title'
import { RequireSession } from '#/modules/session/require-session'
import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage, profileTabs, type ProfileTab } from '#/modules/profile/page'

export const Route = createFileRoute('/profile')({
  validateSearch: (search): { tab: ProfileTab } => ({
    tab: profileTabs.some((item) => item.id === search.tab)
      ? (search.tab as ProfileTab)
      : 'profile',
  }),
  component: ProfileRoute,
})

function ProfileRoute() {
  const { tab } = Route.useSearch()
  usePageTitle(
    tab === 'wallets'
      ? 'Carteiras'
      : (profileTabs.find((item) => item.id === tab)?.title ?? 'Perfil do colecionador'),
  )
  return (
    <RequireSession>
      <ProfilePage tab={tab} />
    </RequireSession>
  )
}
