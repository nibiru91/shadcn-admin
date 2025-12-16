'use client'

import { cn } from '@/lib/utils'
import { TableCell } from '@/components/ui/table'
import { type Ferie } from '../../data/schema'
import { getTipologiaSymbol } from './grid-utils'

interface GridCellProps {
  request: Ferie | null
  onClick?: (request: Ferie) => void
}

export function GridCell({ request, onClick }: GridCellProps) {
  const hasRequest = request !== null

  const handleClick = () => {
    if (hasRequest && onClick) {
      onClick(request)
    }
  }

  if (!hasRequest) {
    return (
      <TableCell className='h-10 w-10 border border-border bg-muted/20 p-1 text-center text-xs' />
    )
  }

  const symbol = getTipologiaSymbol(request.tipologia)
  const isPending = request.stato === 'pending'
  const isApproved = request.stato === 'approved'

  return (
    <TableCell
      className={cn(
        'h-10 w-10 border p-1 text-center text-xs font-semibold transition-colors',
        isPending &&
          'cursor-pointer border-yellow-500 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400',
        isApproved &&
          'cursor-pointer border-green-500 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400'
      )}
      onClick={handleClick}
      title={`${symbol} - ${isPending ? 'In attesa' : 'Approvato'}`}
    >
      {symbol}
    </TableCell>
  )
}

