'use client'

import { type Table } from '@tanstack/react-table'
import { ConfirmDialog } from '@/components/confirm-dialog'

type FattureMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function FattureMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: FattureMultiDeleteDialogProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows

  // Placeholder - non implementato per ora
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={async () => {
        // Non implementato
      }}
      title="Elimina Fatture"
      desc={`Eliminazione multipla non implementata.`}
      confirmText="Elimina"
      destructive
    />
  )
}

