'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Ferie } from '../../data/schema'
import { useUser } from '@/context/user-provider'
import { useFerie } from '../ferie-provider'

interface CalendarDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  requests: Ferie[]
}

export function CalendarDayDialog({
  open,
  onOpenChange,
  date,
  requests,
}: CalendarDayDialogProps) {
  const { isSuperadmin } = useUser()
  const { setOpen, setCurrentRow } = useFerie()

  if (!date) return null

  const formattedDate = format(date, 'EEEE d MMMM yyyy', { locale: it })

  const getTipologiaLabel = (tipologia: string) => {
    switch (tipologia) {
      case 'ferie':
        return 'Ferie'
      case 'permesso':
        return 'Permesso'
      case 'malattia':
        return 'Malattia'
      default:
        return tipologia
    }
  }

  const getFasciaOrariaLabel = (fascia: string) => {
    switch (fascia) {
      case 'mattina':
        return 'Mattina'
      case 'pomeriggio':
        return 'Pomeriggio'
      case 'full_day':
        return 'Giornata intera'
      default:
        return fascia
    }
  }

  const getUserDisplayName = (request: Ferie): string => {
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

  const handleView = (request: Ferie) => {
    setCurrentRow(request)
    setOpen('edit')
    onOpenChange(false)
  }

  const handleApprove = (request: Ferie) => {
    setCurrentRow(request)
    setOpen('approve')
    onOpenChange(false)
  }

  const handleReject = (request: Ferie) => {
    setCurrentRow(request)
    setOpen('reject')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Richieste del {formattedDate}</DialogTitle>
          <DialogDescription>
            {requests.length} {requests.length === 1 ? 'richiesta' : 'richieste'} per questo giorno
          </DialogDescription>
        </DialogHeader>

        {requests.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>
            Nessuna richiesta per questo giorno
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Tipologia</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Ore</TableHead>
                    <TableHead>Fascia oraria</TableHead>
                    <TableHead>Note</TableHead>
                    {isSuperadmin && <TableHead>Azioni</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='font-medium'>
                        {getUserDisplayName(request)}
                      </TableCell>
                      <TableCell>{getTipologiaLabel(request.tipologia)}</TableCell>
                      <TableCell>
                        {request.stato === 'pending' ? (
                          <Badge
                            variant='outline'
                            className='border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                          >
                            In attesa
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                          >
                            Approvato
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{request.ore.toFixed(2)}</TableCell>
                      <TableCell>
                        {request.tipologia === 'permesso'
                          ? getFasciaOrariaLabel(request.fascia_oraria || 'full_day')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {request.note_richiesta ? (
                          <span className='line-clamp-2 text-sm'>{request.note_richiesta}</span>
                        ) : (
                          <span className='text-muted-foreground text-xs'>-</span>
                        )}
                      </TableCell>
                      {isSuperadmin && (
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleView(request)}
                            >
                              Visualizza
                            </Button>
                            {request.stato === 'pending' && (
                              <>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='text-green-600 dark:text-green-400'
                                  onClick={() => handleApprove(request)}
                                >
                                  Approva
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='text-orange-600 dark:text-orange-400'
                                  onClick={() => handleReject(request)}
                                >
                                  Rifiuta
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

