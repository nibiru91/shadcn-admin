import { useMemo } from 'react'
import { type Ferie } from '../../data/schema'
import { getDaysInMonth } from './grid-utils'

export type GridData = {
  users: Array<{ id: number; name: string; user: any }>
  dataByUser: Map<number, Map<number, Ferie>>
  days: number[]
}

/**
 * Hook per processare i dati delle ferie per la griglia
 * - Filtra solo pending e approved (esclude rejected)
 * - Filtra per mese/anno selezionato
 * - Estrae lista utenti unici (solo quelli con richieste nel mese)
 * - Crea struttura dati: Map<userId, Map<dayNumber, Ferie>>
 */
export function useGridData(
  data: Ferie[],
  year: number,
  month: number
): GridData {
  return useMemo(() => {
    const dataByUser = new Map<number, Map<number, Ferie>>()
    const usersMap = new Map<number, { id: number; name: string; user: any }>()

    // Filtra solo pending e approved
    const filteredData = data.filter(
      (item) => item.stato === 'pending' || item.stato === 'approved'
    )

    // Filtra per mese/anno e raggruppa per utente e giorno
    filteredData.forEach((item) => {
      const date = new Date(item.data_riferimento)
      const itemYear = date.getFullYear()
      const itemMonth = date.getMonth() + 1

      // Filtra per mese/anno selezionato
      if (itemYear !== year || itemMonth !== month) {
        return
      }

      const dayNumber = date.getDate()
      const userId = typeof item.user_id === 'object' && item.user_id !== null
        ? (item.user_id as any)?.id ?? item.user_id
        : item.user_id

      // Inizializza mappa utente se non esiste
      if (!dataByUser.has(userId)) {
        dataByUser.set(userId, new Map())
      }

      // Aggiungi richiesta per questo giorno (un solo record per utente/giorno)
      const userData = dataByUser.get(userId)!
      userData.set(dayNumber, item)

      // Aggiungi utente alla lista (se non già presente)
      if (!usersMap.has(userId)) {
        const user = (item as any).user_id
        const name = getUserName(user, userId)
        usersMap.set(userId, { id: userId, name, user })
      }
    })

    // Converti usersMap in array ordinato per nome
    const users = Array.from(usersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    // Ottieni giorni del mese
    const days = getDaysInMonth(year, month)

    return {
      users,
      dataByUser,
      days,
    }
  }, [data, year, month])
}

function getUserName(user: any, userId: number): string {
  if (!user) {
    return `User #${userId}`
  }

  if (typeof user === 'object') {
    const parts: string[] = []
    if (user.surname) parts.push(user.surname)
    if (user.name) parts.push(user.name)
    return parts.length > 0 ? parts.join(' ') : `User #${user.id || userId}`
  }

  return `User #${userId}`
}

