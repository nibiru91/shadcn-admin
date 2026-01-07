import { addDays, isAfter, isBefore, differenceInDays } from 'date-fns'
import type { Task } from '../data/schema'

/**
 * Verifica se le dipendenze di un task sono rispettate
 * Un task dipendente deve avere data_inizio >= data_fine(task da cui dipende) + 1 giorno
 */
export function validateDependencies(
  task: Task,
  allTasks: Task[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const dependencyId of task.dipendenze) {
    const dependencyTask = allTasks.find((t) => t.id === dependencyId)
    
    if (!dependencyTask) {
      errors.push(`Task dipendente "${dependencyId}" non trovato`)
      continue
    }

    // Verifica che data_inizio >= data_fine(dipendenza) + 1 giorno
    const minStartDate = addDays(dependencyTask.data_fine, 1)
    
    if (isBefore(task.data_inizio, minStartDate)) {
      errors.push(
        `Il task "${task.nome}" deve iniziare almeno il ${minStartDate.toLocaleDateString('it-IT')} ` +
        `(1 giorno dopo la fine di "${dependencyTask.nome}")`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Calcola le date di un task padre basandosi sui figli
 * data_inizio = min(data_inizio figli)
 * data_fine = max(data_fine figli)
 */
export function calculateParentDates(
  parentTask: Task,
  allTasks: Task[]
): { data_inizio: Date; data_fine: Date } | null {
  const children = allTasks.filter((t) => t.task_padre_id === parentTask.id)
  
  if (children.length === 0) {
    return null
  }

  const startDates = children.map((c) => c.data_inizio)
  const endDates = children.map((c) => c.data_fine)

  const minStart = new Date(Math.min(...startDates.map((d) => d.getTime())))
  const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())))

  return {
    data_inizio: minStart,
    data_fine: maxEnd,
  }
}

/**
 * Trova tutti i task che devono essere spostati quando si sposta un task
 * Ritorna i task dipendenti che verrebbero violati dallo spostamento
 */
export function getAffectedTasks(
  task: Task,
  _newStartDate: Date,
  newEndDate: Date,
  allTasks: Task[]
): Task[] {
  const affected: Task[] = []

  // Trova tutti i task che dipendono da questo task
  const dependentTasks = allTasks.filter((t) => 
    t.dipendenze.includes(task.id)
  )

  for (const dependent of dependentTasks) {
    // Verifica se lo spostamento viola la dipendenza
    const minStartDate = addDays(newEndDate, 1)
    
    if (isBefore(dependent.data_inizio, minStartDate)) {
      affected.push(dependent)
    }
  }

  return affected
}

/**
 * Calcola di quanti giorni spostare un task dipendente quando il task da cui dipende viene spostato
 */
export function calculateRequiredShift(
  dependentTask: Task,
  dependencyNewEndDate: Date
): number {
  const minStartDate = addDays(dependencyNewEndDate, 1)
  
  if (isBefore(dependentTask.data_inizio, minStartDate)) {
    return differenceInDays(minStartDate, dependentTask.data_inizio)
  }
  
  return 0
}

/**
 * Sposta un task mantenendo la durata
 */
export function shiftTask(
  task: Task,
  daysToShift: number
): { data_inizio: Date; data_fine: Date } {
  return {
    data_inizio: addDays(task.data_inizio, daysToShift),
    data_fine: addDays(task.data_fine, daysToShift),
  }
}

/**
 * Verifica se due task si accavallano (overlap)
 */
export function tasksOverlap(
  task1: { data_inizio: Date; data_fine: Date },
  task2: { data_inizio: Date; data_fine: Date }
): boolean {
  return (
    isBefore(task1.data_inizio, task2.data_fine) &&
    isAfter(task1.data_fine, task2.data_inizio)
  )
}

/**
 * Calcola quanti giorni di overlap ci sono tra due task
 */
export function calculateOverlapDays(
  task1: { data_inizio: Date; data_fine: Date },
  task2: { data_inizio: Date; data_fine: Date }
): number {
  if (!tasksOverlap(task1, task2)) {
    return 0
  }

  const overlapStart = isAfter(task1.data_inizio, task2.data_inizio)
    ? task1.data_inizio
    : task2.data_inizio
  
  const overlapEnd = isBefore(task1.data_fine, task2.data_fine)
    ? task1.data_fine
    : task2.data_fine

  return differenceInDays(overlapEnd, overlapStart) + 1
}

/**
 * Trova tutti i task che dipendono da un task dato
 */
export function getDependentTasks(
  taskId: string,
  allTasks: Task[]
): Task[] {
  return allTasks.filter((t) => t.dipendenze.includes(taskId))
}

/**
 * Valida le dipendenze di un task quando viene spostato
 * Ritorna un errore se la nuova posizione viola le dipendenze
 */
export function validateTaskDependenciesOnMove(
  task: Task,
  newStartDate: Date,
  allTasks: Task[]
): { valid: boolean; minStartDate: Date | null; dependencyTasks: Task[] } {
  if (task.dipendenze.length === 0) {
    return { valid: true, minStartDate: null, dependencyTasks: [] }
  }

  let maxEndDate: Date | null = null
  const dependencyTasks: Task[] = []

  for (const dependencyId of task.dipendenze) {
    const dependencyTask = allTasks.find((t) => t.id === dependencyId)
    if (!dependencyTask) continue

    dependencyTasks.push(dependencyTask)
    const dependencyEndDate = dependencyTask.data_fine

    if (!maxEndDate || isAfter(dependencyEndDate, maxEndDate)) {
      maxEndDate = dependencyEndDate
    }
  }

  if (!maxEndDate) {
    return { valid: true, minStartDate: null, dependencyTasks: [] }
  }

  const minStartDate = addDays(maxEndDate, 1)
  const valid = !isBefore(newStartDate, minStartDate)

  return {
    valid,
    minStartDate,
    dependencyTasks,
  }
}

