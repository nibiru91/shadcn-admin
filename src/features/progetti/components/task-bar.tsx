import { useDraggable } from '@dnd-kit/core'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, Priorita } from '../data/schema'
import { calculateDatePosition, calculateTaskWidth } from '../utils/dates'

interface TaskBarProps {
  task: Task
  rangeStart: Date
  rangeEnd: Date
  rowIndex: number
  rowHeight: number
  isParent: boolean
  onClick: () => void
  onIconClick?: (e: React.MouseEvent) => void
}

const priorityColors: Record<Priorita, string> = {
  bassa: 'bg-blue-500/90 hover:bg-blue-600 dark:bg-blue-600/90 dark:hover:bg-blue-700',
  media: 'bg-yellow-500/90 hover:bg-yellow-600 dark:bg-yellow-600/90 dark:hover:bg-yellow-700',
  alta: 'bg-orange-500/90 hover:bg-orange-600 dark:bg-orange-600/90 dark:hover:bg-orange-700',
  critica: 'bg-red-500/90 hover:bg-red-600 dark:bg-red-600/90 dark:hover:bg-red-700',
}

const priorityBorders: Record<Priorita, string> = {
  bassa: 'border-blue-600 dark:border-blue-500',
  media: 'border-yellow-600 dark:border-yellow-500',
  alta: 'border-orange-600 dark:border-orange-500',
  critica: 'border-red-600 dark:border-red-500',
}

export function TaskBar({
  task,
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

  return (
    <div
      ref={setNodeRef}
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
        priorityColors[task.priorità],
        priorityBorders[task.priorità],
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
  )
}

