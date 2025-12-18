import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Commessa } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const commesseColumns: ColumnDef<Commessa>[] = [
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
		id: 'title_desc',
		accessorFn: (row) => {
			const title = row.title || ''
			const desc = row.description || ''
			return `${title} ${desc}`.trim()
		},
		header: 'Titolo / Descrizione',
		enableSorting: false,
		enableHiding: false,
		meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
		filterFn: (row, id, value) => {
			if (!value || typeof value !== 'string') return true
			const searchValue = value.toLowerCase().trim()
			if (!searchValue) return true
			const title = (row.original.title || '').toLowerCase()
			const desc = (row.original.description || '').toLowerCase()
			return title.includes(searchValue) || desc.includes(searchValue)
		},
	},
	{
		accessorKey: 'cliente_diretto',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Cliente' />
		),
		meta: { label: 'Cliente' },
		cell: ({ row }) => {
			const cliente = (row.original as any).cliente_diretto
			if (!cliente) return <span className='text-muted-foreground text-xs'>-</span>
			return <span>{cliente.ragione_sociale}</span>
		},
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const clienteId = row.getValue<number | null>(id)
			if (!clienteId) return false
			return value.includes(String(clienteId))
		},
	},
	{
		accessorKey: 'title',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Titolo' />
		),
		meta: { label: 'Titolo' },
		cell: ({ row }) => (
			<div className='font-medium'>{row.getValue('title')}</div>
		),
	},
	{
		accessorKey: 'description',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Descrizione' />
		),
		meta: { label: 'Descrizione' },
		cell: ({ row }) => {
			const value = row.getValue<string | null>('description')
			if (!value) return <span className='text-muted-foreground text-xs'>-</span>
			return <span className='line-clamp-2'>{value}</span>
		},
	},
	{
		accessorKey: 'tipologia',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Tipologia' />
		),
		meta: { label: 'Tipologia' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const tipologiaValue = row.getValue<string | null>(id) || ''
			return value.includes(tipologiaValue)
		},
	},
	{
		accessorKey: 'stato',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Stato' />
		),
		meta: { label: 'Stato' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const statoValue = row.getValue<string | null>(id) || ''
			return value.includes(statoValue)
		},
	},
	{
		accessorKey: 'area',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Area' />
		),
		meta: { label: 'Area' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const areaValue = row.getValue<string | null>(id) || ''
			return value.includes(areaValue)
		},
	},
	{
		accessorKey: 'categoria',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Categoria' />
		),
		meta: { label: 'Categoria' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const categoriaValue = row.getValue<string | null>(id) || ''
			return value.includes(categoriaValue)
		},
	},
	{
		accessorKey: 'ore_previste',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Ore Previste' />
		),
		meta: { label: 'Ore Previste' },
		cell: ({ row }) => {
			const value = row.getValue<number | null>('ore_previste')
			return value !== null && value !== undefined ? value.toFixed(1) : '-'
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
		enableSorting: false,
	},
]

