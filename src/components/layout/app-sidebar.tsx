import { useLayout } from '@/context/layout-provider'
import { useUser } from '@/context/user-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user, isLoading } = useUser()

  // Mappa i dati dell'utente dal contesto al formato richiesto
  const userData = user
    ? {
        name: [user.surname, user.name].filter(Boolean).join(' ') || 'Utente',
        email: user.email || '',
        avatar: '/avatars/shadcn.jpg', // Fallback, può essere esteso in futuro
      }
    : {
        name: 'Utente',
        email: '',
        avatar: '/avatars/shadcn.jpg',
      }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && <NavUser user={userData} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
