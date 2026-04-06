import api from './client'
import type { Ticket, CreateTicketInput, TicketStatus } from './types'

export function createTicket(data: CreateTicketInput): Promise<Ticket> {
  return api.post('/tickets', data).then((r) => r.data)
}

export function getTickets(status?: TicketStatus): Promise<Ticket[]> {
  return api.get('/tickets', { params: status ? { status } : {} }).then((r) => r.data)
}

export function getMyTickets(status?: TicketStatus): Promise<Ticket[]> {
  return api.get('/tickets/mine', { params: status ? { status } : {} }).then((r) => r.data)
}

export function getTicket(id: string): Promise<Ticket> {
  return api.get(`/tickets/${id}`).then((r) => r.data)
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<Ticket> {
  return api.patch(`/tickets/${id}/status`, { status }).then((r) => r.data)
}

export function claimTicket(id: string): Promise<Ticket> {
  return api.post(`/tickets/${id}/claim`).then((r) => r.data)
}

export function cancelTicket(id: string): Promise<void> {
  return api.patch(`/tickets/${id}/cancel`).then(() => undefined)
}
