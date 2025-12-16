'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GridMonth } from './grid-month'
import { CalendarDayDialog } from '../calendar/calendar-day-dialog'
import { getMonthName, getNextMonth, getPreviousMonth } from '../calendar/calendar-utils'
import { type Ferie } from '../../data/schema'

interface FerieGridProps {
  data: Ferie[]
}

export function FerieGrid({ data }: FerieGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRequests, setSelectedRequests] = useState<Ferie[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)

  const handleCellClick = (request: Ferie) => {
    const date = new Date(request.data_riferimento)
    setSelectedDate(date)
    // Per il dialog, passiamo tutte le richieste di quel giorno
    // Ma nella griglia abbiamo solo quella richiesta specifica
    setSelectedRequests([request])
    setDialogOpen(true)
  }

  const handlePreviousMonth = () => {
    const prev = getPreviousMonth(currentYear, currentMonth)
    setCurrentYear(prev.year)
    setCurrentMonth(prev.month)
  }

  const handleNextMonth = () => {
    const next = getNextMonth(currentYear, currentMonth)
    setCurrentYear(next.year)
    setCurrentMonth(next.month)
  }

  const handleToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth() + 1)
  }

  return (
    <div className='space-y-4'>
      {/* Header con navigazione */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={handlePreviousMonth}
            aria-label='Mese precedente'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <h3 className='min-w-[200px] text-center text-lg font-semibold'>
            {getMonthName(currentYear, currentMonth)}
          </h3>
          <Button
            variant='outline'
            size='icon'
            onClick={handleNextMonth}
            aria-label='Mese successivo'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
        <Button variant='outline' onClick={handleToday}>
          Oggi
        </Button>
      </div>

      {/* Griglia */}
      <GridMonth
        year={currentYear}
        month={currentMonth}
        data={data}
        onCellClick={handleCellClick}
      />

      {/* Legenda */}
      <div className='flex flex-wrap items-center gap-4 text-sm'>
        <span className='text-muted-foreground'>Legenda:</span>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 rounded border border-yellow-500 bg-yellow-500/10' />
          <span>In attesa</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 rounded border border-green-500 bg-green-500/10' />
          <span>Approvato</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='font-semibold'>F</span>
          <span>= Ferie</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='font-semibold'>P</span>
          <span>= Permesso</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='font-semibold'>M</span>
          <span>= Malattia</span>
        </div>
      </div>

      {/* Dialog dettagli */}
      <CalendarDayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        requests={selectedRequests}
      />
    </div>
  )
}

