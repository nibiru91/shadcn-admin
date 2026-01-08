import { useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { differenceInDays, addDays, startOfDay, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProgettiStore } from './progetti-provider'
import { getDateRange, generateTimelineDates, formatTimelineDate, isWeekend, taskOverlapsRange } from '../utils/dates'
import { TaskBar } from './task-bar'
import { DependencyArrows } from './dependency-arrows'
import { DependencyConfirmDialog } from './dependency-confirm-dialog'
import { DependencyErrorDialog } from './dependency-error-dialog'
import { validateTaskDependenciesOnMove, getDependentTasks } from '../utils/dependencies'
import type { Task } from '../data/schema'

const ROW_HEIGHT = 40
const TIMELINE_HEIGHT = 60

export function GanttChart() {
  const tasks = useProgettiStore((state) => state.tasks)
  const getVisibleTasks = useProgettiStore((state) => state.getVisibleTasks)
  const moveTask = useProgettiStore((state) => state.moveTask)
  const moveTaskWithDelta = useProgettiStore((state) => state.moveTaskWithDelta)
  const moveTaskWithConfirmation = useProgettiStore((state) => state.moveTaskWithConfirmation)
  const toggleTaskCollapse = useProgettiStore((state) => state.toggleTaskCollapse)
  const setSelectedTask = useProgettiStore((state) => state.setSelectedTask)
  const openEditModal = useProgettiStore((state) => state.openEditModal)

  const allVisibleTasks = getVisibleTasks()
  
  // Stato per la data di inizio della visualizzazione (default: oggi)
  const [viewStartDate, setViewStartDate] = useState(() => startOfDay(new Date()))
  
  // Helper per verificare se un task ha figli (controlla tutti i task, non solo quelli visibili)
  const hasChildren = (taskId: string) => {
    return tasks.some((t) => t.task_padre_id === taskId)
  }
  
  // Calcola sempre un range di 30 giorni a partire da viewStartDate
  const dateRange = useMemo(() => getDateRange(viewStartDate), [viewStartDate])
  const timelineDates = useMemo(
    () => generateTimelineDates(dateRange.start, dateRange.end),
    [dateRange]
  )
  
  // Handler per navigazione settimanale
  const handlePreviousWeek = () => {
    setViewStartDate((prev) => subDays(prev, 7))
  }
  
  const handleNextWeek = () => {
    setViewStartDate((prev) => addDays(prev, 7))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{
    task: Task
    newStartDate: Date
    newEndDate: Date
    affectedTasks: Task[]
  } | null>(null)
  const [dependencyError, setDependencyError] = useState<{
    task: Task
    minStartDate: Date
    dependencyTasks: Task[]
  } | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'task') {
      setActiveTaskId(active.data.current.task.id)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event
    setActiveTaskId(null)

    if (active.data.current?.type !== 'task') {
      return
    }

    const task = active.data.current.task as Task
    if (!delta.x) {
      return
    }

    // Trova il container del GanttChart per calcolare la larghezza
    const container = event.activatorEvent?.target
      ? ((event.activatorEvent.target as HTMLElement).closest('.gantt-container') as HTMLElement)
      : null
    const containerWidth = container?.clientWidth || 1000

    // Calcola le nuove date basandosi sullo spostamento
    const totalRangeMs = dateRange.end.getTime() - dateRange.start.getTime()
    const totalRangeDays = totalRangeMs / (1000 * 60 * 60 * 24)
    const daysPerPixel = totalRangeDays / containerWidth
    const daysShifted = delta.x * daysPerPixel

    // Calcola il delta in giorni interi arrotondato
    const daysDelta = Math.round(daysShifted)
    
    // Applica lo stesso delta sia a data_inizio che a data_fine per mantenere la durata
    const newStartDate = addDays(task.data_inizio, daysDelta)
    const newEndDate = addDays(task.data_fine, daysDelta)

    // Prima verifica se il task viola le sue dipendenze
    const dependencyValidation = validateTaskDependenciesOnMove(task, newStartDate, tasks)
    if (!dependencyValidation.valid && dependencyValidation.minStartDate) {
      // Mostra dialog di errore
      setDependencyError({
        task,
        minStartDate: dependencyValidation.minStartDate,
        dependencyTasks: dependencyValidation.dependencyTasks,
      })
      return
    }

    // Verifica se ci sono task che dipendono da questo task
    const dependentTasks = getDependentTasks(task.id, tasks)
    
    if (dependentTasks.length > 0) {
      // Calcola il delta (giorni di spostamento) basandosi sulla data fine
      const daysDelta = differenceInDays(newEndDate, task.data_fine)
      
      if (daysDelta === 0) {
        // Nessun spostamento, aggiorna solo il task principale
        await moveTask(task.id, newStartDate, newEndDate)
        return
      }

      // Simula lo spostamento di tutti i task dipendenti per verificare se violano le loro dipendenze
      const affectedTasks: Task[] = []
      const allTasksAfterShift = tasks.map((t) => {
        if (t.id === task.id) {
          return { ...t, data_inizio: newStartDate, data_fine: newEndDate }
        }
        if (dependentTasks.some((dt) => dt.id === t.id)) {
          return {
            ...t,
            data_inizio: addDays(t.data_inizio, daysDelta),
            data_fine: addDays(t.data_fine, daysDelta),
          }
        }
        return t
      })

      // Verifica se alcuni task dipendenti violano le loro dipendenze dopo lo spostamento
      for (const dependent of dependentTasks) {
        const shiftedDependent = allTasksAfterShift.find((t) => t.id === dependent.id)!
        const depValidation = validateTaskDependenciesOnMove(
          shiftedDependent,
          shiftedDependent.data_inizio,
          allTasksAfterShift
        )
        if (!depValidation.valid) {
          affectedTasks.push(dependent)
        }
      }

      if (affectedTasks.length > 0) {
        // Alcuni task dipendenti violerebbero le loro dipendenze, mostra dialog di conferma
        setPendingMove({
          task,
          newStartDate,
          newEndDate,
          affectedTasks,
        })
      } else {
        // Sposta automaticamente tutti i task dipendenti del delta calcolato
        await moveTaskWithDelta(task.id, newStartDate, newEndDate, daysDelta)
      }
    } else {
      // Nessun task dipendente, sposta direttamente
      await moveTask(task.id, newStartDate, newEndDate)
    }
  }

  const handleDependencyConfirm = async (confirmedTaskIds: string[]) => {
    if (!pendingMove) return

    const { task, newStartDate, newEndDate } = pendingMove

    // Usa moveTaskWithConfirmation per gestire lo spostamento del task principale e dei task dipendenti confermati
    await moveTaskWithConfirmation(task.id, newStartDate, newEndDate, confirmedTaskIds)

    setPendingMove(null)
  }

  const handleTaskClick = (taskId: string) => {
    const task = visibleTasks.find((t) => t.id === taskId)
    if (!task) return

    // Apri sempre il modal di modifica (sia per task padre che per task figlio)
    setSelectedTask(taskId)
    openEditModal(taskId)
  }

  const handleIconClick = (taskId: string) => {
    toggleTaskCollapse(taskId)
  }

  // Filtra i task visibili in base al range di date visualizzato (solo per rendering barre)
  const visibleTasks = useMemo(() => {
    return allVisibleTasks.filter((task) =>
      taskOverlapsRange(task.data_inizio, task.data_fine, dateRange.start, dateRange.end)
    )
  }, [allVisibleTasks, dateRange])

  const activeTask = activeTaskId
    ? visibleTasks.find((t) => t.id === activeTaskId)
    : null
  
  // Set di task IDs che sono nel range (per filtrare le barre da renderizzare)
  const visibleTaskIds = useMemo(() => {
    return new Set(visibleTasks.map((t) => t.id))
  }, [visibleTasks])

  // Raggruppa TUTTI i task per riga (considerando la gerarchia) - per la colonna sinistra
  const taskRows = useMemo(() => {
    const rows: Array<{ task: Task; index: number; depth: number }> = []
    const processed = new Set<string>()

    const addTaskToRow = (task: Task, depth: number = 0) => {
      if (processed.has(task.id)) return
      processed.add(task.id)

      rows.push({ task, index: rows.length, depth })

      if (!task.collapsed) {
        // Usa allVisibleTasks per la gerarchia completa nella colonna sinistra
        const children = allVisibleTasks.filter((t) => t.task_padre_id === task.id)
        children.forEach((child) => addTaskToRow(child, depth + 1))
      }
    }

    // Usa allVisibleTasks per mostrare tutti i task nella colonna sinistra
    const rootTasks = allVisibleTasks.filter((t) => !t.task_padre_id)
    rootTasks.forEach((task) => addTaskToRow(task))

    return rows
  }, [allVisibleTasks])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='flex h-full w-full overflow-x-hidden gantt-container'>
        {/* Colonna sinistra - Nomi task */}
        <div className='sticky left-0 z-10 w-[250px] flex-shrink-0 border-r border-border bg-background'>
          {/* Header vuoto per allineamento con controlli e timeline */}
          <div 
            className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
            style={{ height: `${48 + TIMELINE_HEIGHT}px` }}
          />
          
          {/* Nomi task */}
          <div className='relative'>
            {taskRows.map(({ task, depth }) => {
              const isParent = hasChildren(task.id)
              return (
                <div
                  key={task.id}
                  className='flex items-center border-b border-border/30 px-3 text-sm'
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    paddingLeft: `${12 + depth * 16}px`, // Indentazione basata sulla profondità
                  }}
                >
                  <span className='truncate font-medium flex-1'>{task.nome}</span>
                  {isParent && (
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleIconClick(task.id)
                      }}
                      className='ml-2 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded p-0.5 hover:bg-muted/50'
                    >
                      {task.collapsed ? (
                        <ChevronRight className='h-3 w-3' />
                      ) : (
                        <ChevronDown className='h-3 w-3' />
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Colonna destra - Gantt Chart */}
        <div className='flex-1 relative overflow-x-hidden'>
          {/* Controlli di navigazione */}
          <div className='sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={handlePreviousWeek}
              className='h-8 w-8'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div className='text-sm font-medium'>
              {formatTimelineDate(dateRange.start)} - {formatTimelineDate(dateRange.end)}
            </div>
            <Button
              variant='outline'
              size='icon'
              onClick={handleNextWeek}
              className='h-8 w-8'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
          
          {/* Timeline */}
          <div
            className='sticky top-[48px] z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
            style={{ height: `${TIMELINE_HEIGHT}px` }}
          >
            <div className='relative h-full'>
              {timelineDates.map((date, index) => {
                const weekend = isWeekend(date)
                return (
                  <div
                    key={index}
                    className={`absolute top-0 h-full flex flex-col border-r border-border p-2 text-xs transition-colors ${
                      weekend 
                        ? 'bg-muted/70 dark:bg-muted/60 hover:bg-muted/80' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    style={{
                      left: `${(index / timelineDates.length) * 100}%`,
                      width: `${100 / timelineDates.length}%`,
                    }}
                  >
                    <div className='font-semibold'>{formatTimelineDate(date)}</div>
                    <div className='text-muted-foreground text-[10px]'>
                      {date.toLocaleDateString('it-IT', { weekday: 'short' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task Area */}
          <div
            className='relative'
            style={{
              height: `${taskRows.length * ROW_HEIGHT}px`,
              minHeight: '400px',
            }}
          >
            {/* Grid lines */}
            <div className='absolute inset-0'>
              {timelineDates.map((date, index) => {
                const weekend = isWeekend(date)
                return (
                  <div
                    key={`vertical-${index}`}
                    className={`absolute top-0 h-full border-r ${
                      weekend 
                        ? 'border-border/80 bg-muted/30 dark:bg-muted/25' 
                        : 'border-border/50'
                    }`}
                    style={{
                      left: `${(index / timelineDates.length) * 100}%`,
                    }}
                  />
                )
              })}
              {taskRows.map((_, index) => (
                <div
                  key={`horizontal-${index}`}
                  className='absolute left-0 w-full border-b border-border/30'
                  style={{
                    top: `${index * ROW_HEIGHT}px`,
                  }}
                />
              ))}
            </div>

            {/* Dependency Arrows - Solo per task nel range */}
            <DependencyArrows
              tasks={visibleTasks}
              taskRows={taskRows.filter(({ task }) => visibleTaskIds.has(task.id))}
              containerId="gantt-dependency-container"
            />

            {/* Task Bars - Renderizza solo i task che sono nel range visualizzato */}
            {taskRows
              .filter(({ task }) => visibleTaskIds.has(task.id))
              .map(({ task, index }) => {
                const isParent = hasChildren(task.id)
                return (
                  <TaskBar
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    rangeStart={dateRange.start}
                    rangeEnd={dateRange.end}
                    rowIndex={index}
                    rowHeight={ROW_HEIGHT}
                    isParent={isParent}
                    onClick={() => handleTaskClick(task.id)}
                    onIconClick={() => handleIconClick(task.id)}
                  />
                )
              })}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className='rounded-md border-2 border-primary bg-primary/90 p-3 text-primary-foreground shadow-xl backdrop-blur-sm'>
              <div className='font-semibold'>{activeTask.nome}</div>
              <div className='text-xs opacity-80'>
                {activeTask.data_inizio.toLocaleDateString('it-IT')} - {activeTask.data_fine.toLocaleDateString('it-IT')}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>

      {pendingMove && (
        <DependencyConfirmDialog
          open={!!pendingMove}
          onOpenChange={(open) => !open && setPendingMove(null)}
          taskToMove={pendingMove.task}
          affectedTasks={pendingMove.affectedTasks}
          onConfirm={handleDependencyConfirm}
        />
      )}

      {dependencyError && (
        <DependencyErrorDialog
          open={!!dependencyError}
          onOpenChange={(open) => !open && setDependencyError(null)}
          task={dependencyError.task}
          minStartDate={dependencyError.minStartDate}
          dependencyTasks={dependencyError.dependencyTasks}
        />
      )}
    </DndContext>
  )
}

