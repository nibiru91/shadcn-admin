import type { Task } from '../data/schema'
import { calculateDatePosition } from '../utils/dates'

interface DependencyArrowProps {
  fromTask: Task
  toTask: Task
  rangeStart: Date
  rangeEnd: Date
  rowHeight: number
  fromRowIndex: number
  toRowIndex: number
}

export function DependencyArrow({
  fromTask,
  toTask,
  rangeStart,
  rangeEnd,
  rowHeight,
  fromRowIndex,
  toRowIndex,
}: DependencyArrowProps) {
  const fromX = calculateDatePosition(fromTask.data_fine, rangeStart, rangeEnd)
  const toX = calculateDatePosition(toTask.data_inizio, rangeStart, rangeEnd)
  const fromY = fromRowIndex * rowHeight + rowHeight / 2
  const toY = toRowIndex * rowHeight + rowHeight / 2

  // Calcola le coordinate in pixel (assumendo una larghezza container)
  // Per ora usiamo percentuali e lasciamo che il browser calcoli
  const startXPercent = fromX
  const endXPercent = toX

  // Crea un percorso curvo con freccia
  const midXPercent = (startXPercent + endXPercent) / 2

  return (
    <svg
      className='pointer-events-none absolute inset-0 z-[5] overflow-visible'
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <marker
          id={`arrowhead-${fromTask.id}-${toTask.id}`}
          markerWidth='10'
          markerHeight='10'
          refX='9'
          refY='3'
          orient='auto'
          markerUnits='strokeWidth'
        >
          <polygon
            points='0 0, 10 3, 0 6'
            className='fill-primary stroke-primary'
          />
        </marker>
      </defs>
      <path
        d={`M ${startXPercent}% ${fromY} Q ${midXPercent}% ${fromY}, ${midXPercent}% ${(fromY + toY) / 2} T ${endXPercent}% ${toY}`}
        stroke='hsl(var(--primary))'
        strokeWidth='2.5'
        fill='none'
        markerEnd={`url(#arrowhead-${fromTask.id}-${toTask.id})`}
        className='opacity-70 transition-opacity hover:opacity-100'
        style={{
          strokeDasharray: '5,5',
        }}
      />
    </svg>
  )
}

