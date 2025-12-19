import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, addMonths, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'

export type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
  dayNumber: number
}

/**
 * Ottiene tutti i giorni da visualizzare per un mese (inclusi i giorni del mese precedente/successivo per completare la settimana)
 */
export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Lunedì
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Lunedì

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, monthStart),
    dayNumber: date.getDate(),
  }))
}

/**
 * Formatta una data come stringa YYYY-MM-DD
 */
export function formatDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd')
}

/**
 * Verifica se una data ha richieste
 */
export function hasRequests(date: Date | string, requestsByDate: Map<string, any[]>): boolean {
  const dateKey = formatDateKey(date)
  const requests = requestsByDate.get(dateKey)
  return requests !== undefined && requests.length > 0
}

/**
 * Ottiene le richieste per una data specifica
 */
export function getRequestsForDate(date: Date | string, requestsByDate: Map<string, any[]>): any[] {
  const dateKey = formatDateKey(date)
  return requestsByDate.get(dateKey) || []
}

/**
 * Formatta una data per la visualizzazione
 */
export function formatDateDisplay(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: it })
}

/**
 * Ottiene il nome del mese in italiano
 */
export function getMonthName(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, 'MMMM yyyy', { locale: it })
}

/**
 * Nomi dei giorni della settimana in italiano
 */
export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

/**
 * Navigazione mesi
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  const next = addMonths(new Date(year, month - 1, 1), 1)
  return { year: next.getFullYear(), month: next.getMonth() + 1 }
}

export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  const prev = subMonths(new Date(year, month - 1, 1), 1)
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 }
}

