import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Azienda } from '../data/schema'

type AziendeDialogType = 'add' | 'edit' | 'delete'

interface AziendeContextType {
  open: AziendeDialogType | null
  setOpen: (str: AziendeDialogType | null) => void
  currentRow: Azienda | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Azienda | null>>
}

const AziendeContext = React.createContext<AziendeContextType | null>(null)

export function AziendeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<AziendeDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Azienda | null>(null)

  return (
    <AziendeContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </AziendeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAziende = () => {
  const aziendeContext = React.useContext(AziendeContext)

  if (!aziendeContext) {
    throw new Error('useAziende has to be used within <AziendeProvider>')
  }

  return aziendeContext
}
