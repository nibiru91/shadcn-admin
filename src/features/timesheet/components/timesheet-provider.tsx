import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Timesheet } from '../data/schema'

type TimesheetDialogType = 'add' | 'edit' | 'delete' | 'multi-delete'

interface TimesheetContextType {
  open: TimesheetDialogType | null
  setOpen: (str: TimesheetDialogType | null) => void
  currentRow: Timesheet | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Timesheet | null>>
}

const TimesheetContext = React.createContext<TimesheetContextType | null>(null)

export function TimesheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<TimesheetDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Timesheet | null>(null)

  return (
    <TimesheetContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </TimesheetContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTimesheet = () => {
  const timesheetContext = React.useContext(TimesheetContext)

  if (!timesheetContext) {
    throw new Error('useTimesheet has to be used within <TimesheetProvider>')
  }

  return timesheetContext
}

