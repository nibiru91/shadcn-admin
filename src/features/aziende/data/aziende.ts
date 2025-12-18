import { faker } from '@faker-js/faker'
import { Azienda } from './schema'

// Set a fixed seed for consistent data generation
faker.seed(67890)

export const aziende: Azienda[] = Array.from({ length: 50 }, (_, idx) => {
  const companyName = faker.company.name()
  const isCustomer = faker.datatype.boolean()
  const isSupplier = faker.datatype.boolean()

  return {
    id: idx + 1,
    ragione_sociale: companyName,
    description: faker.company.buzzPhrase(),
    partita_iva: faker.string.alphanumeric(11).toUpperCase(),
    codice_fiscale: faker.string.alphanumeric(16).toUpperCase(),
    address: faker.location.streetAddress(),
    cap: faker.location.zipCode(),
    city: faker.location.city(),
    province: faker.location.state({ abbreviated: true }),
    country: faker.location.country(),
    is_active: faker.datatype.boolean(),
    is_customer: isCustomer,
    is_supplier: isSupplier,
    created_at: faker.date.past().toISOString(),
  }
})
