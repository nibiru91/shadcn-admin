import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const usersColumns: ColumnDef<User>[] = [
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
    meta: {
      className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
    },
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
    id: 'fullName',
    accessorFn: (row) => {
      const parts: string[] = []
      if (row.surname) parts.push(row.surname)
      if (row.name) parts.push(row.name)
      return parts.length > 0 ? parts.join(' ') : ''
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nome' />
    ),
    cell: ({ row }) => {
      const { name, surname } = row.original
      const parts: string[] = []
      if (surname) parts.push(surname)
      if (name) parts.push(name)
      const fullName = parts.length > 0 ? parts.join(' ') : '-'
      return <span>{fullName}</span>
    },
    meta: { label: 'Nome' },
    filterFn: (row, _id, value) => {
      if (!value || typeof value !== 'string') return true
      const searchValue = value.toLowerCase().trim()
      if (!searchValue) return true
      const name = (row.original.name || '').toLowerCase()
      const surname = (row.original.surname || '').toLowerCase()
      return name.includes(searchValue) || surname.includes(searchValue)
    },
  },
  {
    accessorKey: 'ruolo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Ruolo' />
    ),
    meta: { label: 'Ruolo' },
    cell: ({ row }) => {
      const ruolo = row.getValue<string | null>('ruolo')
      if (!ruolo) return <span className='text-muted-foreground text-xs'>-</span>
      return (
        <Badge variant='outline' className='capitalize'>
          {ruolo}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const ruolo = row.getValue<string | null>(id)
      if (!ruolo) return false
      return value.includes(ruolo)
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Creato il' />
    ),
    meta: { label: 'Creato il' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('created_at')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      try {
        const date = new Date(value)
        return <span>{date.toLocaleDateString('it-IT')}</span>
      } catch {
        return <span className='text-muted-foreground text-xs'>-</span>
      }
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
    enableSorting: false,
  },
]
