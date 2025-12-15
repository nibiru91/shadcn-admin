import { useCompanies } from './companies-provider'
import { CompaniesActionDialog } from './companies-action-dialog'
import { CompaniesDeleteDialog } from './companies-delete-dialog'

export function CompaniesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCompanies()

  return (
    <>
      <CompaniesActionDialog
        key='company-add'
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
          <CompaniesActionDialog
            key={`company-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <CompaniesDeleteDialog
            key={`company-delete-${currentRow.id}`}
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
