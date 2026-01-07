import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Task } from '../data/schema'
import { formatTaskDate } from '../utils/dates'

interface DependencyErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  minStartDate: Date
  dependencyTasks: Task[]
}

export function DependencyErrorDialog({
  open,
  onOpenChange,
  task,
  minStartDate,
  dependencyTasks,
}: DependencyErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-2xl'>
        <AlertDialogHeader>
          <AlertDialogTitle>Errore di dipendenza</AlertDialogTitle>
          <AlertDialogDescription>
            Il task "{task.nome}" non può essere spostato alla data selezionata perché viola le dipendenze.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-4 py-4'>
          <div className='rounded-md bg-destructive/10 p-4'>
            <div className='font-semibold text-destructive'>
              Data minima di inizio: {formatTaskDate(minStartDate)}
            </div>
            <div className='mt-2 text-sm text-muted-foreground'>
              Il task deve iniziare almeno un giorno dopo la fine di tutti i task da cui dipende.
            </div>
          </div>

          <div>
            <div className='mb-2 font-medium'>Task da cui dipende:</div>
            <div className='space-y-2'>
              {dependencyTasks.map((depTask) => (
                <div
                  key={depTask.id}
                  className='rounded-md border p-3'
                >
                  <div className='font-medium'>{depTask.nome}</div>
                  <div className='text-sm text-muted-foreground'>
                    Fine: {formatTaskDate(depTask.data_fine)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Ho capito
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

