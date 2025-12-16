import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type UserProfile = {
  id: number
  name: string | null
  surname: string | null
  ruolo: string | null
  email: string | null
  auth_id: string | null
}

type UserProviderState = {
  user: UserProfile | null
  isLoading: boolean
  error: Error | null
  isSuperadmin: boolean
}

const initialState: UserProviderState = {
  user: null,
  isLoading: true,
  error: null,
  isSuperadmin: false,
}

const UserContext = createContext<UserProviderState>(initialState)

type UserProviderProps = {
  children: React.ReactNode
}

async function fetchCurrentUser(): Promise<UserProfile | null> {
  // Ottieni la sessione corrente
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) throw new Error(sessionError.message)
  if (!sessionData.session?.user?.id) return null

  const authId = sessionData.session.user.id

  // Query su users_profile usando auth_id
  const { data, error } = await supabase
    .from('users_profile')
    .select('id, name, surname, ruolo, email, auth_id')
    .eq('auth_id', authId)
    .single()

  if (error) {
    // Se non trova l'utente, non è un errore critico (potrebbe non essere ancora registrato)
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data
}

export function UserProvider({ children }: UserProviderProps) {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: Infinity, // Cache permanente fino a refresh manuale
    retry: 1,
  })

  const isSuperadmin = user?.ruolo === 'Superadmin'

  const contextValue: UserProviderState = {
    user: user || null,
    isLoading,
    error: error as Error | null,
    isSuperadmin,
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}

