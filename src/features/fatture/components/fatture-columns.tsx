import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Fattura } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'

const getStatoBadgeVariant = (stato: string) => {
  switch (stato?.toLowerCase()) {
    case 'bozza':
      return 'secondary'
    case 'emessa':
      return 'default'
    case 'pagata':
      return 'outline'
    case 'pagata parzialmente':
      return 'outline'
    case 'annullata':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getStatoBadgeClassName = (stato: string) => {
  const statoLower = stato?.toLowerCase()
  if (statoLower === 'pagata parzialmente') {
    return 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-600'
  }
  if (statoLower === 'pagata') {
    return 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 dark:border-green-600'
  }
  return ''
}

export const fattureColumns: ColumnDef<Fattura>[] = [
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
    id: 'numero_search',
    accessorFn: (row) => row.numero || '',
    header: 'Numero',
    enableSorting: false,
    enableHiding: false,
    meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
    filterFn: (row, _id, value) => {
      if (!value || typeof value !== 'string') return true
      const searchValue = value.toLowerCase().trim()
      if (!searchValue) return true
      const numero = (row.original.numero || '').toLowerCase()
      return numero.includes(searchValue)
    },
  },
  {
    accessorKey: 'data_emissione',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Data Emissione' />
    ),
    meta: { label: 'Data Emissione' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('data_emissione')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      try {
        return format(new Date(value), 'dd/MM/yyyy')
      } catch {
        return value
      }
    },
  },
  {
    accessorKey: 'numero',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Numero' />
    ),
    meta: { label: 'Numero' },
    cell: ({ row }) => {
      const value = row.getValue<string>('numero')
      return <span>{value || '-'}</span>
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
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(annoValue)
    },
  },
  {
    accessorKey: 'id_cliente',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cliente' />
    ),
    meta: { label: 'Cliente' },
    cell: ({ row }) => {
      const cliente = (row.original as any).id_cliente
      if (!cliente || typeof cliente !== 'object') {
        const clienteId = row.original.id_cliente
        return clienteId ? <span className='text-muted-foreground text-xs'>Cliente #{clienteId}</span> : <span className='text-muted-foreground text-xs'>-</span>
      }
      const clienteName = (cliente as any).ragione_sociale || `Cliente #${(cliente as any).id || row.original.id_cliente}`
      return <span>{clienteName}</span>
    },
    filterFn: (row, _id, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      const clienteId = typeof row.original.id_cliente === 'object' && row.original.id_cliente !== null
        ? (row.original.id_cliente as any)?.id ?? row.original.id_cliente
        : row.original.id_cliente
      const numericValues = value.map((v) => typeof v === 'string' ? parseInt(v, 10) : v)
      return numericValues.includes(clienteId)
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
      return (
        <Badge variant={getStatoBadgeVariant(value)} className={getStatoBadgeClassName(value)}>
          {value || 'bozza'}
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
    accessorKey: 'totale_imponibile',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Totale Imponibile' />
    ),
    meta: { label: 'Totale Imponibile' },
    cell: ({ row }) => {
      const value = row.getValue<number>('totale_imponibile')
      return value !== null && value !== undefined ? `€ ${value.toFixed(2)}` : '-'
    },
  },
  {
    accessorKey: 'totale_iva',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Totale IVA' />
    ),
    meta: { label: 'Totale IVA' },
    cell: ({ row }) => {
      const value = row.getValue<number>('totale_iva')
      return value !== null && value !== undefined ? `€ ${value.toFixed(2)}` : '-'
    },
  },
  {
    accessorKey: 'totale_documento',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Totale Documento' />
    ),
    meta: { label: 'Totale Documento' },
    cell: ({ row }) => {
      const value = row.getValue<number>('totale_documento')
      return value !== null && value !== undefined ? `€ ${value.toFixed(2)}` : '-'
    },
  },
  {
    accessorKey: 'metodo_pagamento',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Metodo Pagamento' />
    ),
    meta: { label: 'Metodo Pagamento' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('metodo_pagamento')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      return <span>{value}</span>
    },
  },
  {
    accessorKey: 'banca_appoggio',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Banca Appoggio' />
    ),
    meta: { label: 'Banca Appoggio' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('banca_appoggio')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      return <span>{value}</span>
    },
  },
  {
    accessorKey: 'note',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Note' />
    ),
    meta: { label: 'Note' },
    cell: ({ row }) => {
      const value = row.getValue<string | null>('note')
      if (!value) return <span className='text-muted-foreground text-xs'>-</span>
      return <span className='line-clamp-2'>{value}</span>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
  },
]

