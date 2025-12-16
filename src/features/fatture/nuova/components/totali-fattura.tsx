'use client'

import { Riga } from '../data/wizard-schema'
import { calcolaTotaliFattura } from '../utils/fattura-wizard-utils'

type TotaliFatturaProps = {
  righe: Riga[]
}

export function TotaliFattura({ righe }: TotaliFatturaProps) {
  const totali = calcolaTotaliFattura(righe)

  return (
    <div className='border rounded-lg p-4 bg-muted/50'>
      <h3 className='text-lg font-semibold mb-4'>Totali Fattura</h3>
      <div className='space-y-2'>
        <div className='flex justify-between'>
          <span className='text-sm text-muted-foreground'>Totale Imponibile:</span>
          <span className='font-medium'>€ {totali.totale_imponibile.toFixed(2)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-sm text-muted-foreground'>Totale IVA:</span>
          <span className='font-medium'>€ {totali.totale_iva.toFixed(2)}</span>
        </div>
        <div className='flex justify-between pt-2 border-t'>
          <span className='text-base font-semibold'>Totale Documento:</span>
          <span className='text-lg font-bold'>€ {totali.totale_documento.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

