import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { PianificazioneMultiDeleteDialog } from './pianificazione-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <>
      <BulkActionsToolbar table={table} entityName='pianificazione'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Elimina pianificazioni selezionate'
              title='Elimina pianificazioni selezionate'
            >
              <Trash2 />
              <span className='sr-only'>Elimina pianificazioni selezionate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Elimina pianificazioni selezionate</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <PianificazioneMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}

