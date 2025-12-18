import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { getRouteApi } from '@tanstack/react-router'
import { Trash2, Pencil, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Commessa } from '../data/schema'
import { useCommesse } from './commesse-provider'

type DataTableRowActionsProps = {
  row: Row<Commessa>
}

const route = getRouteApi('/_authenticated/commesse/')

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useCommesse()
  const navigate = route.useNavigate()
  
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              if (row.original.id) {
                navigate({
                  to: '/commesse/riepilogo',
                  search: { commessaId: String(row.original.id) },
                })
              }
            }}
          >
            Riepilogo
            <DropdownMenuShortcut>
              <FileText size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation() // Previeni la propagazione del click alla TableRow
              e.preventDefault() // Previeni anche il comportamento di default
              // Usa setTimeout per assicurarsi che il DropdownMenu si chiuda prima di aprire il Dialog
              setTimeout(() => {
                setCurrentRow(row.original)
                setOpen('edit')
              }, 0)
            }}
          >
            Modifica
            <DropdownMenuShortcut>
              <Pencil size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation() // Previeni la propagazione del click alla TableRow
              e.preventDefault() // Previeni anche il comportamento di default
              // Usa setTimeout per assicurarsi che il DropdownMenu si chiuda prima di aprire il Dialog
              setTimeout(() => {
                setCurrentRow(row.original)
                setOpen('delete')
              }, 0)
            }}
            className='text-red-500!'
          >
            Elimina
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
