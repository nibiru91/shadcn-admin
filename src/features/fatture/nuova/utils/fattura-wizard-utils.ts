import { Riga } from '../data/wizard-schema'

/**
 * Calcola il totale di una singola riga
 * Formula: (quantità * prezzo_unitario) * (1 - sconto_percentuale / 100)
 */
export function calcolaTotaleRiga(riga: Riga): number {
  const quantita = riga.quantita ?? 0
  const prezzoUnitario = riga.prezzo_unitario ?? 0
  const sconto = riga.sconto_percentuale ?? 0
  
  const totale = quantita * prezzoUnitario
  const totaleConSconto = totale * (1 - sconto / 100)
  
  return Math.round(totaleConSconto * 100) / 100 // Arrotonda a 2 decimali
}

/**
 * Calcola l'IVA di una singola riga
 * Formula: totale_riga * (aliquota_iva / 100)
 */
export function calcolaIvaRiga(riga: Riga): number {
  const totaleRiga = calcolaTotaleRiga(riga)
  const aliquotaIva = riga.aliquota_iva ?? 0
  
  const iva = totaleRiga * (aliquotaIva / 100)
  return Math.round(iva * 100) / 100 // Arrotonda a 2 decimali
}

/**
 * Calcola i totali della fattura
 */
export function calcolaTotaliFattura(righe: Riga[]) {
  const totaleImponibile = righe.reduce((sum, riga) => {
    return sum + calcolaTotaleRiga(riga)
  }, 0)
  
  const totaleIva = righe.reduce((sum, riga) => {
    return sum + calcolaIvaRiga(riga)
  }, 0)
  
  const totaleDocumento = totaleImponibile + totaleIva
  
  return {
    totale_imponibile: Math.round(totaleImponibile * 100) / 100,
    totale_iva: Math.round(totaleIva * 100) / 100,
    totale_documento: Math.round(totaleDocumento * 100) / 100,
  }
}

/**
 * Valida che non ci siano righe vuote (senza descrizione)
 */
export function validaRighe(righe: Riga[]): { valid: boolean; error?: string } {
  if (righe.length === 0) {
    return { valid: false, error: 'Almeno una riga obbligatoria' }
  }
  
  const righeVuote = righe.filter((r) => !r.descrizione || r.descrizione.trim() === '')
  if (righeVuote.length > 0) {
    return { valid: false, error: 'Rimuovere le righe vuote prima di salvare' }
  }
  
  return { valid: true }
}

/**
 * Genera un ID temporaneo per una riga
 */
export function generaIdRiga(): string {
  return `riga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

