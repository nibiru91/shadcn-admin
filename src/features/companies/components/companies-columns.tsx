import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Company } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const companiesColumns: ColumnDef<Company>[] = [
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
		header: 'Tipologia',
		meta: { label: 'Tipologia' },
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
		enableSorting: false,
		enableHiding: false,
		meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
	},
	{
		id: 'is_supplier',
		accessorKey: 'is_supplier',
		header: 'Fornitore',
		enableSorting: false,
		enableHiding: false,
		meta: { thClassName: 'hidden', tdClassName: 'hidden', hideInViewOptions: true },
	},
	{
		accessorKey: 'partita_iva',
		header: 'P.IVA',
	},
	{
		accessorKey: 'codice_fiscale',
		header: 'Codice Fiscale',
	},
	{
		accessorKey: 'city',
		header: 'Città',
	},
	{
		accessorKey: 'province',
		header: 'Prov',
	},
	{
		accessorKey: 'country',
		header: 'Paese',
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
]
