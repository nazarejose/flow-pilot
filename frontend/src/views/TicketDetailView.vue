<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getTicket, updateTicketStatus, claimTicket } from '../api/ticketsApi'
import { getComments } from '../api/commentsApi'
import type { Ticket, TicketStatus, Comment } from '../api/types'
import CommentInput from '../components/CommentInput.vue'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const id = route.params.id as string

const ticket = ref<Ticket | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

const statusUpdating = ref(false)

const role = authStore.user?.role || 'requester'
const isStaff = role === 'attendant' || role === 'admin'

// Status helpers
const statusLabel = (s: string) =>
  ({ open: 'Aberto', in_progress: 'Em Andamento', resolved: 'Resolvido', closed: 'Fechado' })[s] || s

const statusSeverity = (s: string) =>
  ({ open: 'warn', in_progress: 'info', resolved: 'success', closed: 'secondary' })[s] || 'info'

const priorityLabel = (p?: string) => {
  if (!p) return 'Média'
  const lower = String(p).toLowerCase()
  return ({ baixa: 'Baixa', média: 'Média', media: 'Média', alta: 'Alta', crítica: 'Crítica', critica: 'Crítica', critical: 'Crítica' })[lower] || p
}

const prioritySeverity = (p?: string) => {
  if (!p) return 'info'
  const lower = String(p).toLowerCase()
  return ({ baixa: 'secondary', média: 'info', media: 'info', alta: 'warn', crítica: 'danger', critica: 'danger', critical: 'danger' })[lower] || 'info'
}

