import { supabase } from '@/lib/supabase'

export type PianificazioniTotali = {
  totale_ore: number
}

export type TimesheetTotali = {
  totale_ore_lavorate: number
  totale_ore_billable: number
}

export type FattureTotali = {
  totale_netto: number
}

export type CommessaDettagli = {
  id: number
  title: string
  description: string | null
  date_invio: string | null
  date_approvazione: string | null
  date_rifiuto: string | null
  date_avvio: string | null
  date_termine: string | null
  date_avvio_prev: string | null
  date_termine_prev: string | null
  ore_previste: number | null
  ore_pianificate: number | null
  ore_consuntivate: number | null
  ore_residue: number | null
  ore_fatturate: number | null
  tariffa_oraria: number
  tipologia: string | null
  stato: string | null
  area: string | null
  categoria: string | null
  is_valid: boolean
  is_closed: boolean
  cliente_diretto: number | null
  cliente_fatturazione: number | null
  riferimento_interno: string | null
  riferimento_esterno: string | null
  created_at: string | null
  cliente_diretto_nome?: string | null
  cliente_fatturazione_nome?: string | null
}

export async function fetchPianificazioniTotali(
  commessaId: number
): Promise<PianificazioniTotali> {
  const { data, error } = await supabase
    .from('planning')
    .select('ore')
    .eq('commessa', commessaId)
    .eq('is_valid', true)

  if (error) throw new Error(error.message)

  const totale_ore = (data || []).reduce((sum, item) => sum + (item.ore || 0), 0)

  return { totale_ore }
}

export async function fetchTimesheetTotali(
  commessaId: number
): Promise<TimesheetTotali> {
  const { data, error } = await supabase
    .from('timesheet')
    .select('ore_lavorate, ore_billable')
    .eq('commessa', commessaId)
    .eq('is_valid', true)

  if (error) throw new Error(error.message)

  const totale_ore_lavorate = (data || []).reduce(
    (sum, item) => sum + (item.ore_lavorate || 0),
    0
  )
  const totale_ore_billable = (data || []).reduce(
    (sum, item) => sum + (item.ore_billable || 0),
    0
  )

  return { totale_ore_lavorate, totale_ore_billable }
}

export async function fetchFattureTotali(
  commessaId: number
): Promise<FattureTotali> {
  const { data, error } = await supabase
    .from('fatture_righe')
    .select('totale_riga')
    .eq('id_commessa', commessaId)

  if (error) throw new Error(error.message)

  const totale_netto = (data || []).reduce(
    (sum, item) => sum + (item.totale_riga || 0),
    0
  )

  return { totale_netto }
}

export async function fetchCommessaDettagli(
  commessaId: number
): Promise<CommessaDettagli> {
  const { data, error } = await supabase
    .from('commesse')
    .select(`
      *,
      cliente_diretto:companies!cliente_diretto(id, ragione_sociale),
      cliente_fatturazione:companies!cliente_fatturazione(id, ragione_sociale)
    `)
    .eq('id', commessaId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Commessa non trovata')

  const clienteDiretto = (data as any).cliente_diretto
  const clienteFatturazione = (data as any).cliente_fatturazione

  return {
    ...data,
    cliente_diretto_nome:
      clienteDiretto && typeof clienteDiretto === 'object'
        ? (clienteDiretto as any).ragione_sociale
        : null,
    cliente_fatturazione_nome:
      clienteFatturazione && typeof clienteFatturazione === 'object'
        ? (clienteFatturazione as any).ragione_sociale
        : null,
  } as CommessaDettagli
}


