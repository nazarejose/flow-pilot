import api from './client'
import type { Helpdesk } from './types'

export function getPublishedHelpdesks(): Promise<Helpdesk[]> {
  return api.get('/helpdesks/mine').then((r) => r.data)
}

export function getHelpdesk(id: string): Promise<Helpdesk> {
  return api.get(`/helpdesks/${id}`).then((r) => r.data)
}
