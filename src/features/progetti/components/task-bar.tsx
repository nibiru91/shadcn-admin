import { useDraggable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, Priorita } from '../data/schema'
import { calculateDatePosition, calculateTaskWidth } from '../utils/dates'
import { colorMap, priorityColors } from '../utils/colors'

interface TaskBarProps {
  task: Task
  allTasks: Task[]
  visibleTasks: Task[]
  rangeStart: Date
  rangeEnd: Date
  rowIndex: number
  rowHeight: number
  isParent: boolean
  onClick: () => void
  onIconClick?: (e: React.MouseEvent) => void
}

// Funzione helper per ottenere il colore ereditato di un task
function getTaskColor(task: Task, allTasks: Task[]): { bg: string; border: string } | null {
  // Se il task ha un colore diretto, usalo
  if (task.colore) {
    return colorMap[task.colore]
  }
  
  // Altrimenti, se ha un padre, eredita il colore del padre (ricorsivamente)
  if (task.task_padre_id) {
    const parent = allTasks.find((t) => t.id === task.task_padre_id)
    if (parent) {
      return getTaskColor(parent, allTasks)
    }
  }
  
  // Se non ha colore né padre, usa il colore basato sulla priorità
  return null
}

export function TaskBar({
  task,
  allTasks,
  visibleTasks,
  rangeStart,
  rangeEnd,
  rowIndex,
  rowHeight,
  isParent,
  onClick,
  onIconClick,
}: TaskBarProps) {
  const left = calculateDatePosition(task.data_inizio, rangeStart, rangeEnd)
  const width = calculateTaskWidth(task.data_inizio, task.data_fine, rangeStart, rangeEnd)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `task-${task.id}`,
    data: {
      task,
      type: 'task',
    },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const top = rowIndex * rowHeight + rowHeight / 2 - 12

  // Ottieni il colore ereditato o usa quello della priorità
  const taskColor = getTaskColor(task, allTasks)
  const colorClasses = taskColor || priorityColors[task.priorità]

  return (
    <>
      {/* Elementi di riferimento per d3.js */}
      <div
        id={`task-end-${task.id}`}
        data-task-id={task.id}
        data-task-end="true"
        style={{
          position: 'absolute',
          left: `${left + width}%`,
          top: `${top + 12}px`,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        id={`task-start-${task.id}`}
        data-task-id={task.id}
        data-task-start="true"
        style={{
          position: 'absolute',
          left: `${left}%`,
          top: `${top + 12}px`,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        ref={setNodeRef}
        id={`task-${task.id}`}
        style={{
          position: 'absolute',
          left: `${left}%`,
          top: `${top}px`,
          width: `${width}%`,
          minWidth: '20px',
          height: '24px',
          zIndex: isDragging ? 50 : 10,
          ...style,
        }}
        className={cn(
          'group cursor-move rounded-md border-2 transition-all shadow-sm',
          colorClasses.bg,
          colorClasses.border,
          isDragging && 'opacity-50 shadow-lg scale-105',
          isParent && 'font-semibold ring-2 ring-offset-1',
          !isDragging && 'hover:shadow-md'
        )}
        onClick={onClick}
        {...listeners}
        {...attributes}
      >
        <div className='flex h-full items-center justify-between px-2 text-xs text-white'>
          <span className='truncate font-medium'>{task.nome}</span>
          {isParent && (
            <div
              className='ml-2 flex items-center cursor-pointer rounded p-0.5 hover:bg-white/20 transition-colors'
              onClick={(e) => {
                e.stopPropagation()
                onIconClick?.(e)
              }}
            >
              {task.collapsed ? (
                <ChevronRight className='h-3 w-3 transition-transform hover:scale-110' />
              ) : (
                <ChevronDown className='h-3 w-3 transition-transform hover:scale-110' />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

