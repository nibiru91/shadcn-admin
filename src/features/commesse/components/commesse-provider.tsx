import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Commessa } from '../data/schema'

type CommesseDialogType = 'add' | 'edit' | 'delete'

interface CommesseContextType {
  open: CommesseDialogType | null
  setOpen: (str: CommesseDialogType | null) => void
  currentRow: Commessa | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Commessa | null>>
}

const CommesseContext = React.createContext<CommesseContextType | null>(null)

export function CommesseProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<CommesseDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Commessa | null>(null)

  return (
    <CommesseContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CommesseContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCommesse = () => {
  const commesseContext = React.useContext(CommesseContext)

  if (!commesseContext) {
    throw new Error('useCommesse has to be used within <CommesseProvider>')
  }

  return commesseContext
}

