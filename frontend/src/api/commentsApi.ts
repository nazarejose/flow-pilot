import api from './client'
import type { Comment } from './types'

export function getComments(ticketId: string): Promise<Comment[]> {
  return api.get(`/tickets/${ticketId}/comments`).then((r) => r.data)
}

export function createComment(ticketId: string, content: string): Promise<Comment> {
  return api.post(`/tickets/${ticketId}/comments`, { content }).then((r) => r.data)
}
