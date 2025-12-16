'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Button } from '@/components/ui/button'
import { StepTipoFattura } from './components/step-tipo-fattura'
import { StepSelezioneAzienda } from './components/step-selezione-azienda'
import { StepCampiTestata } from './components/step-campi-testata'
import { StepRigheFattura } from './components/step-righe-fattura'
import { TotaliFattura } from './components/totali-fattura'
import { Riga } from './data/wizard-schema'
import { validaRighe, calcolaTotaliFattura, generaIdRiga } from './utils/fattura-wizard-utils'

type WizardState = {
  tipoFattura: 'emessa' | 'ricevuta' | undefined
  idCliente: number | undefined
  aziendaConfermata: boolean
  numero: string
  dataEmissione: string | undefined
  metodoPagamento: string | undefined
  bancaAppoggio: string | undefined
  note: string | undefined
  noteInterne: string | undefined
  righe: Riga[]
}

async function salvaFattura(state: WizardState) {
  // Validazione
  if (!state.tipoFattura) {
    throw new Error('Seleziona il tipo di fattura')
  }
  if (!state.idCliente || !state.aziendaConfermata) {
    throw new Error('Conferma la selezione dell\'azienda')
  }
  if (!state.numero || !state.dataEmissione) {
    throw new Error('Compila numero e data emissione')
  }

  const validazioneRighe = validaRighe(state.righe)
  if (!validazioneRighe.valid) {
    throw new Error(validazioneRighe.error || 'Errore validazione righe')
  }

  // Calcola totali
  const totali = calcolaTotaliFattura(state.righe)

  // Se fattura ricevuta, moltiplica tutti gli importi per -1
  const moltiplicatore = state.tipoFattura === 'ricevuta' ? -1 : 1

  // 1. Inserisci testata
  const { data: testata, error: errorTestata } = await supabase
    .from('fatture_testata')
    .insert({
      id_cliente: state.idCliente,
      numero: state.numero,
      data_emissione: state.dataEmissione,
      stato: 'emessa',
      totale_imponibile: totali.totale_imponibile * moltiplicatore,
      totale_iva: totali.totale_iva * moltiplicatore,
      totale_documento: totali.totale_documento * moltiplicatore,
      metodo_pagamento: state.metodoPagamento || null,
      banca_appoggio: state.bancaAppoggio || null,
      note: state.note || null,
      note_interne: state.noteInterne || null,
    })
    .select()
    .single()

  if (errorTestata) {
    throw new Error(`Errore salvataggio testata: ${errorTestata.message}`)
  }

  if (!testata) {
    throw new Error('Errore: testata non creata')
  }

  const idFattura = testata.id

  // 2. Inserisci righe
  const righeDaInserire = state.righe.map((riga, index) => {
    const prezzoUnitario = (riga.prezzo_unitario || 0) * moltiplicatore
    const totaleRiga = (riga.quantita || 0) * prezzoUnitario * (1 - (riga.sconto_percentuale || 0) / 100)
    
    return {
      id_fattura: idFattura,
      ordine: index,
      descrizione: riga.descrizione,
      quantita: riga.quantita || null,
      prezzo_unitario: prezzoUnitario,
      sconto_percentuale: riga.sconto_percentuale || 0,
      aliquota_iva: riga.aliquota_iva || null,
      codice_articolo: riga.codice_articolo || null,
      unita_misura: riga.unita_misura || 'ore',
      totale_riga: totaleRiga,
      id_commessa: riga.id_commessa || null,
    }
  })

  const { error: errorRighe } = await supabase
    .from('fatture_righe')
    .insert(righeDaInserire)

  if (errorRighe) {
    // Rollback: elimina testata
    await supabase.from('fatture_testata').delete().eq('id', idFattura)
    throw new Error(`Errore salvataggio righe: ${errorRighe.message}`)
  }

  // 3. Aggiorna timesheet
  const timesheetIds: number[] = []
  const timesheetUpdates: Array<{ id: number; tariffa_billed: number }> = []

  for (const riga of state.righe) {
    if (riga.timesheet_ids && riga.timesheet_ids.length > 0 && riga.prezzo_unitario) {
      for (const timesheetId of riga.timesheet_ids) {
        timesheetIds.push(timesheetId)
        timesheetUpdates.push({
          id: timesheetId,
          tariffa_billed: riga.prezzo_unitario * moltiplicatore,
        })
      }
    }
  }

  if (timesheetIds.length > 0) {
    // Aggiorna tutti i timesheet in batch
    const updates = timesheetIds.map((id) => {
      const update = timesheetUpdates.find((u) => u.id === id)
      return supabase
        .from('timesheet')
        .update({
          is_billed: true,
          tariffa_billed: update?.tariffa_billed || null,
          fattura: String(idFattura),
        })
        .eq('id', id)
    })

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      // Rollback: elimina testata e righe
      await supabase.from('fatture_righe').delete().eq('id_fattura', idFattura)
      await supabase.from('fatture_testata').delete().eq('id', idFattura)
      throw new Error('Errore aggiornamento timesheet')
    }
  }

  return idFattura
}

// Funzione per caricare i timesheet dal database
async function fetchTimesheetByIds(timesheetIds: number[]) {
  const { data, error } = await supabase
    .from('timesheet')
    .select('*')
    .in('id', timesheetIds)

  if (error) throw new Error(error.message)
  return data || []
}

