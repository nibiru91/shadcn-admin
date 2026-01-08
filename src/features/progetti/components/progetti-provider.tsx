import { create } from 'zustand'
import type { Task, TaskFormData } from '../data/schema'

// Helper per generare UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback per browser più vecchi
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
import { 
  saveTasksToStorage, 
  loadTasksFromStorage 
} from '../data/storage'
import { differenceInDays, addDays } from 'date-fns'
import {
  validateDependencies,
  calculateParentDates,
  getAffectedTasks,
  shiftTask,
  getDependentTasks,
  validateTaskDependenciesOnMove,
} from '../utils/dependencies'

// Funzione ricorsiva helper per aggiornare le date di tutti i padri nella gerarchia
function updateParentDatesRecursively(
  taskId: string | null,
  allTasks: Task[],
  calculateParentDatesFn: (task: Task, tasks: Task[]) => { data_inizio: Date; data_fine: Date } | null
): Task[] {
  if (!taskId) return allTasks
  
  const task = allTasks.find((t) => t.id === taskId)
  if (!task) return allTasks
  
  const parentDates = calculateParentDatesFn(task, allTasks)
  if (!parentDates) return allTasks
  
  const taskIndex = allTasks.findIndex((t) => t.id === taskId)
  const updatedTasks = [...allTasks]
  updatedTasks[taskIndex] = {
    ...task,
    ...parentDates,
  }
  
  // Se questo task ha un padre, aggiorna anche il padre ricorsivamente
  if (task.task_padre_id) {
    return updateParentDatesRecursively(task.task_padre_id, updatedTasks, calculateParentDatesFn)
  }
  
  return updatedTasks
}

// Funzione helper per aggiornare i colori dei figli diretti (primo livello) che NON sono padri
// Forza il colore del padre solo sui figli diretti che non sono padri a loro volta
function updateChildrenColors(
  parentId: string,
  parentColor: NonNullable<Task['colore']> | null,
  allTasks: Task[]
): Task[] {
  return allTasks.map((task) => {
    // Se è un figlio diretto (primo livello) e NON è un padre, forza il colore del padre
    if (task.task_padre_id === parentId) {
      const isChildParent = allTasks.some((t) => t.task_padre_id === task.id)
      if (!isChildParent) {
        return {
          ...task,
          colore: parentColor,
        }
      }
    }
    return task
  })
}

interface ProgettiState {
  tasks: Task[]
  selectedTaskId: string | null
  modalOpen: boolean
  modalMode: 'create' | 'edit'
  loading: boolean
  
  // Actions
  loadTasks: () => void
  addTask: (taskData: TaskFormData) => Task | null
  updateTask: (taskId: string, taskData: TaskFormData) => Task | null
  updateTaskFields: (taskId: string, taskData: Omit<TaskFormData, 'data_inizio' | 'data_fine'>) => Task | null
  deleteTask: (taskId: string) => void
  toggleTaskCollapse: (taskId: string) => void
  moveTask: (taskId: string, newStartDate: Date, newEndDate: Date) => Promise<boolean>
  moveTaskWithDelta: (taskId: string, newStartDate: Date, newEndDate: Date, daysDelta: number) => Promise<boolean>
  moveTaskWithConfirmation: (taskId: string, newStartDate: Date, newEndDate: Date, confirmedDependentIds: string[]) => Promise<boolean>
  setSelectedTask: (taskId: string | null) => void
  openCreateModal: () => void
  openEditModal: (taskId: string) => void
  closeModal: () => void
  
  // Helpers
  getTaskById: (taskId: string) => Task | undefined
  getChildTasks: (parentId: string) => Task[]
  getRootTasks: () => Task[]
  getVisibleTasks: () => Task[]
}

