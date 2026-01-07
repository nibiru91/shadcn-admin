import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Profilo'
      desc="Questo è come gli altri vedranno il tuo profilo nell'app."
    >
      <ProfileForm />
    </ContentSection>
  )
}
