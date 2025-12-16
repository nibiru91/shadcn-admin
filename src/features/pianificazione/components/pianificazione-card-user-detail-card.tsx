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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{userName}</CardTitle>
        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : stats ? (
          <span
            className={cn(
              'text-sm font-semibold',
              getSaturationColor(stats.saturazione)
            )}
          >
            {formatNumber(stats.saturazione)}%
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </>
        ) : stats ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Ore effettive disponibili
              </span>
              <span className="text-sm font-medium">
                {formatNumber(stats.oreDisponibili)}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Ore Pianificate
              </span>
              <span className="text-sm font-medium">
                {formatNumber(stats.orePianificate)}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Ore Rimanenti
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
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

