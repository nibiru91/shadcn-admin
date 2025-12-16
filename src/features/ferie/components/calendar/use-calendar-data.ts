import { useMemo } from 'react'
import { formatDateKey } from './calendar-utils'
import { type Ferie } from '../../data/schema'

/**
 * Hook per processare i dati delle ferie per il calendario
 * - Filtra solo pending e approved (esclude rejected)
 * - Raggruppa per data_riferimento
 * - Restituisce una mappa data -> richieste
 */
export function useCalendarData(data: Ferie[]): Map<string, Ferie[]> {
  return useMemo(() => {
    const requestsByDate = new Map<string, Ferie[]>()

    // Filtra solo pending e approved
    const filteredData = data.filter(
      (item) => item.stato === 'pending' || item.stato === 'approved'
    )

    // Raggruppa per data_riferimento
    filteredData.forEach((item) => {
      const dateKey = formatDateKey(item.data_riferimento)
      const existing = requestsByDate.get(dateKey) || []
      requestsByDate.set(dateKey, [...existing, item])
    })

    return requestsByDate
  }, [data])
}

