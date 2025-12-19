'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

type Commessa = {
  id: number
  title: string
  tariffa_oraria: number
}

type TimesheetRecord = {
  id: number
  giorno: string | null
  ore_lavorate: number
  ore_billable: number | null
  detail: string | null
  user_id: {
    id: number
    name: string | null
    surname: string | null
  }
}

async function fetchCommesse(idAzienda: number) {
  const { data, error } = await supabase
    .from('commesse')
    .select('id, title, tariffa_oraria')
    .eq('is_valid', true)
    .or(`cliente_diretto.eq.${idAzienda},cliente_fatturazione.eq.${idAzienda}`)
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as Commessa[]
}

async function fetchTimesheet(idCommessa: number) {
  const { data, error } = await supabase
    .from('timesheet')
    .select(`
      id,
      giorno,
      ore_lavorate,
      ore_billable,
      detail,
      user_id:users_profile!user_id(id, name, surname)
    `)
    .eq('commessa', idCommessa)
    .eq('is_billed', false)
    .eq('is_valid', true)
    .order('giorno', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  // Handle the case where user_id might be an array or object
  return (data || []).map((item: any) => ({
    ...item,
    user_id: Array.isArray(item.user_id) ? item.user_id[0] || { id: 0, name: null, surname: null } : item.user_id || { id: 0, name: null, surname: null }
  })) as TimesheetRecord[]
}

type TimesheetPopupProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  idAzienda: number | undefined
  onGeneraRiga: (descrizione: string, quantita: number, prezzoUnitario: number, timesheetIds: number[], idCommessa: number) => void
}

export function TimesheetPopup({
  open,
  onOpenChange,
  idAzienda,
  onGeneraRiga,
}: TimesheetPopupProps) {
  const [commessaId, setCommessaId] = React.useState<number | null>(null)
  const [commessaOpen, setCommessaOpen] = React.useState(false)
  const [selectedTimesheetIds, setSelectedTimesheetIds] = React.useState<Set<number>>(new Set())

  const { data: commesse = [], isLoading: isLoadingCommesse } = useQuery({
    queryKey: ['commesse-for-timesheet', idAzienda],
    queryFn: () => fetchCommesse(idAzienda!),
    enabled: !!idAzienda && open,
  })

  const { data: timesheet = [], isLoading: isLoadingTimesheet } = useQuery({
    queryKey: ['timesheet-for-commessa', commessaId],
    queryFn: () => fetchTimesheet(commessaId!),
    enabled: !!commessaId && open,
  })

  const selectedCommessa = commesse.find((c) => c.id === commessaId)

  const handleToggleTimesheet = (id: number) => {
    const newSet = new Set(selectedTimesheetIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedTimesheetIds(newSet)
  }

  const handleSelectAll = () => {
    if (selectedTimesheetIds.size === timesheet.length) {
      setSelectedTimesheetIds(new Set())
    } else {
      setSelectedTimesheetIds(new Set(timesheet.map((t) => t.id)))
    }
  }

  const handleGeneraRiga = () => {
    if (!commessaId || selectedTimesheetIds.size === 0 || !selectedCommessa) {
      return
    }

    const selectedTimesheet = timesheet.filter((t) => selectedTimesheetIds.has(t.id))
    const totaleOre = selectedTimesheet.reduce((sum, t) => sum + (t.ore_billable || t.ore_lavorate || 0), 0)

    onGeneraRiga(
      `Timesheet - ${selectedCommessa.title}`,
      totaleOre,
      selectedCommessa.tariffa_oraria || 0,
      Array.from(selectedTimesheetIds),
      commessaId
    )

    // Reset
    setCommessaId(null)
    setSelectedTimesheetIds(new Set())
    onOpenChange(false)
  }

  const getUserDisplayName = (user: TimesheetRecord['user_id']) => {
    const parts: string[] = []
    if (user.surname) parts.push(user.surname)
    if (user.name) parts.push(user.name)
    return parts.length > 0 ? parts.join(' ') : `User #${user.id}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='!w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle>Seleziona Timesheet</DialogTitle>
          <DialogDescription>
            Seleziona una commessa e i timesheet da utilizzare per generare la riga fattura
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium mb-2 block'>Commessa</label>
            <Popover open={commessaOpen} onOpenChange={setCommessaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={commessaOpen}
                  className='w-full justify-between'
                  disabled={!idAzienda || isLoadingCommesse}
                >
                  {selectedCommessa ? selectedCommessa.title : 'Seleziona commessa...'}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-full p-0' align='start'>
                <Command>
                  <CommandInput placeholder='Cerca commessa...' />
                  <CommandList>
                    <CommandEmpty>
                      {isLoadingCommesse ? 'Caricamento...' : 'Nessuna commessa trovata.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {commesse.map((commessa) => (
                        <CommandItem
                          key={commessa.id}
                          value={commessa.title}
                          onSelect={() => {
                            setCommessaId(commessa.id)
                            setCommessaOpen(false)
                            setSelectedTimesheetIds(new Set())
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              commessaId === commessa.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {commessa.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {commessaId && (
            <div>
              <div className='flex items-center justify-between mb-2'>
                <label className='text-sm font-medium'>Timesheet disponibili</label>
                {timesheet.length > 0 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleSelectAll}
                  >
                    {selectedTimesheetIds.size === timesheet.length ? 'Deseleziona tutto' : 'Seleziona tutto'}
                  </Button>
                )}
              </div>
              {isLoadingTimesheet ? (
                <div className='text-sm text-muted-foreground'>Caricamento timesheet...</div>
              ) : timesheet.length === 0 ? (
                <div className='text-sm text-muted-foreground'>Nessun timesheet disponibile per questa commessa</div>
              ) : (
                <div className='border rounded-md'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12'>
                          <Checkbox
                            checked={selectedTimesheetIds.size === timesheet.length && timesheet.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Giorno</TableHead>
                        <TableHead>Utente</TableHead>
                        <TableHead>Ore Billable</TableHead>
                        <TableHead>Dettaglio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheet.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTimesheetIds.has(t.id)}
                              onCheckedChange={() => handleToggleTimesheet(t.id)}
                            />
                          </TableCell>
                          <TableCell>{t.giorno || '-'}</TableCell>
                          <TableCell>{getUserDisplayName(t.user_id)}</TableCell>
                          <TableCell>{t.ore_billable ?? t.ore_lavorate}</TableCell>
                          <TableCell className='max-w-xs truncate'>{t.detail || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleGeneraRiga}
            disabled={!commessaId || selectedTimesheetIds.size === 0}
          >
            Genera Riga da Timesheet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

