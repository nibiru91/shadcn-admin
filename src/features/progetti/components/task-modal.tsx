'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { DatePicker } from '@/components/date-picker'
import { useProgettiStore } from './progetti-provider'
import { taskFormSchema, type TaskFormData, type Priorita } from '../data/schema'
import { validateDependencies, validateTaskDependenciesOnMove, getDependentTasks } from '../utils/dependencies'
import { DependencyErrorDialog } from './dependency-error-dialog'
import { DependencyConfirmDialog } from './dependency-confirm-dialog'
import { differenceInDays, addDays } from 'date-fns'
import { colorOptions } from '../utils/colors'
import type { Task } from '../data/schema'

const prioritaOptions: { value: Priorita; label: string }[] = [
  { value: 'bassa', label: 'Bassa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Critica' },
]

export function TaskModal() {
  const {
    modalOpen,
    modalMode,
    selectedTaskId,
    tasks,
    getTaskById,
    addTask,
    updateTask,
    updateTaskFields,
    deleteTask,
    closeModal,
    moveTaskWithDelta,
    moveTaskWithConfirmation,
  } = useProgettiStore()

  const currentTask = selectedTaskId ? getTaskById(selectedTaskId) : null
  const isEdit = modalMode === 'edit' && !!currentTask
  
  // Verifica se il task corrente è un padre
  const isParent = currentTask ? tasks.some((t) => t.task_padre_id === currentTask.id) : false
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dependencyError, setDependencyError] = useState<{
    task: Task
    minStartDate: Date
    dependencyTasks: Task[]
  } | null>(null)
  const [pendingMove, setPendingMove] = useState<{
    task: Task
    newStartDate: Date
    newEndDate: Date
    affectedTasks: Task[]
  } | null>(null)

  // Filtra i task disponibili per dipendenze (escludi se stesso e i suoi figli)
  const availableTasksForDependencies = useMemo(() => {
    if (!currentTask) {
      return tasks.filter((t) => !t.task_padre_id) // Solo root tasks per nuovi task
    }
    
    // Per edit, escludi se stesso e tutti i suoi discendenti
    const excludeIds = new Set<string>([currentTask.id])
    const addDescendants = (taskId: string) => {
      tasks.forEach((t) => {
        if (t.task_padre_id === taskId) {
          excludeIds.add(t.id)
          addDescendants(t.id)
        }
      })
    }
    addDescendants(currentTask.id)
    
    return tasks.filter((t) => !excludeIds.has(t.id))
  }, [tasks, currentTask])

  // Filtra i task disponibili come padre (escludi solo se stesso e i suoi discendenti)
  // Un figlio può essere padre di altri task
  const availableTasksForParent = useMemo(() => {
    if (!currentTask) {
      // Per nuovi task, tutti i task possono essere padre
      return tasks
    }
    
    const excludeIds = new Set<string>([currentTask.id])
    const addDescendants = (taskId: string) => {
      tasks.forEach((t) => {
        if (t.task_padre_id === taskId) {
          excludeIds.add(t.id)
          addDescendants(t.id)
        }
      })
    }
    addDescendants(currentTask.id)
    
    // Escludi solo se stesso e i suoi discendenti, ma permetti task che hanno già un padre
    return tasks.filter((t) => !excludeIds.has(t.id))
  }, [tasks, currentTask])

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      nome: '',
      descrizione: null,
      priorità: 'media',
      colore: null,
      data_inizio: new Date(),
      data_fine: new Date(),
      ore_previste: null,
      task_padre_id: null,
      dipendenze: [],
    },
  })

  useEffect(() => {
    if (isEdit && currentTask) {
      form.reset({
        nome: currentTask.nome,
        descrizione: currentTask.descrizione || null,
        priorità: currentTask.priorità,
        colore: currentTask.colore || null,
        data_inizio: currentTask.data_inizio,
        data_fine: currentTask.data_fine,
        ore_previste: currentTask.ore_previste || null,
        task_padre_id: currentTask.task_padre_id || null,
        dipendenze: currentTask.dipendenze || [],
      })
    } else {
      form.reset({
        nome: '',
        descrizione: null,
        priorità: 'media',
        colore: null,
        data_inizio: new Date(),
        data_fine: new Date(),
        ore_previste: null,
        task_padre_id: null,
        dipendenze: [],
      })
    }
  }, [isEdit, currentTask, form, modalOpen])

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Se è un task padre, aggiorna solo nome, descrizione e colore (le date vengono calcolate dai figli)
      if (isEdit && currentTask && isParent) {
        const updated = updateTaskFields(currentTask.id, {
          nome: data.nome,
          descrizione: data.descrizione,
          priorità: currentTask.priorità, // Mantieni la priorità esistente
          colore: data.colore,
          ore_previste: currentTask.ore_previste, // Mantieni le ore previste esistenti
          task_padre_id: currentTask.task_padre_id, // Mantieni il padre esistente
          dipendenze: currentTask.dipendenze, // Mantieni le dipendenze esistenti
        })
        if (updated) {
          toast.success('Task aggiornato con successo')
          closeModal()
        } else {
          toast.error('Errore nell\'aggiornamento del task')
        }
        return
      }

      const newStartDate = data.data_inizio as Date
      const newEndDate = data.data_fine as Date

      if (isEdit && currentTask) {
        // Verifica se le date sono cambiate
        const datesChanged =
          newStartDate.getTime() !== currentTask.data_inizio.getTime() ||
          newEndDate.getTime() !== currentTask.data_fine.getTime()

        if (datesChanged) {
          // Crea un task temporaneo con i nuovi dati per la validazione
          const tempTask: Task = {
            ...currentTask,
            nome: data.nome,
            descrizione: data.descrizione ?? null,
            priorità: data.priorità,
            colore: data.colore ?? null,
            data_inizio: newStartDate,
            data_fine: newEndDate,
            ore_previste: data.ore_previste ?? null,
            task_padre_id: data.task_padre_id ?? null,
            dipendenze: data.dipendenze || [],
          }

          // Prima verifica se il task viola le sue dipendenze
          const dependencyValidation = validateTaskDependenciesOnMove(tempTask, newStartDate, tasks)
          if (!dependencyValidation.valid && dependencyValidation.minStartDate) {
            setDependencyError({
              task: tempTask,
              minStartDate: dependencyValidation.minStartDate,
              dependencyTasks: dependencyValidation.dependencyTasks,
            })
            return
          }

          // Verifica se ci sono task che dipendono da questo task
          const dependentTasks = getDependentTasks(currentTask.id, tasks)

          if (dependentTasks.length > 0) {
            // Nel form, guardiamo solo la data fine per spostare i task dipendenti
            // Se cambia solo la data inizio, i task dipendenti non devono essere modificati
            const endDateChanged = newEndDate.getTime() !== currentTask.data_fine.getTime()
            // Calcola il delta (giorni di spostamento) basandosi sulla data fine
            const daysDelta = differenceInDays(newEndDate, currentTask.data_fine)

            if (endDateChanged && daysDelta !== 0) {
              // Simula lo spostamento di tutti i task dipendenti per verificare se violano le loro dipendenze
              const affectedTasks: Task[] = []
              const allTasksAfterShift = tasks.map((t) => {
                if (t.id === currentTask.id) {
                  return tempTask
                }
                if (dependentTasks.some((dt) => dt.id === t.id)) {
                  return {
                    ...t,
                    data_inizio: addDays(t.data_inizio, daysDelta),
                    data_fine: addDays(t.data_fine, daysDelta),
                  }
                }
                return t
              })

              // Verifica se alcuni task dipendenti violano le loro dipendenze dopo lo spostamento
              for (const dependent of dependentTasks) {
                const shiftedDependent = allTasksAfterShift.find((t) => t.id === dependent.id)!
                const depValidation = validateTaskDependenciesOnMove(
                  shiftedDependent,
                  shiftedDependent.data_inizio,
                  allTasksAfterShift
                )
                if (!depValidation.valid) {
                  affectedTasks.push(dependent)
                }
              }

              if (affectedTasks.length > 0) {
                // Alcuni task dipendenti violerebbero le loro dipendenze, mostra dialog di conferma
                setPendingMove({
                  task: tempTask,
                  newStartDate,
                  newEndDate,
                  affectedTasks,
                })
                return
              } else {
                // Sposta automaticamente tutti i task dipendenti del delta calcolato
                const moved = await moveTaskWithDelta(currentTask.id, newStartDate, newEndDate, daysDelta)
                if (moved) {
                  // Aggiorna anche gli altri campi del task (nome, descrizione, ecc.)
                  // Le date sono già state aggiornate da moveTaskWithDelta
                  const { data_inizio, data_fine, ...otherFields } = data
                  const updated = updateTaskFields(currentTask.id, otherFields)
                  if (updated) {
                    toast.success('Task aggiornato con successo')
                    closeModal()
                  } else {
                    toast.error('Errore nell\'aggiornamento del task')
                  }
                } else {
                  toast.error('Errore nello spostamento del task')
                }
                return
              }
            }
          }

          // Nessun task dipendente o nessun cambio di date, aggiorna normalmente
          const updated = updateTask(currentTask.id, data)
          if (updated) {
            toast.success('Task aggiornato con successo')
            closeModal()
          } else {
            toast.error('Errore nell\'aggiornamento del task')
          }
        } else {
          // Date non cambiate, aggiorna solo gli altri campi
          const updated = updateTask(currentTask.id, data)
          if (updated) {
            toast.success('Task aggiornato con successo')
            closeModal()
          } else {
            toast.error('Errore nell\'aggiornamento del task')
          }
        }
      } else {
        // Nuovo task - validazione dipendenze standard
        const tempTask = {
          id: 'temp',
          ...data,
          dipendenze: data.dipendenze || [],
          collapsed: false,
        } as any

        const validation = validateDependencies(tempTask, tasks)
        if (!validation.valid) {
          toast.error('Errore di validazione: ' + validation.errors.join(', '))
          return
        }

        const created = addTask(data)
        if (created) {
          toast.success('Task creato con successo')
          closeModal()
        } else {
          toast.error('Errore nella creazione del task')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il salvataggio')
    }
  }

  const handleDependencyConfirm = async (confirmedTaskIds: string[]) => {
    if (!pendingMove || !currentTask) return

    const { newStartDate, newEndDate } = pendingMove

    // Usa moveTaskWithConfirmation per gestire lo spostamento del task principale e dei task dipendenti confermati
    const moved = await moveTaskWithConfirmation(currentTask.id, newStartDate, newEndDate, confirmedTaskIds)
    
    if (moved) {
      // Aggiorna anche gli altri campi del task dal form (nome, descrizione, ecc.)
      // Le date sono già state aggiornate da moveTaskWithConfirmation
      const formData = form.getValues()
      const { data_inizio, data_fine, ...otherFields } = formData
      const updated = updateTaskFields(currentTask.id, otherFields)
      if (updated) {
        toast.success('Task aggiornato con successo')
        closeModal()
      } else {
        toast.error('Errore nell\'aggiornamento del task')
      }
    } else {
      toast.error('Errore nello spostamento del task')
    }

    setPendingMove(null)
  }

  const handleDelete = () => {
    if (!currentTask) return
    
    deleteTask(currentTask.id)
    toast.success('Task eliminato con successo')
    setShowDeleteConfirm(false)
    closeModal()
  }

  return (
    <>
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Modifica Task' : 'Nuovo Task'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Modifica i dettagli del task'
                : 'Crea un nuovo task per il progetto'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='nome'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder='Nome del task' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='descrizione'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Descrizione del task'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isParent && (
                <FormField
                  control={form.control}
                  name='colore'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colore</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Seleziona colore' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>Nessun colore</SelectItem>
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Il colore verrà ereditato da tutti i figli diretti che non sono a loro volta padri
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isParent && (
                <>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='priorità'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priorità *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Seleziona priorità' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {prioritaOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='ore_previste'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ore Previste</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='0'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === '' ? null : parseFloat(value))
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Solo indicativo, non influisce sulla durata
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='colore'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colore</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleziona colore' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>Nessun colore</SelectItem>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Se non selezionato, erediterà il colore del padre (se presente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='data_inizio'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Data Inizio *</FormLabel>
                      <DatePicker
                        selected={field.value as Date | undefined}
                        onSelect={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='data_fine'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Data Fine *</FormLabel>
                      <DatePicker
                        selected={field.value as Date | undefined}
                        onSelect={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='task_padre_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Padre</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === 'none' ? null : value)
                      }
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Nessun task padre' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>Nessun task padre</SelectItem>
                        {availableTasksForParent.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleziona un task padre per creare una gerarchia
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='dipendenze'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dipendenze</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const current = field.value || []
                        if (current.includes(value)) {
                          field.onChange(current.filter((id) => id !== value))
                        } else {
                          field.onChange([...current, value])
                        }
                      }}
                      value=''
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Aggiungi dipendenza' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTasksForDependencies.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Task selezionati: {field.value?.length || 0}
                      {field.value && field.value.length > 0 && (
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {field.value.map((taskId) => {
                            const task = tasks.find((t) => t.id === taskId)
                            return task ? (
                              <span
                                key={taskId}
                                className='inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary'
                              >
                                {task.nome}
                                <button
                                  type='button'
                                  onClick={() => {
                                    field.onChange(
                                      field.value?.filter((id) => id !== taskId) || []
                                    )
                                  }}
                                  className='ml-2 hover:text-destructive'
                                >
                                  ×
                                </button>
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </>
              )}
              <DialogFooter>
                {isEdit && (
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Elimina
                  </Button>
                )}
                <Button type='button' variant='outline' onClick={closeModal}>
                  Annulla
                </Button>
                <Button type='submit'>{isEdit ? 'Salva' : 'Crea'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il task "{currentTask?.nome}"?
              Questa azione eliminerà anche tutti i task figli e non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {dependencyError && (
        <DependencyErrorDialog
          open={!!dependencyError}
          onOpenChange={(open) => !open && setDependencyError(null)}
          task={dependencyError.task}
          minStartDate={dependencyError.minStartDate}
          dependencyTasks={dependencyError.dependencyTasks}
        />
      )}

      {pendingMove && (
        <DependencyConfirmDialog
          open={!!pendingMove}
          onOpenChange={(open) => !open && setPendingMove(null)}
          taskToMove={pendingMove.task}
          affectedTasks={pendingMove.affectedTasks}
          onConfirm={handleDependencyConfirm}
        />
      )}
    </>
  )
}

