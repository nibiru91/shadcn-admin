import { z } from 'zod'
import { supabase } from '@/lib/supabase'

export const commessaSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, 'Il titolo è obbligatorio'),
  description: z.string().optional().nullable(),
  date_invio: z.string().optional().nullable(),
  date_approvazione: z.string().optional().nullable(),
  date_rifiuto: z.string().optional().nullable(),
  date_avvio: z.string().optional().nullable(),
  date_termine: z.string().optional().nullable(),
  date_avvio_prev: z.string().optional().nullable(),
  date_termine_prev: z.string().optional().nullable(),
  ore_previste: z.number().min(0).optional().nullable(),
  ore_pianificate: z.number().min(0).optional().nullable(),
  ore_consuntivate: z.number().min(0).optional().nullable(),
  ore_residue: z.number().optional().nullable(),
  tipologia: z.string().optional().nullable(),
  stato: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  is_valid: z.boolean().default(true),
  is_closed: z.boolean().default(false),
  cliente_diretto: z.number().optional().nullable(),
  cliente_fatturazione: z.number().optional().nullable(),
  riferimento_interno: z.string().optional().nullable(),
  riferimento_esterno: z.string().optional().nullable(),
  created_at: z.string().optional(),
})

export type Commessa = z.infer<typeof commessaSchema>

// Helper per ottenere i valori degli enum
export async function getEnumValues(enumName: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('enum_values', { enum_name: enumName })
  if (error) throw new Error(error.message)
  return data || []
}
