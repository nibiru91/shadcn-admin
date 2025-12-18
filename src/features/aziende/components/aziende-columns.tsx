import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Azienda } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const aziendeColumns: ColumnDef<Azienda>[] = [
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
		accessorKey: 'ragione_sociale',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Ragione Sociale' />
		),
		meta: { label: 'Ragione Sociale' },
		cell: ({ row }) => (
			<div className='font-medium'>{row.getValue('ragione_sociale')}</div>
		),
	},
	{
		id: 'tipologia',
		accessorFn: (row) => ({
			isCustomer: row.is_customer,
			isSupplier: row.is_supplier,
		}),
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Tipologia' />
		),
		meta: { label: 'Tipologia' },
		sortingFn: (rowA, rowB) => {
			const value = (row: typeof rowA) => {
				const parts: string[] = []
				if (row.original.is_customer) parts.push('cliente')
				if (row.original.is_supplier) parts.push('fornitore')
				return parts.join('-') || 'nessuno'
			}
			return value(rowA).localeCompare(value(rowB))
		},
		cell: ({ row }) => {
			const isCustomer = row.original.is_customer
			const isSupplier = row.original.is_supplier

			return (
				<div className='flex gap-2'>
					{isCustomer && <Badge variant='default'>Cliente</Badge>}
					{isSupplier && <Badge variant='secondary'>Fornitore</Badge>}
					{!isCustomer && !isSupplier && (
						<span className='text-muted-foreground text-xs'>-</span>
					)}
				</div>
			)
		},
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const isCustomer = row.original.is_customer
			const isSupplier = row.original.is_supplier
			return value.some(
				(v) => (v === 'cliente' && isCustomer) || (v === 'fornitore' && isSupplier)
			)
		},
	},
	{
		id: 'is_customer',
		accessorKey: 'is_customer',
		header: 'Cliente',
		enableSorting: true,
		enableHiding: false,
		meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
	},
	{
		id: 'is_supplier',
		accessorKey: 'is_supplier',
		header: 'Fornitore',
		enableSorting: true,
		enableHiding: false,
		meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
	},
	{
		id: 'piva_cf',
		accessorFn: (row) => {
			const piva = row.partita_iva || ''
			const cf = row.codice_fiscale || ''
			return `${piva} ${cf}`.trim()
		},
		header: 'P.IVA / Codice Fiscale',
		enableSorting: false,
		enableHiding: false,
		meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
		filterFn: (row, id, value) => {
			if (!value || typeof value !== 'string') return true
			const searchValue = value.toLowerCase().trim()
			if (!searchValue) return true
			const piva = (row.original.partita_iva || '').toLowerCase()
			const cf = (row.original.codice_fiscale || '').toLowerCase()
			return piva.includes(searchValue) || cf.includes(searchValue)
		},
	},
	{
		accessorKey: 'partita_iva',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='P.IVA' />
		),
		meta: { label: 'P.IVA' },
	},
	{
		accessorKey: 'codice_fiscale',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Codice Fiscale' />
		),
		meta: { label: 'Codice Fiscale' },
	},
	{
		accessorKey: 'description',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Note' />
		),
		meta: { label: 'Note' },
		cell: ({ row }) => {
			const value = row.getValue<string | null>('description')
			if (!value) return <span className='text-muted-foreground text-xs'>-</span>
			return <span className='line-clamp-2'>{value}</span>
		},
	},
	{
		accessorKey: 'city',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Città' />
		),
		meta: { label: 'Città' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const cityValue = row.getValue<string | null>(id) || ''
			return value.includes(cityValue)
		},
	},
	{
		accessorKey: 'province',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Prov' />
		),
		meta: { label: 'Prov' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const provinceValue = row.getValue<string | null>(id) || ''
			return value.includes(provinceValue)
		},
	},
	{
		accessorKey: 'country',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Paese' />
		),
		meta: { label: 'Paese' },
		filterFn: (row, id, value) => {
			if (!Array.isArray(value) || value.length === 0) return true
			const countryValue = row.getValue<string | null>(id) || ''
			return value.includes(countryValue)
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
		enableSorting: false,
	},
]
