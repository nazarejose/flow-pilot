import api from './client'
import type { User } from './types'

export function getUsers(): Promise<User[]> {
  return api.get('/users').then((r) => r.data)
}
