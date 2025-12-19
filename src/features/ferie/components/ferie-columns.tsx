import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Ferie } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'

export const ferieColumns: ColumnDef<Ferie>[] = [
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
    accessorKey: 'data_riferimento',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data' />
    ),
    meta: { label: 'Data' },
    cell: ({ row }) => {
      const value = row.getValue<string>('data_riferimento')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      try {
        return format(new Date(value), 'dd/MM/yyyy')
      } catch {
        return value
      }
    },
  },
  {
    accessorKey: 'ore',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ore' />
    ),
    meta: { label: 'Ore' },
    cell: ({ row }) => {
      const value = row.getValue<number>('ore')
      return value !== null && value !== undefined ? value.toFixed(2) : '-'
    },
  },
  {
    accessorKey: 'tipologia',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tipologia' />
    ),
    meta: { label: 'Tipologia' },
    cell: ({ row }) => {
      const value = row.getValue<string>('tipologia')
      const variant = value === 'ferie' ? 'default' : value === 'permesso' ? 'secondary' : 'destructive'
      const label = value === 'ferie' ? 'Ferie' : value === 'permesso' ? 'Permesso' : 'Malattia'
      return (
        <Badge variant={variant}>
          {label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const tipologiaValue = row.getValue<string>(id)
      return value.includes(tipologiaValue)
    },
  },
  {
    accessorKey: 'stato',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stato' />
    ),
    meta: { label: 'Stato' },
    cell: ({ row }) => {
      const value = row.getValue<string>('stato')
      const variant = value === 'approved' ? 'default' : value === 'pending' ? 'secondary' : 'destructive'
      const label = value === 'approved' ? 'Approvato' : value === 'pending' ? 'In attesa' : 'Rifiutato'
      return (
        <Badge variant={variant}>
          {label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const statoValue = row.getValue<string>(id)
      return value.includes(statoValue)
    },
  },
  {
    accessorKey: 'mese',
    header: 'Mese',
    enableSorting: false,
    enableHiding: true,
    meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const meseValue = row.getValue<number>(id)
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(meseValue)
    },
  },
  {
    accessorKey: 'anno',
    header: 'Anno',
    enableSorting: false,
    enableHiding: true,
    meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const annoValue = row.getValue<number>(id)
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(annoValue)
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
  },
]

