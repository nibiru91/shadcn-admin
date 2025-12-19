import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Timesheet } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'

export const timesheetColumns: ColumnDef<Timesheet>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'detail_search',
    accessorFn: (row) => row.detail || '',
    header: 'Detail',
    enableSorting: false,
    enableHiding: false,
    meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
    filterFn: (row, _id, value) => {
      if (!value || typeof value !== 'string') return true
      const searchValue = value.toLowerCase().trim()
      if (!searchValue) return true
      const detail = (row.original.detail || '').toLowerCase()
      return detail.includes(searchValue)
    },
  },
  {
    accessorKey: 'user_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Utente' />
    ),
    meta: { label: 'Utente' },
    cell: ({ row }) => {
      const user = (row.original as any).user_id
      if (!user) {
        const userId = row.original.user_id
        return userId ? <span className='text-muted-foreground text-xs'>User #{userId}</span> : <span className='text-muted-foreground text-xs'>-</span>
      }
      const parts: string[] = []
      if (user.surname) parts.push(user.surname)
      if (user.name) parts.push(user.name)
      const displayName = parts.length > 0 ? parts.join(' ') : `User #${user.id || row.original.user_id}`
      return <span>{displayName}</span>
    },
    filterFn: (row, _id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      // Estrai l'ID se user_id è un oggetto dal join, altrimenti usa direttamente il valore
      const userId = typeof row.original.user_id === 'object' && row.original.user_id !== null
        ? (row.original.user_id as any)?.id ?? row.original.user_id
        : row.original.user_id
      // Converti le stringhe in numeri per il confronto
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(userId)
    },
  },
  {
    accessorKey: 'commessa',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Commessa' />
    ),
    meta: { label: 'Commessa' },
    cell: ({ row }) => {
      const commessa = (row.original as any).commessa
      if (!commessa) return <span className='text-muted-foreground text-xs'>-</span>
      return <span>{commessa.title || `Commessa #${row.original.commessa}`}</span>
    },
    filterFn: (row, _id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      // Estrai l'ID se commessa è un oggetto dal join, altrimenti usa direttamente il valore
      const commessaId = typeof row.original.commessa === 'object' && row.original.commessa !== null
        ? (row.original.commessa as any)?.id ?? row.original.commessa
        : row.original.commessa
      // Converti le stringhe in numeri per il confronto
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(commessaId)
    },
  },
  {
    accessorKey: 'ore_lavorate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Lavorate' />
    ),
    meta: { label: 'Lavorate' },
    cell: ({ row }) => {
      const value = row.getValue<number>('ore_lavorate')
      return value !== null && value !== undefined ? value.toFixed(2) : '-'
    },
  },
  {
    accessorKey: 'ore_billable',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Billable' />
    ),
    meta: { label: 'Billable' },
    cell: ({ row }) => {
      const value = row.getValue<number | null>('ore_billable')
      return value !== null && value !== undefined ? value.toFixed(2) : '-'
    },
  },
  {
    accessorKey: 'detail',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Dettaglio' />
    ),
    meta: { label: 'Dettaglio' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('detail')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      return <span className='line-clamp-2'>{value}</span>
    },
  },
  {
    accessorKey: 'giorno',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Giorno' />
    ),
    meta: { label: 'Giorno' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('giorno')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      try {
        return format(new Date(value), 'dd/MM/yyyy')
      } catch {
        return value
      }
    },
  },
  {
    accessorKey: 'week',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Settimana' />
    ),
    meta: { label: 'Settimana' },
    cell: ({ row }) => {
      const value = row.getValue<number>('week')
      return value !== null && value !== undefined ? String(value) : '-'
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const weekValue = row.getValue<number>(id)
      // Converti le stringhe in numeri per il confronto
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(weekValue)
    },
  },
  {
    accessorKey: 'mese',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Mese' />
    ),
    meta: { label: 'Mese' },
    cell: ({ row }) => {
      const value = row.getValue<number>('mese')
      return value !== null && value !== undefined ? String(value) : '-'
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const meseValue = row.getValue<number>(id)
      // Converti le stringhe in numeri per il confronto
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(meseValue)
    },
  },
  {
    accessorKey: 'anno',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Anno' />
    ),
    meta: { label: 'Anno' },
    cell: ({ row }) => {
      const value = row.getValue<number>('anno')
      return value !== null && value !== undefined ? String(value) : '-'
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const annoValue = row.getValue<number>(id)
      // Converti le stringhe in numeri per il confronto
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(annoValue)
    },
  },
  {
    accessorKey: 'is_billed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fattura' />
    ),
    meta: { label: 'Fattura' },
    cell: ({ row }) => {
      const value = row.getValue<boolean>('is_billed')
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Sì' : 'No'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'tariffa_billed',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tariffa' />
    ),
    meta: { label: 'Tariffa' },
    cell: ({ row }) => {
      const value = row.getValue<number | null>('tariffa_billed')
      return value !== null && value !== undefined ? `€ ${value.toFixed(2)}` : '-'
    },
  },
  {
    accessorKey: 'fattura',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ft Nr.' />
    ),
    meta: { label: 'Ft Nr.' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('fattura')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      return <span>{value}</span>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
  },
]