export const useProgettiStore = create<ProgettiState>((set, get) => ({
  tasks: [],
  selectedTaskId: null,
  modalOpen: false,
  modalMode: 'create',
  loading: false,

  loadTasks: () => {
    const tasks = loadTasksFromStorage()
    set({ tasks })
  },

  addTask: (taskData: TaskFormData) => {
    const { tasks } = get()
    
    const newTask: Task = {
      id: generateUUID(),
      nome: taskData.nome,
      descrizione: taskData.descrizione ?? null,
      priorità: taskData.priorità,
      colore: taskData.colore ?? null,
      data_inizio: taskData.data_inizio as Date,
      data_fine: taskData.data_fine as Date,
      ore_previste: taskData.ore_previste ?? null,
      task_padre_id: taskData.task_padre_id ?? null,
      dipendenze: taskData.dipendenze || [],
      collapsed: false,
      created_at: new Date(),
    }

    // Validazione dipendenze
    const validation = validateDependencies(newTask, [...tasks, newTask])
    if (!validation.valid) {
      console.error('Errore validazione dipendenze:', validation.errors)
      return null
    }

    // Se è un task figlio, aggiorna le date del padre e tutti i padri nella gerarchia
    let updatedTasks = [...tasks, newTask]
    if (newTask.task_padre_id) {
      updatedTasks = updateParentDatesRecursively(newTask.task_padre_id, updatedTasks, calculateParentDates)
    }

    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
    return newTask
  },

  updateTask: (taskId: string, taskData: TaskFormData) => {
    const { tasks } = get()
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    
    if (taskIndex === -1) {
      return null
    }

    const oldTask = tasks[taskIndex]
    const colorChanged = oldTask.colore !== (taskData.colore ?? null)
    const updatedTask: Task = {
      ...oldTask,
      nome: taskData.nome,
      descrizione: taskData.descrizione ?? null,
      priorità: taskData.priorità,
      colore: taskData.colore ?? null,
      data_inizio: taskData.data_inizio as Date,
      data_fine: taskData.data_fine as Date,
      ore_previste: taskData.ore_previste ?? null,
      task_padre_id: taskData.task_padre_id ?? null,
      dipendenze: taskData.dipendenze || [],
    }

    // Validazione dipendenze
    const otherTasks = tasks.filter((t) => t.id !== taskId)
    const validation = validateDependencies(updatedTask, [...otherTasks, updatedTask])
    if (!validation.valid) {
      console.error('Errore validazione dipendenze:', validation.errors)
      return null
    }

    // Aggiorna i task
    let updatedTasks = [...tasks]
    updatedTasks[taskIndex] = updatedTask

    // Se è un task padre, ricalcola le date dai figli
    const parentDates = calculateParentDates(updatedTask, updatedTasks)
    if (parentDates) {
      updatedTasks[taskIndex] = {
        ...updatedTask,
        ...parentDates,
      }
    }

    // Se è un task figlio, aggiorna le date del padre e tutti i padri nella gerarchia
    if (updatedTask.task_padre_id) {
      updatedTasks = updateParentDatesRecursively(updatedTask.task_padre_id, updatedTasks, calculateParentDates)
    }

    // Se il colore è cambiato e questo task è un padre, aggiorna i colori dei figli diretti che non sono padri
    if (colorChanged) {
      const isParent = updatedTasks.some((t) => t.task_padre_id === updatedTask.id)
      if (isParent) {
        updatedTasks = updateChildrenColors(updatedTask.id, updatedTask.colore, updatedTasks)
      }
    }

    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
    return updatedTask
  },

  updateTaskFields: (taskId: string, taskData: Omit<TaskFormData, 'data_inizio' | 'data_fine'>) => {
    const { tasks } = get()
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    
    if (taskIndex === -1) {
      return null
    }

    const oldTask = tasks[taskIndex]
    const colorChanged = oldTask.colore !== (taskData.colore ?? null)
    const updatedTask: Task = {
      ...oldTask,
      nome: taskData.nome,
      descrizione: taskData.descrizione ?? null,
      priorità: taskData.priorità,
      colore: taskData.colore ?? null,
      // Non aggiornare le date - vengono gestite separatamente
      ore_previste: taskData.ore_previste ?? null,
      task_padre_id: taskData.task_padre_id ?? null,
      dipendenze: taskData.dipendenze || [],
    }

    // Aggiorna i task
    let updatedTasks = [...tasks]
    updatedTasks[taskIndex] = updatedTask

    // Se è un task padre, ricalcola le date dai figli
    const parentDates = calculateParentDates(updatedTask, updatedTasks)
    if (parentDates) {
      updatedTasks[taskIndex] = {
        ...updatedTask,
        ...parentDates,
      }
    }

    // Se è un task figlio, aggiorna le date del padre e tutti i padri nella gerarchia
    if (updatedTask.task_padre_id) {
      updatedTasks = updateParentDatesRecursively(updatedTask.task_padre_id, updatedTasks, calculateParentDates)
    }

    // Se il colore è cambiato e questo task è un padre, aggiorna i colori dei figli diretti che non sono padri
    if (colorChanged) {
      const isParent = updatedTasks.some((t) => t.task_padre_id === updatedTask.id)
      if (isParent) {
        updatedTasks = updateChildrenColors(updatedTask.id, updatedTask.colore, updatedTasks)
      }
    }

    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
    return updatedTask
  },

  deleteTask: (taskId: string) => {
    const { tasks } = get()
    
    // Elimina anche tutti i figli
    const tasksToDelete = new Set<string>([taskId])
    const findChildren = (parentId: string) => {
      tasks.forEach((t) => {
        if (t.task_padre_id === parentId) {
          tasksToDelete.add(t.id)
          findChildren(t.id)
        }
      })
    }
    findChildren(taskId)

    // Rimuovi anche dalle dipendenze
    const updatedTasks = tasks
      .filter((t) => !tasksToDelete.has(t.id))
      .map((t) => ({
        ...t,
        dipendenze: t.dipendenze.filter((d) => !tasksToDelete.has(d)),
      }))

    // Aggiorna i padri se necessario
    const finalTasks = updatedTasks.map((t) => {
      if (t.task_padre_id && tasksToDelete.has(t.task_padre_id)) {
        return { ...t, task_padre_id: null }
      }
      return t
    })

    // Ricalcola date dei padri
    const tasksWithUpdatedParents = finalTasks.map((t) => {
      if (!t.task_padre_id) {
        const parentDates = calculateParentDates(t, finalTasks)
        if (parentDates) {
          return { ...t, ...parentDates }
        }
      }
      return t
    })

    set({ tasks: tasksWithUpdatedParents })
    saveTasksToStorage(tasksWithUpdatedParents)
  },

  toggleTaskCollapse: (taskId: string) => {
    const { tasks } = get()
    
    // Funzione ricorsiva per trovare tutti i discendenti
    const getAllDescendants = (parentId: string): string[] => {
      const descendants: string[] = []
      const children = tasks.filter(t => t.task_padre_id === parentId)
      children.forEach(child => {
        descendants.push(child.id)
        descendants.push(...getAllDescendants(child.id))
      })
      return descendants
    }
    
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    const isCollapsing = !task.collapsed
    const descendantIds = getAllDescendants(taskId)
    
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, collapsed: !t.collapsed }
      }
      // Se stiamo collassando, collassa anche tutti i discendenti
      if (isCollapsing && descendantIds.includes(t.id)) {
        return { ...t, collapsed: true }
      }
      return t
    })
    
    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
  },

  moveTask: async (taskId: string, newStartDate: Date, _newEndDate: Date) => {
    const { tasks } = get()
    const task = tasks.find((t) => t.id === taskId)
    
    if (!task) {
      return false
    }

    // Mantieni la durata originale applicando lo stesso delta a entrambe le date
    const daysDelta = differenceInDays(newStartDate, task.data_inizio)
    const preservedEndDate = addDays(task.data_fine, daysDelta)

    // Usa la data fine preservata invece di quella calcolata dalla durata passata
    const newEnd = preservedEndDate

    // Trova i task che devono essere spostati
    const affectedTasks = getAffectedTasks(task, newStartDate, newEnd, tasks)

    // Se ci sono task dipendenti da spostare, ritorna false
    // Il componente chiamante gestirà la conferma
    if (affectedTasks.length > 0) {
      return false
    }

    // Aggiorna il task
    let updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          data_inizio: newStartDate,
          data_fine: newEnd,
        }
      }
      return t
    })

    // Se è un task padre, ricalcola le date dai figli
    const updatedTask = updatedTasks.find((t) => t.id === taskId)!
    const parentDates = calculateParentDates(updatedTask, updatedTasks)
    if (parentDates) {
      const taskIndex = updatedTasks.findIndex((t) => t.id === taskId)
      updatedTasks[taskIndex] = {
        ...updatedTask,
        ...parentDates,
      }
    }

    // Se è un task figlio, aggiorna le date del padre e tutti i padri nella gerarchia
    if (updatedTask.task_padre_id) {
      updatedTasks = updateParentDatesRecursively(updatedTask.task_padre_id, updatedTasks, calculateParentDates)
    }

    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
    return true
  },

  moveTaskWithDelta: async (
    taskId: string,
    newStartDate: Date,
    _newEndDate: Date,
    daysDelta: number
  ) => {
    const { tasks } = get()
    const task = tasks.find((t) => t.id === taskId)
    
    if (!task) {
      return false
    }

    // Preserva la durata originale del task
    const daysDeltaFromStart = differenceInDays(newStartDate, task.data_inizio)
    const preservedEndDate = addDays(task.data_fine, daysDeltaFromStart)

    // Trova tutti i task che dipendono da questo task
    const dependentTasks = getDependentTasks(taskId, tasks)
    
    // Aggiorna il task principale preservando la durata
    let updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          data_inizio: newStartDate,
          data_fine: preservedEndDate,
        }
      }
      return t
    })

    // Sposta automaticamente tutti i task dipendenti del delta calcolato
    for (const dependent of dependentTasks) {
      const newDependentDates = shiftTask(dependent, daysDelta)
      
      updatedTasks = updatedTasks.map((t) => {
        if (t.id === dependent.id) {
          return {
            ...t,
            ...newDependentDates,
          }
        }
        return t
      })
    }

    // Ricalcola date dei padri ricorsivamente per tutti i task modificati
    const modifiedTaskIds = [taskId, ...dependentTasks.map((t) => t.id)]
    for (const modifiedTaskId of modifiedTaskIds) {
      const modifiedTask = updatedTasks.find((t) => t.id === modifiedTaskId)
      if (modifiedTask) {
        // Se è un task padre, ricalcola le sue date
        const parentDates = calculateParentDates(modifiedTask, updatedTasks)
        if (parentDates) {
          const taskIndex = updatedTasks.findIndex((t) => t.id === modifiedTaskId)
          updatedTasks[taskIndex] = {
            ...modifiedTask,
            ...parentDates,
          }
        }
        
        // Se è un task figlio, aggiorna ricorsivamente tutti i padri nella gerarchia
        if (modifiedTask.task_padre_id) {
          updatedTasks = updateParentDatesRecursively(modifiedTask.task_padre_id, updatedTasks, calculateParentDates)
        }
      }
    }

    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
    return true
  },

  moveTaskWithConfirmation: async (
    taskId: string,
    newStartDate: Date,
    _newEndDate: Date,
    confirmedDependentIds: string[]
  ) => {
    const { tasks } = get()
    const task = tasks.find((t) => t.id === taskId)
    
    if (!task) {
      return false
    }

    // Preserva la durata originale del task
    const daysDeltaFromStart = differenceInDays(newStartDate, task.data_inizio)
    const preservedEndDate = addDays(task.data_fine, daysDeltaFromStart)
    
    // Calcola il delta (giorni di spostamento) basandosi sulla data fine preservata
    const daysDelta = differenceInDays(preservedEndDate, task.data_fine)
    
    // Trova tutti i task che dipendono da questo task
    const dependentTasks = getDependentTasks(taskId, tasks)

    // Sposta i task
    let updatedTasks = [...tasks]
    
    // Aggiorna il task principale preservando la durata
    updatedTasks = updatedTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          data_inizio: newStartDate,
          data_fine: preservedEndDate,
        }
      }
      return t
    })

    // Sposta tutti i task dipendenti del delta, ma solo quelli confermati vengono spostati anche se violano dipendenze
    for (const dependent of dependentTasks) {
      if (confirmedDependentIds.includes(dependent.id)) {
        // Task confermato: sposta anche se viola dipendenze
        const newDates = shiftTask(dependent, daysDelta)
        updatedTasks = updatedTasks.map((t) => {
          if (t.id === dependent.id) {
            return {
              ...t,
              ...newDates,
            }
          }
          return t
        })
      } else {
        // Task non confermato: sposta solo se non viola dipendenze
        const newDates = shiftTask(dependent, daysDelta)
        const depValidation = validateTaskDependenciesOnMove(
          { ...dependent, ...newDates },
          newDates.data_inizio,
          updatedTasks.filter((t) => t.id !== dependent.id).concat([{ ...dependent, ...newDates }])
        )
        if (depValidation.valid) {
          updatedTasks = updatedTasks.map((t) => {
            if (t.id === dependent.id) {
              return {
                ...t,
                ...newDates,
              }
            }
            return t
          })
        }
      }
    }

    // Ricalcola date dei padri ricorsivamente per tutti i task modificati
    const modifiedTaskIds = [taskId, ...confirmedDependentIds]
    for (const modifiedTaskId of modifiedTaskIds) {
      const modifiedTask = updatedTasks.find((t) => t.id === modifiedTaskId)
      if (modifiedTask) {
        // Se è un task padre, ricalcola le sue date
        const parentDates = calculateParentDates(modifiedTask, updatedTasks)
        if (parentDates) {
          const taskIndex = updatedTasks.findIndex((t) => t.id === modifiedTaskId)
          updatedTasks[taskIndex] = {
            ...modifiedTask,
            ...parentDates,
          }
        }
        
        // Se è un task figlio, aggiorna ricorsivamente tutti i padri nella gerarchia
        if (modifiedTask.task_padre_id) {
          updatedTasks = updateParentDatesRecursively(modifiedTask.task_padre_id, updatedTasks, calculateParentDates)
        }
      }
    }

    set({ tasks: updatedTasks })
    saveTasksToStorage(updatedTasks)
    return true
  },

  setSelectedTask: (taskId: string | null) => {
    set({ selectedTaskId: taskId })
  },

  openCreateModal: () => {
    set({ modalOpen: true, modalMode: 'create', selectedTaskId: null })
  },

  openEditModal: (taskId: string) => {
    set({ modalOpen: true, modalMode: 'edit', selectedTaskId: taskId })
  },

  closeModal: () => {
    set({ modalOpen: false, selectedTaskId: null })
  },

  getTaskById: (taskId: string) => {
    return get().tasks.find((t) => t.id === taskId)
  },

  getChildTasks: (parentId: string) => {
    return get().tasks.filter((t) => t.task_padre_id === parentId)
  },

  getRootTasks: () => {
    return get().tasks.filter((t) => !t.task_padre_id)
  },

  getVisibleTasks: () => {
    const { tasks } = get()
    const visible: Task[] = []
    
    const addTaskAndChildren = (task: Task) => {
      visible.push(task)
      if (!task.collapsed) {
        const children = tasks.filter((t) => t.task_padre_id === task.id)
        children.forEach(addTaskAndChildren)
      }
    }

    const rootTasks = tasks.filter((t) => !t.task_padre_id)
    rootTasks.forEach(addTaskAndChildren)
    
    return visible
  },
}))


