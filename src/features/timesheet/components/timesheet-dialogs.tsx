import { useTimesheet } from './timesheet-provider'
import { TimesheetActionDialog } from './timesheet-action-dialog'
import { TimesheetDeleteDialog } from './timesheet-delete-dialog'

export function TimesheetDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTimesheet()

  return (
    <>
      <TimesheetActionDialog
        key='timesheet-add'
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
          <TimesheetActionDialog
            key={`timesheet-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <TimesheetDeleteDialog
            key={`timesheet-delete-${currentRow.id}`}
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

