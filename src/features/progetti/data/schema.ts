import { z } from 'zod'

export const prioritaSchema = z.enum(['bassa', 'media', 'alta', 'critica'])
export const coloreSchema = z.enum(['rosso', 'blu', 'verde', 'giallo', 'viola', 'arancione', 'rosa', 'ciano']).nullable().optional()

export const taskSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  descrizione: z.string().nullable().optional(),
  priorità: prioritaSchema,
  colore: coloreSchema.default(null),
  data_inizio: z.coerce.date(),
  data_fine: z.coerce.date(),
  ore_previste: z.number().min(0).nullable().optional(),
  task_padre_id: z.string().uuid().nullable().optional(),
  dipendenze: z.array(z.string().uuid()).default([]),
  collapsed: z.boolean().default(false),
  created_at: z.coerce.date().optional(),
})

export type Priorita = z.infer<typeof prioritaSchema>
export type Colore = z.infer<typeof coloreSchema>
export type Task = z.infer<typeof taskSchema>

export const taskFormSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio'),
  descrizione: z.string().nullable().optional(),
  priorità: prioritaSchema,
  colore: coloreSchema.optional(),
  data_inizio: z.coerce.date(),
  data_fine: z.coerce.date(),
  ore_previste: z.number().min(0).nullable().optional(),
  task_padre_id: z.string().uuid().nullable().optional(),
  dipendenze: z.array(z.string().uuid()).default([]),
}).refine((data) => {
  return data.data_fine >= data.data_inizio
}, {
  message: 'La data fine deve essere successiva o uguale alla data inizio',
  path: ['data_fine'],
})

export type TaskFormData = z.input<typeof taskFormSchema>

