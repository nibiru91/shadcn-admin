'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { RiepilogoStatsCard } from './components/riepilogo-stats-card'
import { RiepilogoDettagli } from './components/riepilogo-dettagli'
import {
  fetchPianificazioniTotali,
  fetchTimesheetTotali,
  fetchFattureTotali,
  fetchCommessaDettagli,
} from './utils/riepilogo-data'

export function CommessaRiepilogo() {
  const search = useSearch({ from: '/_authenticated/commesse/riepilogo/' })
  const commessaId = search.commessaId ? parseInt(search.commessaId, 10) : null

  // Carica tutti i dati in parallelo
  const { data: commessa, isLoading: isLoadingCommessa } = useQuery({
    queryKey: ['commessa-dettagli', commessaId],
    queryFn: () => fetchCommessaDettagli(commessaId!),
    enabled: !!commessaId,
  })

  const { data: pianificazioni, isLoading: isLoadingPianificazioni } = useQuery({
    queryKey: ['pianificazioni-totali', commessaId],
    queryFn: () => fetchPianificazioniTotali(commessaId!),
    enabled: !!commessaId,
  })

  const { data: timesheet, isLoading: isLoadingTimesheet } = useQuery({
    queryKey: ['timesheet-totali', commessaId],
    queryFn: () => fetchTimesheetTotali(commessaId!),
    enabled: !!commessaId,
  })

  const { data: fatture, isLoading: isLoadingFatture } = useQuery({
    queryKey: ['fatture-totali', commessaId],
    queryFn: () => fetchFattureTotali(commessaId!),
    enabled: !!commessaId,
  })

  const isLoading =
    isLoadingCommessa ||
    isLoadingPianificazioni ||
    isLoadingTimesheet ||
    isLoadingFatture

  if (!commessaId) {
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
        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='p-8 text-center text-muted-foreground'>
            Nessuna commessa selezionata
          </div>
        </Main>
      </>
    )
  }

  if (isLoading) {
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
        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='p-8 text-center'>Caricamento riepilogo...</div>
        </Main>
      </>
    )
  }

  if (!commessa) {
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
        <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
          <div className='p-8 text-center text-red-500'>
            Commessa non trovata
          </div>
        </Main>
      </>
    )
  }

  // Calcola saturazione per pianificazioni
  const saturazionePianificazioni =
    commessa.ore_previste && commessa.ore_previste > 0
      ? (pianificazioni?.totale_ore || 0) / commessa.ore_previste * 100
      : undefined

  // Calcola saturazione per timesheet (usando ore_lavorate)
  const saturazioneTimesheet =
    commessa.ore_previste && commessa.ore_previste > 0
      ? (timesheet?.totale_ore_lavorate || 0) / commessa.ore_previste * 100
      : undefined

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

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Riepilogo Commessa: {commessa.title}
          </h2>
          <p className='text-muted-foreground'>
            Statistiche aggregate e dettagli della commessa
          </p>
        </div>

        {/* Grid a 4 colonne per le statistiche */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <RiepilogoStatsCard
            title='Pianificazioni Collegate'
            value={`${(pianificazioni?.totale_ore || 0).toFixed(2)} ore`}
            subtitle='Totale ore pianificate'
            saturazione={saturazionePianificazioni}
            orePreviste={commessa.ore_previste}
          />
          <RiepilogoStatsCard
            title='Timesheet Collegati'
            value={`${(timesheet?.totale_ore_lavorate || 0).toFixed(2)} ore`}
            subtitle={`Billable: ${(timesheet?.totale_ore_billable || 0).toFixed(2)} ore`}
            saturazione={saturazioneTimesheet}
            orePreviste={commessa.ore_previste}
          />
          <RiepilogoStatsCard
            title='Righe Fatture Collegate'
            value={formatCurrency(fatture?.totale_netto || 0)}
            subtitle='Totale netto righe'
          />
          <RiepilogoStatsCard
            title='Funzionalità Futura'
            value='-'
            subtitle='In sviluppo'
          />
        </div>

        {/* Dettagli commessa */}
        <RiepilogoDettagli commessa={commessa} />
      </Main>
    </>
  )
}

function formatCurrency(value: number): string {
  return `€ ${value.toFixed(2)}`
}

