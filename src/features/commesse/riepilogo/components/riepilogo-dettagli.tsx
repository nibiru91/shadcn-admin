'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type CommessaDettagli } from '../utils/riepilogo-data'

type RiepilogoDettagliProps = {
  commessa: CommessaDettagli
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy')
  } catch {
    return dateString
  }
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return value.toFixed(2)
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return `€ ${value.toFixed(2)}`
}

function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return value ? 'Sì' : 'No'
}

export function RiepilogoDettagli({ commessa }: RiepilogoDettagliProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dettagli Commessa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>ID</label>
            <div className='mt-1'>{commessa.id}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Titolo</label>
            <div className='mt-1 font-medium'>{commessa.title}</div>
          </div>
          <div className='md:col-span-2'>
            <label className='text-sm font-medium text-muted-foreground'>Descrizione</label>
            <div className='mt-1'>{commessa.description || '-'}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Invio</label>
            <div className='mt-1'>{formatDate(commessa.date_invio)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Approvazione</label>
            <div className='mt-1'>{formatDate(commessa.date_approvazione)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Rifiuto</label>
            <div className='mt-1'>{formatDate(commessa.date_rifiuto)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Avvio</label>
            <div className='mt-1'>{formatDate(commessa.date_avvio)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Termine</label>
            <div className='mt-1'>{formatDate(commessa.date_termine)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Avvio Prevista</label>
            <div className='mt-1'>{formatDate(commessa.date_avvio_prev)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Termine Prevista</label>
            <div className='mt-1'>{formatDate(commessa.date_termine_prev)}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Ore Previste</label>
            <div className='mt-1'>{formatNumber(commessa.ore_previste)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Ore Pianificate</label>
            <div className='mt-1'>{formatNumber(commessa.ore_pianificate)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Ore Consuntivate</label>
            <div className='mt-1'>{formatNumber(commessa.ore_consuntivate)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Ore Residue</label>
            <div className='mt-1'>{formatNumber(commessa.ore_residue)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Ore Fatturate</label>
            <div className='mt-1'>{formatNumber(commessa.ore_fatturate)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Tariffa Oraria</label>
            <div className='mt-1'>{formatCurrency(commessa.tariffa_oraria)}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Tipologia</label>
            <div className='mt-1'>{commessa.tipologia || '-'}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Stato</label>
            <div className='mt-1'>{commessa.stato || '-'}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Area</label>
            <div className='mt-1'>{commessa.area || '-'}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Categoria</label>
            <div className='mt-1'>{commessa.categoria || '-'}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Valida</label>
            <div className='mt-1'>{formatBoolean(commessa.is_valid)}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Chiusa</label>
            <div className='mt-1'>{formatBoolean(commessa.is_closed)}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Cliente Diretto</label>
            <div className='mt-1'>{commessa.cliente_diretto_nome || `#${commessa.cliente_diretto || '-'}`}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Cliente Fatturazione</label>
            <div className='mt-1'>{commessa.cliente_fatturazione_nome || `#${commessa.cliente_fatturazione || '-'}`}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Riferimento Interno</label>
            <div className='mt-1'>{commessa.riferimento_interno || '-'}</div>
          </div>
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Riferimento Esterno</label>
            <div className='mt-1'>{commessa.riferimento_esterno || '-'}</div>
          </div>
          
          <div>
            <label className='text-sm font-medium text-muted-foreground'>Data Creazione</label>
            <div className='mt-1'>{formatDate(commessa.created_at)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

