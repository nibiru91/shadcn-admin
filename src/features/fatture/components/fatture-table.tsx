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
import { type Fattura } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { fattureColumns as columns } from './fatture-columns'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useFatture } from './fatture-provider'

type DataTableProps = {
  data: Fattura[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, ragione_sociale')
    .eq('is_active', true)
    .order('ragione_sociale', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export function FattureTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useFatture()
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Carica companies per il filtro cliente
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-fatture-filter'],
    queryFn: fetchCompanies,
  })

  // Synced with URL states
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
      { columnId: 'numero_search', searchKey: 'numero', type: 'string' },
      { columnId: 'data_emissione', searchKey: 'data_emissione', type: 'string' },
      { columnId: 'anno', searchKey: 'anno', type: 'array' },
      { columnId: 'id_cliente', searchKey: 'id_cliente', type: 'array' },
      { columnId: 'stato', searchKey: 'stato', type: 'array' },
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
  const annoColumn = table.getColumn('anno')
  const statoColumn = table.getColumn('stato')
  const clienteColumn = table.getColumn('id_cliente')

  const annoOptions = annoColumn
    ? Array.from(annoColumn.getFacetedUniqueValues().keys())
        .filter((value): value is number => value !== null && value !== undefined)
        .sort((a, b) => b - a)
        .map((value) => ({ label: String(value), value: String(value) }))
    : []

  const statoOptions = statoColumn
    ? Array.from(statoColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined)
        .map((value) => ({ label: value, value: value }))
        .sort((a, b) => a.label.localeCompare(b.label))
    : []

  const clienteOptions = clienteColumn
    ? Array.from(clienteColumn.getFacetedUniqueValues().keys())
        .filter((value) => value !== null && value !== undefined)
        .map((value) => {
          const clienteId = typeof value === 'object' && value !== null
            ? (value as any)?.id ?? value
            : value
          const cliente = companies.find((c) => c.id === clienteId)
          return {
            label: cliente ? cliente.ragione_sociale : `Cliente #${clienteId}`,
            value: String(clienteId),
          }
        })
        .filter((option, index, self) => 
          index === self.findIndex((o) => o.value === option.value)
        )
        .sort((a, b) => a.label.localeCompare(b.label))
    : companies.map((c) => ({
        label: c.ragione_sociale,
        value: String(c.id),
      }))

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filtra numero...'
        searchKey='numero_search'
        filters={[
          ...(annoOptions.length > 0
            ? [
                {
                  columnId: 'anno',
                  title: 'Anno',
                  options: annoOptions,
                },
              ]
            : []),
          ...(clienteOptions.length > 0
            ? [
                {
                  columnId: 'id_cliente',
                  title: 'Cliente',
                  options: clienteOptions,
                },
              ]
            : []),
          ...(statoOptions.length > 0
            ? [
                {
                  columnId: 'stato',
                  title: 'Stato',
                  options: statoOptions,
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
                  className='group/row'
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

