import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  format,
  addDays,
  subDays,
  startOfDay,
  differenceInDays,
  isBefore,
  isAfter,
} from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * Ottiene l'intervallo di date per visualizzare il GanttChart
 * Sempre 30 giorni consecutivi a partire da viewStartDate (default: data odierna)
 */
export function getDateRange(viewStartDate?: Date): {
  start: Date
  end: Date
} {
  const start = startOfDay(viewStartDate || new Date())
  const end = addDays(start, 29) // 30 giorni inclusivi (start + 29 giorni = 30 giorni totali)
  
  return {
    start,
    end,
  }
}

/**
 * Verifica se una data è un weekend (sabato o domenica)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Domenica (0) o Sabato (6)
}

/**
 * Verifica se un task si sovrappone al range di date visualizzato
 * Un task si sovrappone se: task.data_inizio <= range.end AND task.data_fine >= range.start
 */
export function taskOverlapsRange(
  taskStart: Date,
  taskEnd: Date,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  // Normalizza tutte le date all'inizio del giorno per confronti accurati
  const normalizedTaskStart = startOfDay(taskStart)
  const normalizedTaskEnd = startOfDay(taskEnd)
  const normalizedRangeStart = startOfDay(rangeStart)
  const normalizedRangeEnd = startOfDay(rangeEnd)
  
  // Un task si sovrappone se non è completamente prima o completamente dopo il range
  return (
    !isAfter(normalizedTaskStart, normalizedRangeEnd) &&
    !isBefore(normalizedTaskEnd, normalizedRangeStart)
  )
}

/**
 * Genera un array di date per la timeline del GanttChart
 */
export function generateTimelineDates(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end })
}

/**
 * Formatta una data per la timeline
 */
export function formatTimelineDate(date: Date): string {
  return format(date, 'd MMM', { locale: it })
}

/**
 * Formatta una data per il tooltip o label
 */
export function formatTaskDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: it })
}

/**
 * Calcola la posizione percentuale di una data nell'intervallo
 * Normalizza le date all'inizio del giorno per evitare problemi con i timestamp
 */
export function calculateDatePosition(
  date: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  // Normalizza tutte le date all'inizio del giorno
  const normalizedDate = startOfDay(date)
  const normalizedRangeStart = startOfDay(rangeStart)
  const normalizedRangeEnd = startOfDay(rangeEnd)
  
  const totalDays = differenceInDays(normalizedRangeEnd, normalizedRangeStart) + 1
  const daysFromStart = differenceInDays(normalizedDate, normalizedRangeStart)
  
  return (daysFromStart / totalDays) * 100
}

/**
 * Calcola la larghezza percentuale di un task nell'intervallo
 * Include sia il giorno di inizio che quello di fine (durata inclusiva)
 */
export function calculateTaskWidth(
  taskStart: Date,
  taskEnd: Date,
  rangeStart: Date,
  rangeEnd: Date
): number {
  // Normalizza tutte le date all'inizio del giorno
  const normalizedTaskStart = startOfDay(taskStart)
  const normalizedTaskEnd = startOfDay(taskEnd)
  const normalizedRangeStart = startOfDay(rangeStart)
  const normalizedRangeEnd = startOfDay(rangeEnd)
  
  // Calcola la durata inclusiva (giorno di inizio + giorni intermedi + giorno di fine)
  const taskDays = differenceInDays(normalizedTaskEnd, normalizedTaskStart) + 1
  const totalDays = differenceInDays(normalizedRangeEnd, normalizedRangeStart) + 1
  
  return (taskDays / totalDays) * 100
}

/**
 * Converte una posizione percentuale in una data nell'intervallo
 */
export function positionToDate(
  positionPercent: number,
  rangeStart: Date,
  rangeEnd: Date
): Date {
  const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  const daysFromStart = (positionPercent / 100) * totalDays
  
  return addDays(rangeStart, Math.round(daysFromStart))
}

