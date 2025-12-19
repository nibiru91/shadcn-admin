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
import { useNavigate } from '@tanstack/react-router'
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
import { type Commessa } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { commesseColumns as columns } from './commesse-columns'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useEnums } from '@/context/enums-provider'

type DataTableProps = {
  data: Commessa[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

async function fetchAziende() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, ragione_sociale')
    .eq('is_active', true)
    .order('ragione_sociale', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export function CommesseTable({ data, search, navigate }: DataTableProps) {
  const routerNavigate = useNavigate()
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    ore_previste: false,
    categoria: false,
    tipologia: false,
  })
  const [sorting, setSorting] = useState<SortingState>([])

  // Carica aziende per il filtro cliente_diretto
  const { data: aziende = [] } = useQuery({
    queryKey: ['companies-for-filter'],
    queryFn: fetchAziende,
  })

  const { tipologia: tipologiaValues, stato: statoValues, area: areaValues, categoria: categoriaValues } = useEnums()

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
      { columnId: 'title_desc', searchKey: 'title_desc', type: 'string' },
      { columnId: 'cliente_diretto', searchKey: 'cliente_diretto', type: 'array' },
      { columnId: 'tipologia', searchKey: 'tipologia', type: 'array' },
      { columnId: 'stato', searchKey: 'stato', type: 'array' },
      { columnId: 'area', searchKey: 'area', type: 'array' },
      { columnId: 'categoria', searchKey: 'categoria', type: 'array' },
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
  const tipologiaColumn = table.getColumn('tipologia')
  const statoColumn = table.getColumn('stato')
  const areaColumn = table.getColumn('area')
  const categoriaColumn = table.getColumn('categoria')

  const clienteOptions = aziende
    .map((c) => ({ label: c.ragione_sociale, value: String(c.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const tipologiaOptions = tipologiaColumn
    ? Array.from(tipologiaColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : tipologiaValues.map((v: string) => ({ label: v, value: v }))

  const statoOptions = statoColumn
    ? Array.from(statoColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : statoValues.map((v: string) => ({ label: v, value: v }))

  const areaOptions = areaColumn
    ? Array.from(areaColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : areaValues.map((v: string) => ({ label: v, value: v }))

  const categoriaOptions = categoriaColumn
    ? Array.from(categoriaColumn.getFacetedUniqueValues().keys())
        .filter((value): value is string => value !== null && value !== undefined && value !== '')
        .sort()
        .map((value) => ({ label: value, value }))
    : categoriaValues.map((v: string) => ({ label: v, value: v }))

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filtra titolo / descrizione...'
        searchKey='title_desc'
        filters={[
          ...(clienteOptions.length > 0
            ? [
                {
                  columnId: 'cliente_diretto',
                  title: 'Cliente',
                  options: clienteOptions,
                },
              ]
            : []),
          ...(tipologiaOptions.length > 0
            ? [
                {
                  columnId: 'tipologia',
                  title: 'Tipologia',
                  options: tipologiaOptions,
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
          ...(areaOptions.length > 0
            ? [
                {
                  columnId: 'area',
                  title: 'Area',
                  options: areaOptions,
                },
              ]
            : []),
          ...(categoriaOptions.length > 0
            ? [
                {
                  columnId: 'categoria',
                  title: 'Categoria',
                  options: categoriaOptions,
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
                  onClick={(event) => {
                    // Prevent opening dialog when clicking on checkbox, action buttons, or dropdown menu
                    const target = event.target as HTMLElement
                    if (
                      target.closest('button') ||
                      target.closest('input[type="checkbox"]') ||
                      target.closest('[role="menu"]') ||
                      target.closest('[data-radix-dropdown-menu-content]')
                    ) {
                      return
                    }
                    if (row.original.id) {
                      routerNavigate({
                        to: '/commesse/riepilogo',
                        search: { commessaId: String(row.original.id) },
                      })
                    }
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

