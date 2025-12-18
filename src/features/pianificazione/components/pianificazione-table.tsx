import { useEffect, useState, useMemo } from 'react'
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
import { type Planning } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { pianificazioneColumns as columns } from './pianificazione-columns'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePianificazione } from './pianificazione-provider'
import { PianificazioneCardUserDetail } from './pianificazione-card-user-detail'
import { type Filters } from './pianificazione-card-utils'

type DataTableProps = {
  data: Planning[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

async function fetchUsers() {
  const { data, error } = await supabase
    .from('users_profile')
    .select('id, name, surname')
    .order('surname', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return data || []
}

async function fetchCommesse() {
  const { data, error } = await supabase
    .from('commesse')
    .select('id, title')
    .eq('is_valid', true)
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export function PianificazioneTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = usePianificazione()
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Carica utenti e commesse per i filtri
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-planning-filter'],
    queryFn: fetchUsers,
  })

  const { data: commesse = [] } = useQuery({
    queryKey: ['commesse-for-planning-filter'],
    queryFn: fetchCommesse,
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
      { columnId: 'detail_search', searchKey: 'detail', type: 'string' },
      { 
        columnId: 'user_id', 
        searchKey: 'user_id', 
        type: 'array',
        serialize: (val) => Array.isArray(val) ? val.map(String) : val,
        deserialize: (val) => Array.isArray(val) ? val.map(String) : val
      },
      { 
        columnId: 'commessa', 
        searchKey: 'commessa', 
        type: 'array',
        serialize: (val) => Array.isArray(val) ? val.map(String) : val,
        deserialize: (val) => Array.isArray(val) ? val.map(String) : val
      },
      { 
        columnId: 'week', 
        searchKey: 'week', 
        type: 'array',
        serialize: (val) => Array.isArray(val) ? val.map(String) : val,
        deserialize: (val) => Array.isArray(val) ? val.map(String) : val
      },
      { 
        columnId: 'anno', 
        searchKey: 'anno', 
        type: 'array',
        serialize: (val) => Array.isArray(val) ? val.map(String) : val,
        deserialize: (val) => Array.isArray(val) ? val.map(String) : val
      },
      { 
        columnId: 'mese', 
        searchKey: 'mese', 
        type: 'array',
        serialize: (val) => Array.isArray(val) ? val.map(String) : val,
        deserialize: (val) => Array.isArray(val) ? val.map(String) : val
      },
      { 
        columnId: 'is_delayable', 
        searchKey: 'is_delayable', 
        type: 'array',
        serialize: (value) => {
          if (Array.isArray(value)) {
            return value.map((v) => (v === true || v === 'true') ? 'true' : 'false')
          }
          return value
        },
        deserialize: (value) => {
          if (Array.isArray(value)) {
            return value.map((v) => (v === 'true' || v === true) ? 'true' : 'false')
          }
          return value
        },
      },
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
  const userColumn = table.getColumn('user_id')
  const commessaColumn = table.getColumn('commessa')
  const weekColumn = table.getColumn('week')
  const annoColumn = table.getColumn('anno')
  const meseColumn = table.getColumn('mese')
  const delayableColumn = table.getColumn('is_delayable')

  function getUserDisplayName(user: any): string {
    if (!user) return ''
    const parts: string[] = []
    if (user.surname) parts.push(user.surname)
    if (user.name) parts.push(user.name)
    return parts.length > 0 ? parts.join(' ') : `User #${user.id || ''}`
  }

  const userOptions = userColumn
    ? Array.from(userColumn.getFacetedUniqueValues().keys())
        .filter((value) => value !== null && value !== undefined)
        .map((value) => {
          // Estrai l'ID se è un oggetto dal join, altrimenti usa direttamente il valore
          const userId = typeof value === 'object' && value !== null
            ? (value as any)?.id ?? value
            : value
          const user = users.find((u) => u.id === userId)
          return {
            label: user ? getUserDisplayName(user) : `User #${userId}`,
            value: String(userId),
          }
        })
        // Rimuovi duplicati basandosi sul value (ID utente)
        .filter((option, index, self) => 
          index === self.findIndex((o) => o.value === option.value)
        )
        .sort((a, b) => a.label.localeCompare(b.label))
    : users.map((u) => ({
        label: getUserDisplayName(u),
        value: String(u.id),
      }))

  const commessaOptions = commessaColumn
    ? Array.from(commessaColumn.getFacetedUniqueValues().keys())
        .filter((value) => value !== null && value !== undefined)
        .map((value) => {
          // Estrai l'ID se è un oggetto, altrimenti usa direttamente il valore
          const commessaId = typeof value === 'object' && value !== null
            ? (value as any)?.id ?? value
            : value
          const commessa = commesse.find((c) => c.id === commessaId)
          return {
            label: commessa ? commessa.title : `Commessa #${commessaId}`,
            value: String(commessaId),
          }
        })
        // Rimuovi duplicati basandosi sul value (ID commessa)
        .filter((option, index, self) => 
          index === self.findIndex((o) => o.value === option.value)
        )
        .sort((a, b) => a.label.localeCompare(b.label))
    : commesse.map((c) => ({
        label: c.title,
        value: String(c.id),
      }))

  const weekOptions = weekColumn
    ? Array.from(weekColumn.getFacetedUniqueValues().keys())
        .filter((value): value is number => value !== null && value !== undefined)
        .sort((a, b) => b - a)
        .map((value) => ({ label: String(value), value: String(value) }))
    : []

  const annoOptions = annoColumn
    ? Array.from(annoColumn.getFacetedUniqueValues().keys())
        .filter((value): value is number => value !== null && value !== undefined)
        .sort((a, b) => b - a)
        .map((value) => ({ label: String(value), value: String(value) }))
    : []

  const meseOptions = meseColumn
    ? Array.from(meseColumn.getFacetedUniqueValues().keys())
        .filter((value): value is number => value !== null && value !== undefined)
        .sort((a, b) => a - b)
        .map((value) => ({ label: String(value), value: String(value) }))
    : []

  const delayableOptions = [
    { label: 'Sì', value: 'true' },
    { label: 'No', value: 'false' },
  ]

  // Mappa i columnFilters al formato Filters per il componente card
  const cardFilters: Filters = useMemo(() => {
    const filters: Filters = {}

    // user_id
    const userIdFilter = columnFilters.find((f) => f.id === 'user_id')
    if (userIdFilter && userIdFilter.value) {
      const values = Array.isArray(userIdFilter.value)
        ? userIdFilter.value
        : [userIdFilter.value]
      filters.user_id = values
        .map((v) => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') return parseInt(v, 10)
          return null
        })
        .filter((v): v is number => v !== null)
    }

    // week
    const weekFilter = columnFilters.find((f) => f.id === 'week')
    if (weekFilter && weekFilter.value) {
      const values = Array.isArray(weekFilter.value)
        ? weekFilter.value
        : [weekFilter.value]
      filters.week = values
        .map((v) => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') return parseInt(v, 10)
          return null
        })
        .filter((v): v is number => v !== null)
    }

    // mese
    const meseFilter = columnFilters.find((f) => f.id === 'mese')
    if (meseFilter && meseFilter.value) {
      const values = Array.isArray(meseFilter.value)
        ? meseFilter.value
        : [meseFilter.value]
      filters.mese = values
        .map((v) => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') return parseInt(v, 10)
          return null
        })
        .filter((v): v is number => v !== null)
    }

    // anno
    const annoFilter = columnFilters.find((f) => f.id === 'anno')
    if (annoFilter && annoFilter.value) {
      const values = Array.isArray(annoFilter.value)
        ? annoFilter.value
        : [annoFilter.value]
      filters.anno = values
        .map((v) => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') return parseInt(v, 10)
          return null
        })
        .filter((v): v is number => v !== null)
    }

    // commessa
    const commessaFilter = columnFilters.find((f) => f.id === 'commessa')
    if (commessaFilter && commessaFilter.value) {
      const values = Array.isArray(commessaFilter.value)
        ? commessaFilter.value
        : [commessaFilter.value]
      filters.commessa = values
        .map((v) => {
          if (typeof v === 'number') return v
          if (typeof v === 'string') return parseInt(v, 10)
          return null
        })
        .filter((v): v is number => v !== null)
    }

    // is_delayable
    const delayableFilter = columnFilters.find((f) => f.id === 'is_delayable')
    if (delayableFilter && delayableFilter.value) {
      const values = Array.isArray(delayableFilter.value)
        ? delayableFilter.value
        : [delayableFilter.value]
      filters.is_delayable = values
        .map((v) => {
          if (typeof v === 'boolean') return v
          if (v === 'true' || v === true) return true
          if (v === 'false' || v === false) return false
          return null
        })
        .filter((v): v is boolean => v !== null)
    }

    return filters
  }, [columnFilters])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filtra dettaglio...'
        searchKey='detail_search'
        filters={[
          ...(userOptions.length > 0
            ? [
                {
                  columnId: 'user_id',
                  title: 'Utente',
                  options: userOptions,
                },
              ]
            : []),
          ...(commessaOptions.length > 0
            ? [
                {
                  columnId: 'commessa',
                  title: 'Commessa',
                  options: commessaOptions,
                },
              ]
            : []),
          ...(weekOptions.length > 0
            ? [
                {
                  columnId: 'week',
                  title: 'Settimana',
                  options: weekOptions,
                },
              ]
            : []),
          ...(annoOptions.length > 0
            ? [
                {
                  columnId: 'anno',
                  title: 'Anno',
                  options: annoOptions,
                },
              ]
            : []),
          ...(meseOptions.length > 0
            ? [
                {
                  columnId: 'mese',
                  title: 'Mese',
                  options: meseOptions,
                },
              ]
            : []),
          {
            columnId: 'is_delayable',
            title: 'Rinviabile',
            options: delayableOptions,
          },
        ]}
      />
      <PianificazioneCardUserDetail
        filters={cardFilters}
        planningData={data}
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
                    const target = event.target as HTMLElement
                    if (
                      target.closest('button') ||
                      target.closest('input[type="checkbox"]') ||
                      target.closest('[role="menu"]') ||
                      target.closest('[data-radix-dropdown-menu-content]')
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

