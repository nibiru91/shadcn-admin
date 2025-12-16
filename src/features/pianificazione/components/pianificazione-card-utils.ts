import {
  startOfISOWeek,
  endOfISOWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns'
import { supabase } from '@/lib/supabase'

export type Filters = {
  user_id?: number[]
  week?: number[]
  mese?: number[]
  anno?: number[]
  commessa?: number[]
  is_delayable?: boolean[]
}

export type UserStats = {
  orePotenziali: number
  oreFerie: number
  oreDisponibili: number
  orePianificate: number
  oreRimanenti: number
  saturazione: number
}

/**
 * Ottiene i giorni lavorativi in un range (escludendo sabato e domenica)
 */
function getWorkingDaysInRange(dataDa: Date, dataA: Date): Date[] {
  const workingDays: Date[] = []
  const currentDate = new Date(dataDa)

  while (currentDate <= dataA) {
    const dayOfWeek = currentDate.getDay()
    // 0 = domenica, 6 = sabato
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return workingDays
}

/**
 * Calcola i giorni lavorativi in base ai filtri temporali.
 * Se ci sono filtri multipli, calcola l'intersezione.
 * Se non ci sono filtri temporali, ritorna null.
 */
export function getWorkingDaysInPeriod(filters: Filters): Date[] | null {
  const hasWeek = filters.week && filters.week.length > 0
  const hasMese = filters.mese && filters.mese.length > 0
  const hasAnno = filters.anno && filters.anno.length > 0

  // Se non ci sono filtri temporali, ritorna null
  if (!hasWeek && !hasMese && !hasAnno) {
    return null
  }

  // Se c'è solo la settimana (senza anno, usa anno corrente)
  if (hasWeek && !hasMese && !hasAnno) {
    const weeks = filters.week!
    const currentYear = new Date().getFullYear()
    const allDays: Date[] = []

    for (const week of weeks) {
      // Trova il 4 gennaio dell'anno (sempre nella settimana ISO 1)
      const jan4 = new Date(currentYear, 0, 4)
      const weekStart = startOfISOWeek(jan4)
      // Aggiungi (week - 1) settimane per arrivare alla settimana desiderata
      const targetWeekStart = new Date(weekStart)
      targetWeekStart.setDate(weekStart.getDate() + (week - 1) * 7)
      const targetWeekEnd = endOfISOWeek(targetWeekStart)
      const days = getWorkingDaysInRange(targetWeekStart, targetWeekEnd)
      allDays.push(...days)
    }

    return allDays
  }

  // Se c'è solo il mese
  if (hasMese && !hasWeek && !hasAnno) {
    const mesi = filters.mese!
    const currentYear = new Date().getFullYear()
    const allDays: Date[] = []

    for (const mese of mesi) {
      const monthStart = startOfMonth(new Date(currentYear, mese - 1, 1))
      const monthEnd = endOfMonth(monthStart)
      const days = getWorkingDaysInRange(monthStart, monthEnd)
      allDays.push(...days)
    }

    return allDays
  }

  // Se c'è solo l'anno
  if (hasAnno && !hasWeek && !hasMese) {
    const anni = filters.anno!
    const allDays: Date[] = []

    for (const anno of anni) {
      const yearStart = startOfYear(new Date(anno, 0, 1))
      const yearEnd = endOfYear(yearStart)
      const days = getWorkingDaysInRange(yearStart, yearEnd)
      allDays.push(...days)
    }

    return allDays
  }

  // Filtri multipli: calcola l'intersezione
  const allDays: Date[] = []
  const anni = hasAnno ? filters.anno! : [new Date().getFullYear()]

  for (const anno of anni) {
    if (hasWeek && hasMese) {
      // Settimana + Mese: solo giorni che appartengono a entrambi
      const weeks = filters.week!
      const mesi = filters.mese!

      for (const week of weeks) {
        for (const mese of mesi) {
          // Trova il 4 gennaio dell'anno (sempre nella settimana ISO 1)
          const jan4 = new Date(anno, 0, 4)
          const weekStart = startOfISOWeek(jan4)
          // Aggiungi (week - 1) settimane per arrivare alla settimana desiderata
          const targetWeekStart = new Date(weekStart)
          targetWeekStart.setDate(weekStart.getDate() + (week - 1) * 7)
          const targetWeekEnd = endOfISOWeek(targetWeekStart)

          // Filtra solo i giorni che appartengono anche al mese specificato
          const days = getWorkingDaysInRange(targetWeekStart, targetWeekEnd)
          const filteredDays = days.filter((day) => {
            const dayMonth = day.getMonth() + 1
            return dayMonth === mese && day.getFullYear() === anno
          })
          allDays.push(...filteredDays)
        }
      }
    } else if (hasWeek) {
      // Settimana + Anno
      const weeks = filters.week!

      for (const week of weeks) {
        // Trova il 4 gennaio dell'anno (sempre nella settimana ISO 1)
        const jan4 = new Date(anno, 0, 4)
        const weekStart = startOfISOWeek(jan4)
        // Aggiungi (week - 1) settimane per arrivare alla settimana desiderata
        const targetWeekStart = new Date(weekStart)
        targetWeekStart.setDate(weekStart.getDate() + (week - 1) * 7)
        const targetWeekEnd = endOfISOWeek(targetWeekStart)
        const days = getWorkingDaysInRange(targetWeekStart, targetWeekEnd)
        allDays.push(...days)
      }
    } else if (hasMese) {
      // Mese + Anno
      const mesi = filters.mese!

      for (const mese of mesi) {
        const monthStart = startOfMonth(new Date(anno, mese - 1, 1))
        const monthEnd = endOfMonth(monthStart)
        const days = getWorkingDaysInRange(monthStart, monthEnd)
        allDays.push(...days)
      }
    }
  }

  // Rimuovi duplicati
  const uniqueDays = Array.from(
    new Set(allDays.map((d) => d.toISOString()))
  ).map((iso) => new Date(iso))

  return uniqueDays
}

/**
 * Recupera le ferie approvate per un utente nel periodo filtrato
 */
export async function fetchApprovedFerie(
  userId: number,
  filters: Filters
): Promise<number> {
  let query = supabase
    .from('ferie_details')
    .select(`
      ore,
      data_riferimento,
      week,
      mese,
      anno,
      request_id:ferie_requests!request_id(stato)
    `)
    .eq('user_id', userId)

  // Applica filtri temporali
  if (filters.week && filters.week.length > 0) {
    query = query.in('week', filters.week)
  }
  if (filters.mese && filters.mese.length > 0) {
    query = query.in('mese', filters.mese)
  }
  if (filters.anno && filters.anno.length > 0) {
    query = query.in('anno', filters.anno)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Filtra solo le ferie approvate e somma le ore
  const approvedData = (data || []).filter((item) => {
    const request = item.request_id as any
    return request?.stato === 'approved'
  })

  const totalOre = approvedData.reduce((sum, item) => sum + Number(item.ore || 0), 0)
  return totalOre
}

/**
 * Recupera le pianificazioni per un utente nel periodo filtrato
 */
export async function fetchPlanningForUser(
  userId: number,
  filters: Filters
): Promise<number> {
  let query = supabase
    .from('planning')
    .select('ore, week, mese, anno, commessa, is_delayable')
    .eq('user_id', userId)
    .eq('is_valid', true)

  // Applica filtri
  if (filters.week && filters.week.length > 0) {
    query = query.in('week', filters.week)
  }
  if (filters.mese && filters.mese.length > 0) {
    query = query.in('mese', filters.mese)
  }
  if (filters.anno && filters.anno.length > 0) {
    query = query.in('anno', filters.anno)
  }
  if (filters.commessa && filters.commessa.length > 0) {
    query = query.in('commessa', filters.commessa)
  }
  if (filters.is_delayable && filters.is_delayable.length > 0) {
    // Se contiene true, filtra per is_delayable = true
    // Se contiene false, filtra per is_delayable = false
    const hasTrue = filters.is_delayable.includes(true)
    const hasFalse = filters.is_delayable.includes(false)

    if (hasTrue && !hasFalse) {
      query = query.eq('is_delayable', true)
    } else if (hasFalse && !hasTrue) {
      query = query.eq('is_delayable', false)
    }
    // Se entrambi, non filtra (mostra tutto)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  // Somma le ore
  const totalOre = (data || []).reduce((sum, item) => sum + Number(item.ore || 0), 0)
  return totalOre
}

/**
 * Calcola le statistiche per un utente
 */
export async function calculateUserStats(
  userId: number,
  filters: Filters
): Promise<UserStats> {
  const workingDays = getWorkingDaysInPeriod(filters)
  const orePotenziali = workingDays ? workingDays.length * 8 : 0

  const [oreFerie, orePianificate] = await Promise.all([
    fetchApprovedFerie(userId, filters),
    fetchPlanningForUser(userId, filters),
  ])

  const oreDisponibili = Math.max(0, orePotenziali - oreFerie)
  const oreRimanenti = Math.max(0, oreDisponibili - orePianificate)
  const saturazione =
    oreDisponibili > 0 ? (orePianificate / oreDisponibili) * 100 : 0

  return {
    orePotenziali,
    oreFerie,
    oreDisponibili,
    orePianificate,
    oreRimanenti,
    saturazione,
  }
}

