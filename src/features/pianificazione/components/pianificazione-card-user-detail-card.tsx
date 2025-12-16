import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type UserStats } from './pianificazione-card-utils'
import { Skeleton } from '@/components/ui/skeleton'

interface PianificazioneCardUserDetailCardProps {
  userId: number
  userName: string
  stats: UserStats | null
  isLoading: boolean
}

export function PianificazioneCardUserDetailCard({
  userName,
  stats,
  isLoading,
}: PianificazioneCardUserDetailCardProps) {
  const getSaturationColor = (saturazione: number) => {
    if (saturazione < 80) return 'text-green-600 dark:text-green-400'
    if (saturazione <= 100) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatNumber = (num: number) => {
    return num.toFixed(1)
  }

  return (
    <Card className="hover:shadow-md transition-shadow py-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-2">
        <CardTitle className="text-sm font-medium truncate pr-2">{userName}</CardTitle>
        {isLoading ? (
          <Skeleton className="h-4 w-12 flex-shrink-0" />
        ) : stats ? (
          <span
            className={cn(
              'text-xs font-semibold flex-shrink-0',
              getSaturationColor(stats.saturazione)
            )}
          >
            {formatNumber(stats.saturazione)}%
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-2">
        {isLoading ? (
          <>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </>
        ) : stats ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground truncate pr-2">
                Disponibili
              </span>
              <span className="text-xs font-medium flex-shrink-0">
                {formatNumber(stats.oreDisponibili)}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground truncate pr-2">
                Pianificate
              </span>
              <span className="text-xs font-medium flex-shrink-0">
                {formatNumber(stats.orePianificate)}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground truncate pr-2">
                Rimanenti
              </span>
              <span
                className={cn(
                  'text-xs font-medium flex-shrink-0',
                  stats.oreRimanenti < 0
                    ? 'text-red-600 dark:text-red-400'
                    : ''
                )}
              >
                {formatNumber(stats.oreRimanenti)}h
              </span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

