import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type StepTipoFatturaProps = {
  tipoFattura: 'emessa' | 'ricevuta' | undefined
  onTipoFatturaChange: (tipo: 'emessa' | 'ricevuta') => void
}

export function StepTipoFattura({ tipoFattura, onTipoFatturaChange }: StepTipoFatturaProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Tipo Fattura</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Seleziona il tipo di fattura che vuoi creare
        </p>
      </div>
      <RadioGroup
        value={tipoFattura}
        onValueChange={(value) => {
          if (value === 'emessa' || value === 'ricevuta') {
            onTipoFatturaChange(value)
          }
        }}
      >
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='emessa' id='emessa' />
          <Label htmlFor='emessa' className='cursor-pointer'>
            Fattura Emessa
          </Label>
        </div>
        <div className='flex items-center space-x-2'>
          <RadioGroupItem value='ricevuta' id='ricevuta' />
          <Label htmlFor='ricevuta' className='cursor-pointer'>
            Fattura Ricevuta
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

