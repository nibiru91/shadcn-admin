import { useCommesse } from './commesse-provider'
import { CommesseActionDialog } from './commesse-action-dialog'
import { CommesseDeleteDialog } from './commesse-delete-dialog'

export function CommesseDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCommesse()

  return (
    <>
      <CommesseActionDialog
        key='commessa-add'
        open={open === 'add'}
        onOpenChange={() => {
          setOpen(null)
          setTimeout(() => {
            setCurrentRow(null)
          }, 500)
        }}
        currentRow={null}
      />

      {currentRow && (
        <>
          <CommesseActionDialog
            key={`commessa-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <CommesseDeleteDialog
            key={`commessa-delete-${currentRow.id}`}
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

