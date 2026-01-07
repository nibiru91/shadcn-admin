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
} from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * Ottiene l'intervallo di date per visualizzare il GanttChart
 * Basato su tutti i task presenti
 */
export function getDateRange(tasks: Array<{ data_inizio: Date; data_fine: Date }>): {
  start: Date
  end: Date
} {
  if (tasks.length === 0) {
    // Se non ci sono task, mostra il mese corrente
    const now = new Date()
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    }
  }

  const allDates = tasks.flatMap((task) => [task.data_inizio, task.data_fine])
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

  // Estendi di una settimana prima e dopo per migliore visualizzazione
  return {
    start: startOfWeek(subDays(minDate, 7), { weekStartsOn: 1 }),
    end: endOfWeek(addDays(maxDate, 7), { weekStartsOn: 1 }),
  }
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

