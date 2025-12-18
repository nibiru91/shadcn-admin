import { useAziende } from './aziende-provider'
import { AziendeActionDialog } from './aziende-action-dialog'
import { AziendeDeleteDialog } from './aziende-delete-dialog'

export function AziendeDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAziende()

  return (
    <>
      <AziendeActionDialog
        key='azienda-add'
        open={open === 'add'}
        onOpenChange={() => {
          setOpen('add')
          setTimeout(() => {
            setCurrentRow(null)
          }, 500)
        }}
        currentRow={null}
      />

      {currentRow && (
        <>
          <AziendeActionDialog
            key={`azienda-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <AziendeDeleteDialog
            key={`azienda-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
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
