import { usePianificazione } from './pianificazione-provider'
import { PianificazioneActionDialog } from './pianificazione-action-dialog'
import { PianificazioneDeleteDialog } from './pianificazione-delete-dialog'

export function PianificazioneDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePianificazione()

  return (
    <>
      <PianificazioneActionDialog
        key='pianificazione-add'
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
          <PianificazioneActionDialog
            key={`pianificazione-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <PianificazioneDeleteDialog
            key={`pianificazione-delete-${currentRow.id}`}
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

