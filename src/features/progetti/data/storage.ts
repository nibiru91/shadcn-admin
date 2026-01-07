import type { Task } from './schema'

const STORAGE_KEY = 'progetti_tasks'
const STORAGE_VERSION = 1

interface StorageData {
  version: number
  tasks: Task[]
}

/**
 * Salva i task in sessionStorage
 */
export function saveTasksToStorage(tasks: Task[]): void {
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      tasks,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Errore nel salvataggio dei task:', error)
  }
}

/**
 * Carica i task da sessionStorage
 */
export function loadTasksFromStorage(): Task[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const data: StorageData = JSON.parse(stored)
    
    // Migrazione dati se necessario
    if (data.version !== STORAGE_VERSION) {
      return migrateData(data)
    }

    // Converti le date da stringhe a Date objects
    return data.tasks.map((task) => ({
      ...task,
      data_inizio: new Date(task.data_inizio),
      data_fine: new Date(task.data_fine),
      created_at: task.created_at ? new Date(task.created_at) : undefined,
    }))
  } catch (error) {
    console.error('Errore nel caricamento dei task:', error)
    return []
  }
}

/**
 * Migra i dati se la versione è cambiata
 */
function migrateData(data: StorageData): Task[] {
  // Per ora, se la versione è diversa, resettiamo i dati
  // In futuro, qui si possono aggiungere logiche di migrazione specifiche
  console.warn(`Versione storage ${data.version} non supportata, reset dati`)
  return []
}

/**
 * Pulisce i dati da sessionStorage
 */
export function clearTasksFromStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Errore nella pulizia dei task:', error)
  }
}

