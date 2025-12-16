'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Fattura } from '../data/schema'

type FatturaRiga = {
  id: number
  id_fattura: number
  ordine: number
  descrizione: string
  quantita: number | null
  prezzo_unitario: number
  sconto_percentuale: number
  aliquota_iva: number | null
  codice_articolo: string | null
  unita_misura: string
  totale_riga: number
  id_commessa: number | null
}

type FatturaViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fattura: Fattura | null
}

async function fetchFatturaRighe(idFattura: number): Promise<FatturaRiga[]> {
  const { data, error } = await supabase
    .from('fatture_righe')
    .select('*')
    .eq('id_fattura', idFattura)
    .order('ordine', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as FatturaRiga[]
}

export function FatturaViewDialog({
  open,
  onOpenChange,
  fattura,
}: FatturaViewDialogProps) {
  const { data: righe = [], isLoading: isLoadingRighe } = useQuery({
    queryKey: ['fattura-righe', fattura?.id],
    queryFn: () => fetchFatturaRighe(fattura!.id!),
    enabled: !!fattura?.id && open,
  })

  if (!fattura) return null

  const cliente = (fattura as any).id_cliente
  const clienteName = cliente && typeof cliente === 'object'
    ? (cliente as any).ragione_sociale || `Cliente #${(cliente as any).id}`
    : `Cliente #${fattura.id_cliente}`

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy')
    } catch {
      return dateString
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '€ 0,00'
    return `€ ${Math.abs(value).toFixed(2).replace('.', ',')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='!w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle>Visualizza Fattura</DialogTitle>
          <DialogDescription>
            Anteprima del documento fattura
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Header Fattura */}
          <div className='border-b pb-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h3 className='text-lg font-semibold mb-2'>Dati Fattura</h3>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Numero:</span>
                    <span className='font-medium'>{fattura.numero || '-'}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Data Emissione:</span>
                    <span className='font-medium'>{formatDate(fattura.data_emissione)}</span>
                  </div>
                  {fattura.anno && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Anno:</span>
                      <span className='font-medium'>{fattura.anno}</span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Stato:</span>
                    <span className='font-medium'>{fattura.stato || 'bozza'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-2'>Azienda</h3>
                <div className='space-y-1 text-sm'>
                  <div>
                    <span className='font-medium'>{clienteName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Righe Fattura */}
          {isLoadingRighe ? (
            <div className='text-sm text-muted-foreground'>Caricamento righe...</div>
          ) : righe.length === 0 ? (
            <div className='text-sm text-muted-foreground'>Nessuna riga presente</div>
          ) : (
            <div className='border rounded-md overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-12'>#</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className='text-right'>Quantità</TableHead>
                    <TableHead className='text-right'>Prezzo Unit.</TableHead>
                    <TableHead className='text-right'>Sconto %</TableHead>
                    <TableHead className='text-right'>IVA %</TableHead>
                    <TableHead className='text-right'>Totale Riga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {righe.map((riga, index) => (
                    <TableRow key={riga.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{riga.descrizione || '-'}</TableCell>
                      <TableCell className='text-right'>
                        {riga.quantita !== null ? `${riga.quantita} ${riga.unita_misura || ''}` : '-'}
                      </TableCell>
                      <TableCell className='text-right'>{formatCurrency(riga.prezzo_unitario)}</TableCell>
                      <TableCell className='text-right'>
                        {riga.sconto_percentuale > 0 ? `${riga.sconto_percentuale}%` : '-'}
                      </TableCell>
                      <TableCell className='text-right'>
                        {riga.aliquota_iva !== null ? `${riga.aliquota_iva}%` : '-'}
                      </TableCell>
                      <TableCell className='text-right font-medium'>
                        {formatCurrency(riga.totale_riga)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totali */}
          <div className='border-t pt-4'>
            <div className='flex justify-end'>
              <div className='w-full max-w-md space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Totale Imponibile:</span>
                  <span className='font-medium'>{formatCurrency(fattura.totale_imponibile)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Totale IVA:</span>
                  <span className='font-medium'>{formatCurrency(fattura.totale_iva)}</span>
                </div>
                <div className='flex justify-between pt-2 border-t text-base font-semibold'>
                  <span>Totale Documento:</span>
                  <span>{formatCurrency(fattura.totale_documento)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note e Metodi Pagamento */}
          {(fattura.note || fattura.metodo_pagamento || fattura.banca_appoggio) && (
            <div className='border-t pt-4 space-y-2 text-sm'>
              {fattura.metodo_pagamento && (
                <div>
                  <span className='text-muted-foreground'>Metodo Pagamento: </span>
                  <span>{fattura.metodo_pagamento}</span>
                </div>
              )}
              {fattura.banca_appoggio && (
                <div>
                  <span className='text-muted-foreground'>Banca Appoggio: </span>
                  <span>{fattura.banca_appoggio}</span>
                </div>
              )}
              {fattura.note && (
                <div>
                  <span className='text-muted-foreground'>Note: </span>
                  <span>{fattura.note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
