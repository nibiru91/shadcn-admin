'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { type Ferie } from '../../data/schema'
import { formatDateKey } from './calendar-utils'
import type { CalendarDay as CalendarDayType } from './calendar-utils'

interface CalendarDayProps {
  day: CalendarDayType
  requests: Ferie[]
  onClick?: (date: Date, requests: Ferie[]) => void
}

export function CalendarDay({ day, requests, onClick }: CalendarDayProps) {
  const hasRequests = requests.length > 0
  const dateKey = formatDateKey(day.date)

  const handleClick = () => {
    if (hasRequests && onClick) {
      onClick(day.date, requests)
    }
  }

  // Raggruppa richieste per stato
  const pendingRequests = requests.filter((r) => r.stato === 'pending')
  const approvedRequests = requests.filter((r) => r.stato === 'approved')

  return (
    <div
      className={cn(
        'relative flex min-h-[100px] flex-col border border-border p-2 transition-colors',
        !day.isCurrentMonth && 'bg-muted/30 text-muted-foreground',
        hasRequests && 'cursor-pointer hover:bg-muted/50',
        !hasRequests && 'hover:bg-muted/20'
      )}
      onClick={handleClick}
    >
      <div className='mb-1 text-sm font-medium'>{day.dayNumber}</div>
      
      {hasRequests && (
        <div className='flex flex-1 flex-col gap-1'>
          {pendingRequests.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {pendingRequests.map((request, idx) => (
                <Badge
                  key={`pending-${dateKey}-${idx}`}
                  variant='outline'
                  className='border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs'
                >
                  {getUserDisplayName(request)} ({request.ore.toFixed(1)}h)
                </Badge>
              ))}
            </div>
          )}
          {approvedRequests.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {approvedRequests.map((request, idx) => (
                <Badge
                  key={`approved-${dateKey}-${idx}`}
                  variant='outline'
                  className='border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 text-xs'
                >
                  {getUserDisplayName(request)} ({request.ore.toFixed(1)}h)
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getUserDisplayName(request: Ferie): string {
  const user = (request as any).user_id
  if (!user) {
    return `User #${request.user_id}`
  }
  
  if (typeof user === 'object') {
    const parts: string[] = []
    if (user.surname) parts.push(user.surname)
    if (user.name) parts.push(user.name)
    return parts.length > 0 ? parts.join(' ') : `User #${user.id || request.user_id}`
  }
  
  return `User #${request.user_id}`
}

