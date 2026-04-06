export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  sectorId: string
}

export interface Helpdesk {
  id: string
  name: string
  companyId: string
  sectorId: string
  schema: FieldSchema[]
  published: boolean
  createdAt: string
}

export interface FieldSchema {
  name: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox'
  label: string
  required: boolean
  options?: string[]
}

export interface Ticket {
  id: string
  companyId: string
  requesterId: string
  assignedTo: User | null
  assignedToId: string | null
  status: TicketStatus
  helpdeskId: string
  fieldValues: Record<string, unknown>
  createdAt: string
  updatedAt: string
  closedAt: string | null
  helpdesk?: {
    id: string
    name: string
    sectorId: string
  }
  requester?: {
    name: string
    email: string
  }
}

export interface CreateTicketInput {
  helpdeskId: string
  fieldValues: Record<string, unknown>
}

export interface UpdateTicketStatusInput {
  status: TicketStatus
}

export interface Comment {
  id: string
  ticketId: string
  authorId: string
  content: string
  createdAt: string
  author?: {
    name: string
    email: string
  }
}

export interface CreateCommentInput {
  content: string
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  success: false
  error: string
  statusCode?: number
}
