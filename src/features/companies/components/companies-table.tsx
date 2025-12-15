import { useEffect, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { type Company } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { companiesColumns as columns } from './companies-columns'
import { useCompanies } from './companies-provider'

type DataTableProps = {
  data: Company[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function CompaniesTable({ data, search, navigate }: DataTableProps) {
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    is_customer: false,
    is_supplier: false,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const { setOpen, setCurrentRow } = useCompanies()

  // Local state management for table (uncomment to use local-only state, not synced with URL)
  // const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([])
  // const [pagination, onPaginationChange] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // Synced with URL states (keys/defaults mirror users route search schema)
  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
      columnFilters: [
        { columnId: 'ragione_sociale', searchKey: 'ragione_sociale', type: 'string' },
        { columnId: 'piva_cf', searchKey: 'piva_cf', type: 'string' },
        { columnId: 'is_customer', searchKey: 'is_customer', type: 'boolean' },
        { columnId: 'is_supplier', searchKey: 'is_supplier', type: 'boolean' },
        { columnId: 'tipologia', searchKey: 'tipologia', type: 'array' },
        { columnId: 'city', searchKey: 'city', type: 'array' },
        { columnId: 'province', searchKey: 'province', type: 'array' },
        { columnId: 'country', searchKey: 'country', type: 'array' },
      ],
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  // Calcola le opzioni dinamiche dai valori unici nel DB
  const cityColumn = table.getColumn('city')
  const provinceColumn = table.getColumn('province')
  const countryColumn = table.getColumn('country')

  const cityOptions = cityColumn
    ? Array.from(cityColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : []

  const provinceOptions = provinceColumn
    ? Array.from(provinceColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : []

  const countryOptions = countryColumn
    ? Array.from(countryColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : []

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom to the table on mobile when the toolbar is visible
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filtra ragione sociale...'
        searchKey='ragione_sociale'
        textFilters={[
          { columnId: 'piva_cf', placeholder: 'Filtra P.IVA / Codice Fiscale...' },
        ]}
        filters={[
          {
            columnId: 'tipologia',
            title: 'Tipologia',
            options: [
              { label: 'Cliente', value: 'cliente' },
              { label: 'Fornitore', value: 'fornitore' },
            ],
          },
          ...(cityOptions.length > 0
            ? [
                {
                  columnId: 'city',
                  title: 'Città',
                  options: cityOptions,
                },
              ]
            : []),
          ...(provinceOptions.length > 0
            ? [
                {
                  columnId: 'province',
                  title: 'Provincia',
                  options: provinceOptions,
                },
              ]
            : []),
          ...(countryOptions.length > 0
            ? [
                {
                  columnId: 'country',
                  title: 'Paese',
                  options: countryOptions,
                },
              ]
            : []),
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className,
                        header.column.columnDef.meta?.thClassName
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row cursor-pointer'
                  onClick={(e) => {
                    // Non aprire il dialog se si clicca su checkbox o azioni
                    const target = e.target as HTMLElement
                    if (
                      target.closest('button') ||
                      target.closest('[role="checkbox"]') ||
                      target.closest('[data-radix-popper-content-wrapper]')
                    ) {
                      return
                    }
                    setCurrentRow(row.original)
                    setOpen('edit')
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Nessun risultato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
      <DataTableBulkActions table={table} />
    </div>
  )
}
