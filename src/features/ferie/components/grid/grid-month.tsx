'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GridCell } from './grid-cell'
import { useGridData, type GridData } from './use-grid-data'
import { type Ferie } from '../../data/schema'
import { formatDayHeader } from './grid-utils'

interface GridMonthProps {
  year: number
  month: number
  data: Ferie[]
  onCellClick?: (request: Ferie) => void
}

export function GridMonth({ year, month, data, onCellClick }: GridMonthProps) {
  const { users, dataByUser, days } = useGridData(data, year, month)

  if (users.length === 0) {
    return (
      <div className='rounded-lg border bg-card p-8 text-center text-muted-foreground'>
        Nessuna richiesta per questo mese
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-lg border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='sticky left-0 z-10 min-w-[150px] bg-background font-semibold'>
              Utente
            </TableHead>
            {days.map((day) => (
              <TableHead
                key={day}
                className='min-w-[40px] text-center text-xs font-semibold'
              >
                {formatDayHeader(day)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const userRequests = dataByUser.get(user.id) || new Map()

            return (
              <TableRow key={user.id}>
                <TableCell className='sticky left-0 z-10 min-w-[150px] bg-background font-medium'>
                  {user.name}
                </TableCell>
                {days.map((day) => {
                  const request = userRequests.get(day) || null
                  return (
                    <GridCell
                      key={`${user.id}-${day}`}
                      request={request}
                      onClick={onCellClick}
                    />
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

