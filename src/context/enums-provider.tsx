import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type EnumsProviderState = {
  tipologia: string[]
  stato: string[]
  area: string[]
  categoria: string[]
  ruoli: string[]
  isLoading: boolean
  error: Error | null
}

const initialState: EnumsProviderState = {
  tipologia: [],
  stato: [],
  area: [],
  categoria: [],
  ruoli: [],
  isLoading: true,
  error: null,
}

const EnumsContext = createContext<EnumsProviderState>(initialState)

type EnumsProviderProps = {
  children: React.ReactNode
}

// Funzione helper per normalizzare i valori degli enums
function normalizeEnumValues(data: unknown): string[] {
  if (!Array.isArray(data)) return []
  return data
    .map((item: string | { value: string }) =>
      typeof item === 'string' ? item : item.value
    )
    .filter((v: string) => v && v.trim() !== '')
}

export function EnumsProvider({ children }: EnumsProviderProps) {
  // Carica tutti gli enums in parallelo
  const { data: tipologiaData = [], isLoading: isLoadingTipologia } = useQuery({
    queryKey: ['enum-tipo_commesse'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', {
        enum_name: 'tipo_commesse',
      })
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: Infinity, // Non refetch automatico
  })

  const { data: statoData = [], isLoading: isLoadingStato } = useQuery({
    queryKey: ['enum-stato_commesse'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', {
        enum_name: 'stato_commesse',
      })
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: Infinity,
  })

  const { data: areaData = [], isLoading: isLoadingArea } = useQuery({
    queryKey: ['enum-aree_aziendali'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', {
        enum_name: 'aree_aziendali',
      })
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: Infinity,
  })

  const {
    data: categoriaData = [],
    isLoading: isLoadingCategoria,
    error: categoriaError,
  } = useQuery({
    queryKey: ['enum-categorie_aziendali'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', {
        enum_name: 'categorie_aziendali',
      })
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: Infinity,
  })

  const {
    data: ruoliData = [],
    isLoading: isLoadingRuoli,
    error: ruoliError,
  } = useQuery({
    queryKey: ['enum-ruoli'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', {
        enum_name: 'ruoli',
      })
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: Infinity,
  })

  // Normalizza i valori
  const tipologia = normalizeEnumValues(tipologiaData)
  const stato = normalizeEnumValues(statoData)
  const area = normalizeEnumValues(areaData)
  const categoria = normalizeEnumValues(categoriaData)
  const ruoli = normalizeEnumValues(ruoliData)

  const isLoading =
    isLoadingTipologia || isLoadingStato || isLoadingArea || isLoadingCategoria || isLoadingRuoli

  const contextValue: EnumsProviderState = {
    tipologia,
    stato,
    area,
    categoria,
    ruoli,
    isLoading,
    error: (categoriaError || ruoliError) as Error | null,
  }

  return (
    <EnumsContext.Provider value={contextValue}>{children}</EnumsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEnums = () => {
  const context = useContext(EnumsContext)

  if (!context) {
    throw new Error('useEnums must be used within an EnumsProvider')
  }

  return context
}

