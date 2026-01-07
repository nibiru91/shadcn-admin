import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Azienda'
      desc='Aggiorna i dettagli della tua azienda.'
    >
      <AccountForm />
    </ContentSection>
  )
}
