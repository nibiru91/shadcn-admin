import { z } from 'zod'

export const userSchema = z.object({
  id: z.coerce.number().optional(), // bigint in PostgreSQL, coerced to number
  created_at: z.string().optional().nullable(), // ISO date string
  auth_id: z.string().uuid().optional().nullable(),
  name: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  ruolo: z.string().optional().nullable(), // Enum ruoli
})

export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