const getInitials = (name?: string) => {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const getSectorName = () => ticket.value?.helpdesk?.name || '—'

// Activity: merge comments with status change events
const activityItems = computed(() => {
  if (!ticket.value) return []
  const items: Array<{ type: 'system'; date: string; text: string } | { type: 'comment'; data: Comment }> = []

  // Add created event
  items.push({
    type: 'system',
    date: ticket.value.createdAt,
    text: `${ticket.value.requester?.name || ticket.value.requester?.email || 'Solicitante'} abriu esse chamado`,
  })

  // Add comments in order
  for (const c of comments.value) {
    items.push({ type: 'comment', data: c })
  }

  return items
})

// Status options for staff
const statusOptions = [
  { label: 'Aberto', value: 'open' as TicketStatus },
  { label: 'Em Andamento', value: 'in_progress' as TicketStatus },
  { label: 'Resolvido', value: 'resolved' as TicketStatus },
  { label: 'Fechado', value: 'closed' as TicketStatus },
]

async function fetchTicket() {
  try {
    ticket.value = await getTicket(id)
  } catch (e: any) {
    if (e?.statusCode === 404) notFound.value = true
    else error.value = e?.error || 'Erro ao carregar chamado'
  }
}

async function fetchComments() {
  try {
    comments.value = await getComments(id)
  } catch { /* silent */ }
}

async function handleStatusChange(newStatus: TicketStatus) {
  if (!ticket.value || newStatus === ticket.value.status) return
  statusUpdating.value = true
  try {
    const updated = await updateTicketStatus(id, newStatus)
    ticket.value = updated
    toast.add({ severity: 'success', summary: 'Status atualizado', detail: `Status alterado para "${statusLabel(newStatus)}"`, life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível atualizar o status.', life: 3000 })
  } finally {
    statusUpdating.value = false
  }
}

async function handleClaim() {
  if (!ticket.value) return
  try {
    const updated = await claimTicket(id)
    ticket.value = updated
    toast.add({ severity: 'success', summary: 'Chamado assumido', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível assumir o chamado.', life: 3000 })
  }
}

// Highlight @mentions in comment content
function highlightMentions(content: string) {
  const parts = content.split(/(@\S+)/g)
  return parts.map((part) => {
    if (part.startsWith('@') && part.length > 1) {
      return `<span class="mention-highlight">${part}</span>`
    }
    return part.replace(/\n/g, '<br>')
  }).join('')
}

onMounted(async () => {
  await fetchTicket()
  await fetchComments()
  loading.value = false
})
</script>

<template>
  <main class="w-full max-w-[1100px] mx-auto pb-12 px-3 sm:px-4" aria-label="Detalhe do chamado">
    <Toast />

    <!-- Back button -->
    <div class="mb-4 sm:mb-6">
      <button @click="router.back()" class="text-sm text-blue-500 hover:underline flex items-center gap-1">
        <i class="pi pi-arrow-left text-xs" aria-hidden="true" /> Voltar
      </button>
    </div>

    <!-- Not found -->
    <div v-if="notFound" class="text-center py-12 sm:py-16" role="alert">
      <i class="pi pi-times-circle text-5xl text-gray-200 mb-3" aria-hidden="true" />
      <h2 class="text-lg sm:text-xl font-bold text-gray-700">Chamado não encontrado</h2>
      <p class="text-sm text-gray-400 mt-2">O chamado pode ter sido removido ou você não tem acesso.</p>
      <button @click="router.push('/tickets')" class="text-sm text-blue-500 hover:underline mt-3 inline-block">Voltar para lista</button>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6" role="alert" aria-live="assertive">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="space-y-4" aria-busy="true">
      <div class="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-100" />
          <div class="flex-1"><div class="h-4 bg-gray-100 rounded w-48" /></div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 animate-pulse"><div class="h-4 bg-gray-100 rounded w-3/4" /></div>
        </div>
        <div class="animate-pulse"><div class="bg-white rounded-xl p-4 sm:p-6 border border-gray-100"><div class="h-4 bg-gray-100 rounded w-full" /></div></div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="ticket">
      <!-- Header card -->
      <div class="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 mb-5 sm:mb-6">
        <!-- Requester info -->
        <div class="flex items-center gap-3 mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-gray-100">
          <div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {{ getInitials(ticket.requester?.name || ticket.requester?.email) }}
          </div>
          <div class="min-w-0">
            <span class="text-sm font-semibold text-gray-800 truncate">{{ ticket.requester?.name || ticket.requester?.email }}</span>
            <span class="hidden sm:inline text-sm text-gray-500"> criou esse chamado em </span>
            <div class="sm:hidden text-xs text-gray-500">{{ formatDate(ticket.createdAt) }}</div>
            <span class="hidden sm:inline text-sm font-medium text-gray-700">{{ formatDate(ticket.createdAt) }}</span>
          </div>
        </div>

        <!-- Ticket info panel (always visible) -->
        <div>
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Informações do Chamado</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div>
            <span class="block text-[10px] font-bold text-gray-400 uppercase">Setor</span>
            <span class="text-gray-700">{{ getSectorName() }}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-gray-400 uppercase">Aberto em</span>
            <span class="text-gray-700">{{ formatDate(ticket.createdAt) }}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-gray-400 uppercase">Atualizado em</span>
            <span class="text-gray-700">{{ formatDate(ticket.updatedAt) }}</span>
          </div>
          <div v-if="ticket.closedAt">
            <span class="block text-[10px] font-bold text-gray-400 uppercase">Fechado em</span>
            <span class="text-gray-700">{{ formatDate(ticket.closedAt) }}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-gray-400 uppercase">Solicitante</span>
            <span class="text-gray-700 truncate block">{{ ticket.requester?.email || '—' }}</span>
          </div>
          <div v-if="ticket.assignedTo">
            <span class="block text-[10px] font-bold text-gray-400 uppercase">Atendente</span>
            <span class="text-gray-700 truncate block">{{ ticket.assignedTo.name || ticket.assignedTo.email }}</span>
          </div>
        </div>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <!-- LEFT: Activity feed -->
        <div class="lg:col-span-8">
          <h3 class="text-base font-bold text-gray-800 mb-4">Atividade</h3>

          <!-- Activity items -->
          <div class="space-y-2 mb-6" role="feed" aria-label="Histórico de atividade do chamado">
            <div v-for="(item, idx) in activityItems" :key="idx" class="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
              <!-- Comment -->
              <template v-if="item.type === 'comment'">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                       :class="item.data.author?.name ? 'bg-blue-500' : 'bg-gray-300'">
                    {{ getInitials(item.data.author?.name || item.data.author?.email) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-gray-800">{{ item.data.author?.name || item.data.author?.email || 'Usuário' }}</span>
                      <span class="text-xs text-gray-400">{{ formatDate(item.data.createdAt) }}</span>
                    </div>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap break-words" v-html="highlightMentions(item.data.content)"></p>
                  </div>
                </div>
              </template>
              <!-- System event -->
              <template v-else>
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <i class="pi pi-info text-gray-400 text-sm" aria-hidden="true" />
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">{{ item.text }}</p>
                    <p class="text-xs text-gray-300 mt-0.5">{{ formatDate(item.date) }}</p>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Comment input -->
          <CommentInput :ticket-id="id" @comment-posted="fetchComments" />
        </div>

        <!-- RIGHT: Sidebar -->
        <aside class="lg:col-span-4" aria-label="Informações do chamado">
          <div class="space-y-6">
            <!-- Status -->
            <div>
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Status</h4>
              <Tag :value="statusLabel(ticket.status)" :severity="statusSeverity(ticket.status)" class="text-xs" />
              <div v-if="isStaff" class="mt-3">
                <Select
                  v-model="ticket.status"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full text-sm"
                  @change="handleStatusChange(ticket.status)"
                  :disabled="statusUpdating"
                  aria-label="Alterar status do chamado"
                />
              </div>
            </div>

            <!-- Actions -->
            <div v-if="isStaff" class="border-t border-gray-100 pt-4">
              <div class="space-y-2">
                <button
                  v-if="!ticket.assignedTo"
                  @click="handleClaim"
                  class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 transition-colors w-full text-left"
                >
                  <i class="pi pi-check" style="font-size: 0.8rem" aria-hidden="true" /> Assumir chamado
                </button>
                <button
                  v-if="ticket.status === 'open' || ticket.status === 'in_progress'"
                  @click="handleStatusChange('resolved')"
                  class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500 transition-colors w-full text-left"
                >
                  <i class="pi pi-directions" style="font-size: 0.8rem" aria-hidden="true" /> Resolver chamado
                </button>
                <button
                  v-if="ticket.status !== 'closed'"
                  @click="handleStatusChange('closed')"
                  class="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 transition-colors w-full text-left"
                >
                  <i class="pi pi-times" style="font-size: 0.8rem" aria-hidden="true" /> Fechar chamado
                </button>
              </div>
            </div>

            <!-- Ticket type -->
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de solicitação</h4>
              <div class="flex items-center gap-2 text-sm">
                <i class="pi pi-tag text-gray-400" aria-hidden="true" />
                <span class="text-gray-700">{{ getSectorName() }}</span>
              </div>
            </div>

            <!-- Priority -->
            <div>
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Prioridade</h4>
              <Tag :value="priorityLabel(ticket.fieldValues?.prioridade as string)" :severity="prioritySeverity(ticket.fieldValues?.prioridade as string)" class="text-xs" />
            </div>

            <!-- Date -->
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Criado em</h4>
              <span class="text-sm text-gray-700">{{ formatDate(ticket.createdAt) }}</span>
            </div>

            <!-- Requester -->
            <div>
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Solicitante</h4>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {{ getInitials(ticket.requester?.name || ticket.requester?.email) }}
                </div>
                <div>
                  <span class="text-sm text-gray-700">{{ ticket.requester?.name || ticket.requester?.email }}</span>
                  <div class="text-xs text-gray-400">Criador</div>
                </div>
              </div>
            </div>

            <!-- Assigned to -->
            <div v-if="ticket.assignedTo">
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Atendente</h4>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {{ getInitials(ticket.assignedTo.name || ticket.assignedTo.email) }}
                </div>
                <div>
                  <span class="text-sm text-gray-700">{{ ticket.assignedTo.name || ticket.assignedTo.email }}</span>
                  <div class="text-xs text-gray-400">Responsável</div>
                </div>
              </div>
            </div>

            <!-- Dynamic field values -->
            <div v-if="Object.entries(ticket.fieldValues).filter(([k]) => k !== 'assunto' && k !== 'assunto_do_problema' && k !== 'prioridade').length" class="border-t border-gray-100 pt-4">
              <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Detalhes</h4>
              <div class="space-y-2">
                <div v-for="[key, val] in Object.entries(ticket.fieldValues).filter(([k]) => k !== 'assunto' && k !== 'assunto_do_problema' && k !== 'prioridade')" :key="key">
                  <span class="block text-[10px] font-bold text-gray-400 uppercase">{{ key.replace(/_/g, ' ') }}</span>
                  <span class="text-sm text-gray-700">{{ val ?? '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
:deep(.mention-highlight) {
  color: #3b82f6;
  font-weight: 600;
}
</style>
