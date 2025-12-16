'use client'

import { getCalendarDays, WEEKDAY_NAMES, getRequestsForDate } from './calendar-utils'
import { CalendarDay } from './calendar-day'
import { type Ferie } from '../../data/schema'

interface CalendarMonthProps {
  year: number
  month: number
  requestsByDate: Map<string, Ferie[]>
  onDayClick?: (date: Date, requests: Ferie[]) => void
}

export function CalendarMonth({ year, month, requestsByDate, onDayClick }: CalendarMonthProps) {
  const days = getCalendarDays(year, month)

  return (
    <div className='rounded-lg border bg-card'>
      <div className='grid grid-cols-7 gap-0'>
        {/* Header giorni settimana */}
        {WEEKDAY_NAMES.map((dayName) => (
          <div
            key={dayName}
            className='border-b border-border bg-muted/30 p-2 text-center text-sm font-medium'
          >
            {dayName}
          </div>
        ))}

        {/* Giorni del calendario */}
        {days.map((day) => {
          const requests = getRequestsForDate(day.date, requestsByDate)
          return (
            <CalendarDay
              key={`${day.date.toISOString()}`}
              day={day}
              requests={requests}
              onClick={onDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}

