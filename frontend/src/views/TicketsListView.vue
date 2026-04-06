<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getTickets, getMyTickets } from '../api/ticketsApi'
import type { Ticket, TicketStatus } from '../api/types'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'

const router = useRouter()
const authStore = useAuthStore()

const tickets = ref<Ticket[]>([])
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const perPage = 10
const totalItems = ref(0)

const statusFilter = ref<{ label: string; value: TicketStatus | '' }>({ label: 'Todos', value: '' })
const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Aberto', value: 'open' as TicketStatus },
  { label: 'Em Progresso', value: 'in_progress' as TicketStatus },
  { label: 'Resolvido', value: 'resolved' as TicketStatus },
  { label: 'Fechado', value: 'closed' as TicketStatus },
]

const sectorMap: Record<string, string> = {
  ti: 'TI',
  rh: 'RH',
  manutencao: 'Manutenção',
  qualidade: 'Qualidade de Produtos',
}

const statusBadge = (status: TicketStatus) => {
  const map: Record<string, { label: string; severity: string }> = {
    open: { label: 'Aberto', severity: 'warn' },
    in_progress: { label: 'Em Progresso', severity: 'info' },
    resolved: { label: 'Resolvido', severity: 'success' },
    closed: { label: 'Fechado', severity: 'secondary' },
  }
  return map[status] || { label: status, severity: 'info' }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

async function fetchTickets(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const role = authStore.user?.role || 'requester'
    const query: Record<string, unknown> = {}
    if (statusFilter.value.value) {
      query.status = statusFilter.value.value
    }
    query.page = page
    query.limit = perPage

    let result: Ticket[]
    if (role === 'requester') {
      result = await getMyTickets()
    } else {
      result = await getTickets()
    }

    // Backend may not paginate — if no pagination metadata, handle all locally
    totalItems.value = result.length
    totalPages.value = Math.ceil(totalItems.value / perPage)
    tickets.value = result.slice((page - 1) * perPage, page * perPage)
  } catch (e: any) {
    error.value = e?.error || 'Erro ao carregar chamados'
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  currentPage.value = page
  fetchTickets(page)
}

function onStatusFilterChange() {
  currentPage.value = 1
  fetchTickets(1)
}

function onRowClick(row: Ticket) {
  router.push(`/tickets/${row.id}`)
}

onMounted(() => fetchTickets())
watch(statusFilter, onStatusFilterChange)
</script>

<template>
  <div class="max-w-[1200px] mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800">
          {{ authStore.userRole() === 'attendant' ? 'Fila de Chamados' : 'Meus Chamados' }}
        </h2>
        <p class="text-sm text-gray-400 mt-1">
          {{ authStore.userRole() === 'attendant' ? 'Chamados do seu setor' : 'Chamados abertos por você' }}
        </p>
      </div>
      <div class="flex gap-3">
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrar por status"
          class="w-[200px]"
        />
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Table -->
    <div v-if="!loading" class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Assunto</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Setor</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Prioridade</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Solicitante</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              @click="onRowClick(ticket)"
              class="border-b border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <td class="px-6 py-4 font-medium text-gray-800">
                {{ (ticket.fieldValues?.assunto || ticket.fieldValues?.assunto_do_problema || 'Sem assunto') as string }}
              </td>
              <td class="px-6 py-4">
                <Tag :value="statusBadge(ticket.status).label" :severity="statusBadge(ticket.status).severity" class="text-xs px-2 py-0.5" />
              </td>
              <td class="px-6 py-4 text-gray-500">
                {{ ticket.helpdesk?.name || sectorMap[ticket.helpdesk?.sectorId || ''] || '—' }}
              </td>
              <td class="px-6 py-4 text-gray-500">
                {{ (ticket.fieldValues?.prioridade || '—') as string }}
              </td>
              <td class="px-6 py-4 text-gray-500">
                {{ ticket.requester?.name || '—' }}
              </td>
              <td class="px-6 py-4 text-gray-400 text-xs">
                {{ formatDate(ticket.createdAt) }}
              </td>
            </tr>
            <tr v-if="tickets.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <i class="pi pi-info-circle text-3xl text-gray-200 mb-2" />
                <p class="text-sm text-gray-400">Nenhum chamado encontrado</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginator -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">
          Mostrando {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, totalItems) }} de {{ totalItems }}
        </span>
        <div class="flex gap-1">
          <Button
            v-for="p in totalPages"
            :key="p"
            :label="String(p)"
            :outlined="currentPage !== p"
            :text="currentPage === p"
            size="small"
            @click="onPageChange(p)"
          />
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-else class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Assunto</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Setor</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Prioridade</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Solicitante</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in 5" :key="i" class="border-b border-gray-50">
            <td class="px-6 py-4" v-for="j in 6" :key="j">
              <Skeleton class="h-4 w-full" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
