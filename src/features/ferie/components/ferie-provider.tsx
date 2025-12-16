import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Ferie } from '../data/schema'

type FerieDialogType = 'add' | 'edit' | 'delete' | 'approve' | 'reject'

interface FerieContextType {
  open: FerieDialogType | null
  setOpen: (str: FerieDialogType | null) => void
  currentRow: Ferie | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Ferie | null>>
}

const FerieContext = React.createContext<FerieContextType | null>(null)

export function FerieProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<FerieDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Ferie | null>(null)

  return (
    <FerieContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </FerieContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFerie = () => {
  const ferieContext = React.useContext(FerieContext)

  if (!ferieContext) {
    throw new Error('useFerie has to be used within <FerieProvider>')
  }

  return ferieContext
}

