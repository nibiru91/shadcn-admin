import { useFerie } from './ferie-provider'
import { FerieActionDialog } from './ferie-action-dialog'
import { FerieDeleteDialog } from './ferie-delete-dialog'

export function FerieDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useFerie()

  return (
    <>
      <FerieActionDialog
        key='ferie-add'
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
          <FerieActionDialog
            key={`ferie-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <FerieDeleteDialog
            key={`ferie-delete-${currentRow.id}`}
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

