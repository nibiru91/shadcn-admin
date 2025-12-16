import { getISOWeek, getISOWeekYear, startOfISOWeek } from 'date-fns'

/**
 * Calcola settimana ISO, mese e anno da una data.
 * Gestisce correttamente i casi in cui una data di fine dicembre appartiene
 * alla settimana ISO 1 dell'anno successivo, restituendo invece l'ultima
 * settimana dell'anno gregoriano corrente.
 * 
 * @param date - La data da cui calcolare settimana, mese e anno
 * @returns Oggetto con week (settimana ISO), mese e anno
 */
export function calculateISOWeekFromDate(date: Date): {
  week: number
  mese: number
  anno: number
} {
  const gregorianYear = date.getFullYear()
  const isoWeek = getISOWeek(date)
  const isoWeekYear = getISOWeekYear(date)

  // Se l'anno ISO differisce dall'anno gregoriano, significa che la data appartiene
  // alla settimana ISO 1 dell'anno successivo. In questo caso, dobbiamo calcolare
  // l'ultima settimana dell'anno gregoriano corrente invece.
  let week: number
  let month: number
  let year: number

  if (isoWeekYear !== gregorianYear && isoWeek === 1) {
    // Se l'anno ISO differisce dall'anno gregoriano E la settimana ISO è 1,
    // significa che la data appartiene alla settimana ISO 1 dell'anno successivo.
    // In questo caso, dobbiamo calcolare quale sarebbe la settimana se considerassimo
    // questa come l'ultima settimana dell'anno corrente (settimana 53).
    // Calcoliamo la settimana ISO del 31 dicembre dell'anno corrente.
    // Se anche quella appartiene all'anno successivo, allora usiamo 53.
    // Altrimenti, calcoliamo l'ultima settimana che appartiene all'anno corrente.
    const lastDayOfYear = new Date(gregorianYear, 11, 31)
    const lastDayIsoWeek = getISOWeek(lastDayOfYear)
    const lastDayIsoYear = getISOWeekYear(lastDayOfYear)
    
    if (lastDayIsoYear !== gregorianYear) {
      // Il 31 dicembre appartiene anche all'anno successivo, quindi questa è la settimana 53
      week = 53
      const startOfWeek = startOfISOWeek(date)
      month = startOfWeek.getMonth() + 1
      year = gregorianYear // Usa l'anno gregoriano corrente
    } else {
      // Il 31 dicembre appartiene all'anno corrente, usa quella settimana
      week = lastDayIsoWeek
      const startOfWeek = startOfISOWeek(lastDayOfYear)
      month = startOfWeek.getMonth() + 1
      year = startOfWeek.getFullYear()
    }
  } else {
    // Anno ISO e gregoriano coincidono, usa i valori ISO normali
    week = isoWeek
    const startOfWeek = startOfISOWeek(date)
    month = startOfWeek.getMonth() + 1
    year = startOfWeek.getFullYear()
  }

  return { week, mese: month, anno: year }
}

