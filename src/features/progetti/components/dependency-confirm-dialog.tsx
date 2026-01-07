import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { Task } from '../data/schema'
import { formatTaskDate } from '../utils/dates'

interface DependencyConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToMove: Task
  affectedTasks: Task[]
  onConfirm: (confirmedTaskIds: string[]) => void
}

export function DependencyConfirmDialog({
  open,
  onOpenChange,
  taskToMove,
  affectedTasks,
  onConfirm,
}: DependencyConfirmDialogProps) {
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())

  const handleToggle = (taskId: string) => {
    const newSet = new Set(confirmedIds)
    if (newSet.has(taskId)) {
      newSet.delete(taskId)
    } else {
      newSet.add(taskId)
    }
    setConfirmedIds(newSet)
  }

  const handleConfirm = () => {
    onConfirm(Array.from(confirmedIds))
    setConfirmedIds(new Set())
    onOpenChange(false)
  }

  const handleCancel = () => {
    setConfirmedIds(new Set())
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-2xl'>
        <AlertDialogHeader>
          <AlertDialogTitle>Conferma spostamento task dipendenti</AlertDialogTitle>
          <AlertDialogDescription>
            Il task "{taskToMove.nome}" ha dipendenze che devono essere spostate.
            Seleziona i task da spostare automaticamente:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='max-h-96 space-y-4 overflow-y-auto py-4'>
          {affectedTasks.map((task) => (
            <div
              key={task.id}
              className='flex items-center space-x-3 rounded-md border p-3'
            >
              <Checkbox
                id={task.id}
                checked={confirmedIds.has(task.id)}
                onCheckedChange={() => handleToggle(task.id)}
              />
              <Label
                htmlFor={task.id}
                className='flex-1 cursor-pointer space-y-1'
              >
                <div className='font-medium'>{task.nome}</div>
                <div className='text-sm text-muted-foreground'>
                  {formatTaskDate(task.data_inizio)} - {formatTaskDate(task.data_fine)}
                </div>
              </Label>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Sposta ({confirmedIds.size} task)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

