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
import { differenceInDays, addDays, isBefore } from 'date-fns'
import { useProgettiStore } from './progetti-provider'
import { getDateRange, generateTimelineDates, formatTimelineDate } from '../utils/dates'
import { getAffectedTasks } from '../utils/dependencies'
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

  const visibleTasks = getVisibleTasks()
  
  // Helper per verificare se un task ha figli (controlla tutti i task, non solo quelli visibili)
  const hasChildren = (taskId: string) => {
    return tasks.some((t) => t.task_padre_id === taskId)
  }
  const dateRange = useMemo(() => getDateRange(visibleTasks), [visibleTasks])
  const timelineDates = useMemo(
    () => generateTimelineDates(dateRange.start, dateRange.end),
    [dateRange]
  )

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

  const activeTask = activeTaskId
    ? visibleTasks.find((t) => t.id === activeTaskId)
    : null

  // Raggruppa i task per riga (considerando la gerarchia)
  const taskRows = useMemo(() => {
    const rows: Array<{ task: Task; index: number }> = []
    const processed = new Set<string>()

    const addTaskToRow = (task: Task, depth: number = 0) => {
      if (processed.has(task.id)) return
      processed.add(task.id)

      rows.push({ task, index: rows.length })

      if (!task.collapsed) {
        const children = visibleTasks.filter((t) => t.task_padre_id === task.id)
        children.forEach((child) => addTaskToRow(child, depth + 1))
      }
    }

    const rootTasks = visibleTasks.filter((t) => !t.task_padre_id)
    rootTasks.forEach((task) => addTaskToRow(task))

    return rows
  }, [visibleTasks])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='relative w-full overflow-x-auto gantt-container'>
        {/* Timeline */}
        <div
          className='sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
          style={{ height: `${TIMELINE_HEIGHT}px` }}
        >
          <div className='relative h-full'>
            {timelineDates.map((date, index) => (
              <div
                key={index}
                className='absolute top-0 h-full flex flex-col border-r border-border bg-muted/30 p-2 text-xs transition-colors hover:bg-muted/50'
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
            ))}
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
            {timelineDates.map((_, index) => (
              <div
                key={`vertical-${index}`}
                className='absolute top-0 h-full border-r border-border/50'
                style={{
                  left: `${(index / timelineDates.length) * 100}%`,
                }}
              />
            ))}
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

          {/* Dependency Arrows */}
          <DependencyArrows
            tasks={visibleTasks}
            taskRows={taskRows}
            containerId="gantt-dependency-container"
          />

          {/* Task Bars */}
          {taskRows.map(({ task, index }) => {
            const isParent = hasChildren(task.id)
            return (
              <TaskBar
                key={task.id}
                task={task}
                allTasks={tasks}
                visibleTasks={visibleTasks}
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

