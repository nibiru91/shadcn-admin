import { useFatture } from './fatture-provider'
import { FattureDeleteDialog } from './fatture-delete-dialog'
import { FatturaViewDialog } from './fattura-view-dialog'

export function FattureDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useFatture()

  return (
    <>
      {currentRow && (
        <>
          <FatturaViewDialog
            key={`fatture-view-${currentRow.id}`}
            open={open === 'view'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpen(null)
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }
            }}
            fattura={currentRow}
          />
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
        </>
      )}
    </>
  )
}

