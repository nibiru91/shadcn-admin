'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Fattura } from '../data/schema'

interface FattureDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Fattura
}

export function FattureDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: FattureDeleteDialogProps) {
  // Placeholder - non implementato per ora
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={async () => {
        // Non implementato
      }}
      title="Elimina Fattura"
      desc={`Eliminazione non implementata.`}
      confirmText="Elimina"
      destructive
    />
  )
}

