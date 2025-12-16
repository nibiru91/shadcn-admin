import { getDaysInMonth as dateFnsGetDaysInMonth } from 'date-fns'

/**
 * Ottiene array di numeri giorni per un mese (1-31)
 */
export function getDaysInMonth(year: number, month: number): number[] {
  const daysCount = dateFnsGetDaysInMonth(new Date(year, month - 1, 1))
  return Array.from({ length: daysCount }, (_, i) => i + 1)
}

/**
 * Restituisce il simbolo per la tipologia
 */
export function getTipologiaSymbol(tipologia: string): string {
  switch (tipologia) {
    case 'ferie':
      return 'F'
    case 'permesso':
      return 'P'
    case 'malattia':
      return 'M'
    default:
      return '?'
  }
}

/**
 * Formatta il nome utente per la visualizzazione
 */
export function getUserDisplayName(user: any, userId?: number): string {
  if (!user) {
    return userId ? `User #${userId}` : 'User'
  }

  if (typeof user === 'object') {
    const parts: string[] = []
    if (user.surname) parts.push(user.surname)
    if (user.name) parts.push(user.name)
    return parts.length > 0 ? parts.join(' ') : `User #${user.id || userId}`
  }

  return userId ? `User #${userId}` : 'User'
}

/**
 * Formatta l'header della colonna giorno
 */
export function formatDayHeader(dayNumber: number): string {
  return String(dayNumber)
}

