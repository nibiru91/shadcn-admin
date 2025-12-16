import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Ferie } from '../data/schema'
import { useFerie } from './ferie-provider'
import { useUser } from '@/context/user-provider'

type DataTableRowActionsProps = {
  row: Row<Ferie>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useFerie()
  const { isSuperadmin } = useUser()
  const stato = row.original.stato
  const isPending = stato === 'pending'

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
              setTimeout(() => {
                setCurrentRow(row.original)
                setOpen('edit')
              }, 0)
            }}
          >
            Visualizza
            <DropdownMenuShortcut>
              <Eye size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {isSuperadmin && isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setTimeout(() => {
                    setCurrentRow(row.original)
                    setOpen('approve')
                  }, 0)
                }}
                className='text-green-600 dark:text-green-400'
              >
                Approva
                <DropdownMenuShortcut>
                  <CheckCircle size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setTimeout(() => {
                    setCurrentRow(row.original)
                    setOpen('reject')
                  }, 0)
                }}
                className='text-orange-600 dark:text-orange-400'
              >
                Rifiuta
                <DropdownMenuShortcut>
                  <XCircle size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
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

