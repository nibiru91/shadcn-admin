'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ExternalLink as Link } from 'lucide-react'

type RiepilogoStatsCardProps = {
  title: string
  value: string | number
  subtitle?: string
  saturazione?: number // Percentuale 0-100
  orePreviste?: number | null
  link?: string | null
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  return (
    <div className='w-full h-2 bg-muted rounded-full overflow-hidden'>
      <div
        className={cn('h-full transition-all duration-300', className)}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}

function getSaturazioneColor(saturazione: number): string {
  if (saturazione < 50) return 'bg-green-500'
  if (saturazione < 80) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function RiepilogoStatsCard({
  title,
  value,
  subtitle,
  saturazione,
  orePreviste,
  link,
}: RiepilogoStatsCardProps) {
  const showSaturazione = saturazione !== undefined && orePreviste !== null && orePreviste > 0
  const saturazioneColor = showSaturazione ? getSaturazioneColor(saturazione) : ''

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{title}
        {/*<Link href={link}>{link}</Link>*/}
        {link && <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-muted-foreground hover:text-primary transition-colors"
        >
        <Link size={18} />
        </a>}

      </CardTitle>

      </CardHeader>
      <CardContent className='space-y-3'>
        <div>
          <div className='text-2xl font-bold'>{value}</div>
          {subtitle && <div className='text-sm text-muted-foreground mt-1'>{subtitle}</div>}
        </div>
        {showSaturazione && (
          <div className='space-y-1'>
            <div className='flex justify-between text-xs text-muted-foreground'>
              <span>Saturazione</span>
              <span>{saturazione.toFixed(1)}%</span>
            </div>
            <ProgressBar value={saturazione} className={saturazioneColor} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}