// Funzione per caricare la commessa completa
async function fetchCommessa(commessaId: number) {
  const { data, error } = await supabase
    .from('commesse')
    .select('id, title, tariffa_oraria')
    .eq('id', commessaId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export function NuovaFattura() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/_authenticated/fatture/nuova/' })

  // Leggi i parametri URL
  const timesheetIdsParam = search.timesheetIds
  const commessaIdParam = search.commessaId
  const idClienteParam = search.idCliente

  const timesheetIds = timesheetIdsParam
    ? timesheetIdsParam.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
    : []
  const commessaId = commessaIdParam ? parseInt(commessaIdParam, 10) : undefined
  const idCliente = idClienteParam ? parseInt(idClienteParam, 10) : undefined

  const hasUrlParams = timesheetIds.length > 0 && commessaId && idCliente

  // Carica timesheet se ci sono parametri URL
  const { data: timesheetData = [] } = useQuery({
    queryKey: ['timesheet-for-invoice', timesheetIds],
    queryFn: () => fetchTimesheetByIds(timesheetIds),
    enabled: hasUrlParams && timesheetIds.length > 0,
  })

  // Carica commessa se c'è il parametro
  const { data: commessaData } = useQuery({
    queryKey: ['commessa-for-invoice', commessaId],
    queryFn: () => fetchCommessa(commessaId!),
    enabled: hasUrlParams && !!commessaId,
  })

  const [state, setState] = React.useState<WizardState>({
    tipoFattura: hasUrlParams ? 'emessa' : undefined,
    idCliente: hasUrlParams ? idCliente : undefined,
    aziendaConfermata: hasUrlParams,
    numero: '',
    dataEmissione: undefined,
    metodoPagamento: undefined,
    bancaAppoggio: undefined,
    note: undefined,
    noteInterne: undefined,
    righe: [],
  })

  const [rigaGenerata, setRigaGenerata] = React.useState(false)

  // Genera la riga automaticamente quando i dati sono pronti
  React.useEffect(() => {
    if (hasUrlParams && timesheetData.length > 0 && commessaData && !rigaGenerata) {
      // Calcola la somma delle ore billable
      const totaleOre = timesheetData.reduce((sum, t) => {
        return sum + (t.ore_billable || t.ore_lavorate || 0)
      }, 0)

      // Crea la riga aggregata
      const riga: Riga = {
        id: generaIdRiga(),
        descrizione: `Timesheet - ${commessaData.title}`,
        quantita: totaleOre,
        prezzo_unitario: commessaData.tariffa_oraria || 0,
        sconto_percentuale: 0,
        aliquota_iva: null,
        codice_articolo: null,
        unita_misura: 'ore',
        id_commessa: commessaId || null,
        timesheet_ids: timesheetIds,
        ordine: 0,
      }

      setState((prev) => ({
        ...prev,
        righe: [riga],
      }))
      
      setRigaGenerata(true)
    }
  }, [hasUrlParams, timesheetData, commessaData, commessaId, idCliente, timesheetIds, rigaGenerata])

  const salvaMutation = useMutation({
    mutationFn: salvaFattura,
    onSuccess: (idFattura) => {
      toast.success('Fattura creata con successo!')
      queryClient.invalidateQueries({ queryKey: ['fatture'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet'] })
      // Chiudi la scheda o redirect
      window.close()
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`)
    },
  })

  const handleSalva = () => {
    salvaMutation.mutate(state)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Nuova Fattura</h2>
          <p className='text-muted-foreground'>
            Procedura guidata per la creazione di una nuova fattura
          </p>
        </div>

        <div className='space-y-6'>
          <StepTipoFattura
            tipoFattura={state.tipoFattura}
            onTipoFatturaChange={(tipo) => setState({ ...state, tipoFattura: tipo })}
          />

          {state.tipoFattura && (
            <StepSelezioneAzienda
              tipoFattura={state.tipoFattura}
              idCliente={state.idCliente}
              onIdClienteChange={(id) => setState({ ...state, idCliente: id })}
              confermato={state.aziendaConfermata}
              onConferma={() => setState({ ...state, aziendaConfermata: true })}
            />
          )}

          {state.aziendaConfermata && (
            <>
              <StepCampiTestata
                numero={state.numero}
                onNumeroChange={(numero) => setState({ ...state, numero })}
                dataEmissione={state.dataEmissione}
                onDataEmissioneChange={(data) => setState({ ...state, dataEmissione: data })}
                metodoPagamento={state.metodoPagamento}
                onMetodoPagamentoChange={(metodo) => setState({ ...state, metodoPagamento: metodo })}
                bancaAppoggio={state.bancaAppoggio}
                onBancaAppoggioChange={(banca) => setState({ ...state, bancaAppoggio: banca })}
                note={state.note}
                onNoteChange={(note) => setState({ ...state, note })}
                noteInterne={state.noteInterne}
                onNoteInterneChange={(note) => setState({ ...state, noteInterne: note })}
              />

              <StepRigheFattura
                righe={state.righe}
                onRigheChange={(righe) => setState({ ...state, righe })}
                idAzienda={state.idCliente}
              />

              {state.righe.length > 0 && <TotaliFattura righe={state.righe} />}

              <div className='flex justify-end gap-2 pt-4 border-t'>
                <Button
                  variant='outline'
                  onClick={() => window.close()}
                  disabled={salvaMutation.isPending}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSalva}
                  disabled={salvaMutation.isPending || !state.numero || !state.dataEmissione || state.righe.length === 0}
                >
                  {salvaMutation.isPending ? 'Salvataggio...' : 'Salva Fattura'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Main>
    </>
  )
}

