import { useFatture } from './fatture-provider'
import { FattureDeleteDialog } from './fatture-delete-dialog'

export function FattureDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useFatture()

  return (
    <>
      {currentRow && (
        <FattureDeleteDialog
          key={`fatture-delete-${currentRow.id}`}
          open={open === 'delete'}
          onOpenChange={() => {
            setOpen(null)
            setTimeout(() => {
              setCurrentRow(null)
            }, 500)
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}

