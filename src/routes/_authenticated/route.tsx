import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      throw redirect({
        to: '/sign-in',
        search: {
          // Usa la location corrente come redirect dopo il login
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
