'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type User = {
  id: number
  name: string | null
  surname: string | null
}

async function fetchUsers() {
  const { data, error } = await supabase
    .from('users_profile')
    .select('id, name, surname')
    .order('surname', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data || []) as User[]
}

function getUserDisplayName(user: User): string {
  const parts: string[] = []
  if (user.surname) parts.push(user.surname)
  if (user.name) parts.push(user.name)
  return parts.length > 0 ? parts.join(' ') : `User #${user.id}`
}

interface UserComboboxProps {
  value?: number | null
  onValueChange: (value: number | null) => void
  placeholder?: string
}

export function UserCombobox({
  value,
  onValueChange,
  placeholder = 'Seleziona utente...',
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-for-combobox'],
    queryFn: fetchUsers,
  })

  const selectedUser = users.find((u) => u.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {selectedUser ? getUserDisplayName(selectedUser) : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput placeholder='Cerca utente...' />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Caricamento...' : 'Nessun utente trovato.'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onValueChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                Nessuno
              </CommandItem>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={getUserDisplayName(user)}
                  onSelect={() => {
                    onValueChange(user.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === user.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {getUserDisplayName(user)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

