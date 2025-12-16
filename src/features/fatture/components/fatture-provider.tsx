import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Fattura } from '../data/schema'

type FattureDialogType = 'add' | 'edit' | 'delete' | 'multi-delete'

interface FattureContextType {
  open: FattureDialogType | null
  setOpen: (str: FattureDialogType | null) => void
  currentRow: Fattura | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Fattura | null>>
}

const FattureContext = React.createContext<FattureContextType | null>(null)

export function FattureProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<FattureDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Fattura | null>(null)

  return (
    <FattureContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </FattureContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFatture = () => {
  const fattureContext = React.useContext(FattureContext)

  if (!fattureContext) {
    throw new Error('useFatture has to be used within <FattureProvider>')
  }

  return fattureContext
}

