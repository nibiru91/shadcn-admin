import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type Planning } from '../data/schema'
import {
  type Filters,
  calculateUserStats,
  type UserStats,
} from './pianificazione-card-utils'
import { PianificazioneCardUserDetailCard } from './pianificazione-card-user-detail-card'

interface PianificazioneCardUserDetailProps {
  filters: Filters
  planningData: Planning[]
}

type UserInfo = {
  id: number
  name: string
  surname: string
}

function getUserDisplayName(user: UserInfo | any): string {
  if (!user) return ''
  const parts: string[] = []
  if (user.surname) parts.push(user.surname)
  if (user.name) parts.push(user.name)
  return parts.length > 0 ? parts.join(' ') : `User #${user.id || ''}`
}

function extractUserId(userIdValue: any): number | null {
  if (!userIdValue) return null
  if (typeof userIdValue === 'number') return userIdValue
  if (typeof userIdValue === 'object' && userIdValue !== null) {
    return (userIdValue as any)?.id ?? null
  }
  return null
}

export function PianificazioneCardUserDetail({
  filters,
  planningData,
}: PianificazioneCardUserDetailProps) {
  // Estrae utenti unici dalle pianificazioni filtrate
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<number, UserInfo>()

    // Se c'è un filtro user_id, mostra solo quegli utenti
    const allowedUserIds = filters.user_id && filters.user_id.length > 0
      ? new Set(filters.user_id)
      : null

    planningData.forEach((planning) => {
      const userId = extractUserId(planning.user_id)
      if (!userId) return

      // Se c'è un filtro user_id, mostra solo quegli utenti
      if (allowedUserIds && !allowedUserIds.has(userId)) {
        return
      }

      if (!userMap.has(userId)) {
        const userObj = planning.user_id as any
        userMap.set(userId, {
          id: userId,
          name: userObj?.name || '',
          surname: userObj?.surname || '',
        })
      }
    })

    return Array.from(userMap.values()).sort((a, b) => {
      const nameA = getUserDisplayName(a)
      const nameB = getUserDisplayName(b)
      return nameA.localeCompare(nameB)
    })
  }, [planningData, filters.user_id])

  // Verifica se ci sono filtri temporali
  const hasTemporalFilters =
    (filters.week && filters.week.length > 0) ||
    (filters.mese && filters.mese.length > 0) ||
    (filters.anno && filters.anno.length > 0)

  if (!hasTemporalFilters) {
    return (
      <div className="rounded-md border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Seleziona almeno un filtro temporale (Settimana, Mese o Anno) per
        visualizzare le statistiche
      </div>
    )
  }

  if (uniqueUsers.length === 0) {
    return (
      <div className="rounded-md border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Nessun utente con pianificazioni nel periodo selezionato
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {uniqueUsers.map((user) => (
        <UserCard key={user.id} user={user} filters={filters} />
      ))}
    </div>
  )
}

function UserCard({
  user,
  filters,
}: {
  user: UserInfo
  filters: Filters
}) {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['user-stats', user.id, filters],
    queryFn: () => calculateUserStats(user.id, filters),
    staleTime: 30 * 1000, // 30 secondi
    enabled:
      (filters.week && filters.week.length > 0) ||
      (filters.mese && filters.mese.length > 0) ||
      (filters.anno && filters.anno.length > 0),
  })

  // Non mostrare la card se l'utente non ha pianificazioni (ore pianificate = 0)
  // Aspetta che le statistiche siano caricate prima di decidere
  if (!isLoading && stats && stats.orePianificate === 0) {
    return null
  }

  return (
    <PianificazioneCardUserDetailCard
      userId={user.id}
      userName={getUserDisplayName(user)}
      stats={stats || null}
      isLoading={isLoading}
    />
  )
}

