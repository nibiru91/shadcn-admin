import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Planning } from '../data/schema'

type PianificazioneDialogType = 'add' | 'edit' | 'delete'

interface PianificazioneContextType {
  open: PianificazioneDialogType | null
  setOpen: (str: PianificazioneDialogType | null) => void
  currentRow: Planning | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Planning | null>>
}

const PianificazioneContext = React.createContext<PianificazioneContextType | null>(null)

export function PianificazioneProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<PianificazioneDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Planning | null>(null)

  return (
    <PianificazioneContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PianificazioneContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePianificazione = () => {
  const pianificazioneContext = React.useContext(PianificazioneContext)

  if (!pianificazioneContext) {
    throw new Error('usePianificazione has to be used within <PianificazioneProvider>')
  }

  return pianificazioneContext
}

