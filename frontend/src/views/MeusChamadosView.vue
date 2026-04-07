<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getTickets, getMyTickets } from '../api/ticketsApi'
import type { Ticket, TicketStatus } from '../api/types'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const router = useRouter()
const authStore = useAuthStore()

const myTickets = ref<Ticket[]>([])
const allTickets = ref<Ticket[]>([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref<TicketStatus | ''>('')
const activeTab = ref('meus')

const role = authStore.user?.role || 'requester'
const isStaff = role === 'attendant' || role === 'admin'

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Aberto', value: 'open' },
  { label: 'Em Progresso', value: 'in_progress' },
  { label: 'Resolvido', value: 'resolved' },
  { label: 'Fechado', value: 'closed' },
]

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
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getInitials = (name?: string) => {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

const getSubject = (ticket: Ticket) => {
  const fv = ticket.fieldValues
  return (fv?.assunto || fv?.assunto_do_problema || 'Sem assunto') as string
}

const getSectorName = (ticket: Ticket) => {
  return ticket.helpdesk?.name || 'Sem setor'
}

const filteredTickets = (source: Ticket[]) => {
  let result = source
  if (statusFilter.value) {
    result = result.filter((t) => t.status === statusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t) => {
      const subject = getSubject(t).toLowerCase()
      return subject.includes(q) || t.id.slice(0, 8).toLowerCase().includes(q)
    })
  }
  return result
}

async function fetchTickets() {
  loading.value = true
  try {
    if (!isStaff) {
      myTickets.value = await getMyTickets()
    } else {
      const [mine, all] = await Promise.all([getMyTickets(), getTickets()])
      myTickets.value = mine
      allTickets.value = all
    }
  } catch {
    // error handled via empty state
  } finally {
    loading.value = false
  }
}

function navigateToTicket(id: string) {
  router.push(`/tickets/${id}`)
}

onMounted(() => {
  fetchTickets()
})
</script>

<template>
  <main class="w-full max-w-[1200px] mx-auto px-0 sm:px-2" aria-label="Lista de chamados">
    <div class="flex items-center justify-between mb-5 sm:mb-6">
      <div>
        <h2 class="text-lg sm:text-xl font-bold text-gray-800">Meus Chamados</h2>
        <p class="text-xs sm:text-sm text-gray-400 mt-1">
          {{ isStaff ? 'Gerencie seus chamados e a fila de atendimento' : 'Chamados abertos por voc\u00ea' }}
        </p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5 sm:mb-6">
      <IconField class="w-full sm:w-auto">
        <InputIcon>
          <i class="pi pi-search" aria-hidden="true" />
        </InputIcon>
        <InputText
          v-model="searchQuery"
          placeholder="Buscar por assunto ou ID"
          class="w-full sm:w-[280px]"
          aria-label="Buscar chamados"
        />
      </IconField>
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Status"
        class="w-full sm:w-[200px]"
        aria-label="Filtrar por status"
      />
    </div>

    <!-- Requester: direct card grid -->
    <template v-if="!isStaff">
      <!-- Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" aria-busy="true">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl shadow p-4 sm:p-5">
          <Skeleton class="h-4 w-20 mb-3" />
          <Skeleton class="h-5 w-full mb-2" />
          <Skeleton class="h-4 w-32 mb-3" />
          <Skeleton class="h-4 w-full mb-2" />
          <Skeleton class="h-3 w-24" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredTickets(myTickets).length === 0" class="text-center py-12 sm:py-16 px-4">
        <i class="pi pi-inbox text-5xl text-gray-200 mb-3 block mx-auto" aria-hidden="true" />
        <p class="text-gray-400 text-sm">Nenhum chamado encontrado</p>
        <Button label="Abrir novo chamado" icon="pi pi-plus" class="mt-4" @click="router.push('/tickets/new')" />
      </div>

      <!-- Card grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div
          v-for="ticket in filteredTickets(myTickets)"
          :key="ticket.id"
          role="link"
          tabindex="0"
          :aria-label="`Chamado: ${getSubject(ticket)}, status: ${statusBadge(ticket.status).label}`"
          class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-blue-200 border border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="navigateToTicket(ticket.id)"
          @keydown.enter="navigateToTicket(ticket.id)"
        >
          <div class="flex items-center justify-between mb-3">
            <Tag :value="statusBadge(ticket.status).label" :severity="statusBadge(ticket.status).severity" class="text-xs px-2 py-0.5" />
            <span class="text-xs text-gray-400 font-mono">#{{ ticket.id.slice(0, 8).toUpperCase() }}</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-tag text-xs text-gray-400" aria-hidden="true" />
            <span class="text-sm text-gray-500">{{ getSectorName(ticket) }}</span>
          </div>
          <h3 class="font-semibold text-gray-800 mb-3 line-clamp-2">{{ getSubject(ticket) }}</h3>
          <div class="flex items-center justify-between pt-3 border-t border-gray-50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                {{ getInitials(ticket.requester?.name || ticket.requester?.email || '?') }}
              </div>
              <span class="text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[120px]">{{ ticket.requester?.email || '—' }}</span>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0">{{ formatDate(ticket.createdAt) }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Attendant/Admin: Tabs -->
    <template v-else>
      <!-- Skeleton for both tabs -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" aria-busy="true">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl shadow p-4 sm:p-5">
          <Skeleton class="h-4 w-20 mb-3" />
          <Skeleton class="h-5 w-full mb-2" />
          <Skeleton class="h-4 w-32 mb-3" />
          <Skeleton class="h-4 w-full mb-2" />
          <Skeleton class="h-3 w-24" />
        </div>
      </div>

      <div v-else class="px-0 sm:px-2">
        <Tabs :value="activeTab">
          <TabList>
            <Tab value="meus">Meus Chamados</Tab>
            <Tab value="fila">Fila de Atendimento</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="meus">
              <div v-if="filteredTickets(myTickets).length === 0" class="text-center py-12 sm:py-16 px-4">
                <i class="pi pi-inbox text-5xl text-gray-200 mb-3 block mx-auto" aria-hidden="true" />
                <p class="text-gray-400 text-sm">Nenhum chamado encontrado</p>
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-2">
                <div
                  v-for="ticket in filteredTickets(myTickets)"
                  :key="ticket.id"
                  role="link"
                  tabindex="0"
                  :aria-label="`Chamado: ${getSubject(ticket)}, status: ${statusBadge(ticket.status).label}`"
                  class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-blue-200 border border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="navigateToTicket(ticket.id)"
                  @keydown.enter="navigateToTicket(ticket.id)"
                >
                  <div class="flex items-center justify-between mb-3">
                    <Tag :value="statusBadge(ticket.status).label" :severity="statusBadge(ticket.status).severity" class="text-xs px-2 py-0.5" />
                    <span class="text-xs text-gray-400 font-mono">#{{ ticket.id.slice(0, 8).toUpperCase() }}</span>
                  </div>
                  <div class="flex items-center gap-2 mb-2">
                    <i class="pi pi-tag text-xs text-gray-400" aria-hidden="true" />
                    <span class="text-sm text-gray-500">{{ getSectorName(ticket) }}</span>
                  </div>
                  <h3 class="font-semibold text-gray-800 mb-3 line-clamp-2">{{ getSubject(ticket) }}</h3>
                  <div class="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                        {{ getInitials(ticket.requester?.name || ticket.requester?.email || '?') }}
                      </div>
                      <span class="text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[120px]">{{ ticket.requester?.email || '—' }}</span>
                    </div>
                    <span class="text-xs text-gray-400 flex-shrink-0">{{ formatDate(ticket.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </TabPanel>
            <TabPanel value="fila">
              <div v-if="filteredTickets(allTickets).length === 0" class="text-center py-12 sm:py-16 px-4">
                <i class="pi pi-inbox text-5xl text-gray-200 mb-3 block mx-auto" aria-hidden="true" />
                <p class="text-gray-400 text-sm">Nenhum chamado na fila</p>
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-2">
                <div
                  v-for="ticket in filteredTickets(allTickets)"
                  :key="ticket.id"
                  role="link"
                  tabindex="0"
                  :aria-label="`Chamado: ${getSubject(ticket)}, status: ${statusBadge(ticket.status).label}`"
                  class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-blue-200 border border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="navigateToTicket(ticket.id)"
                  @keydown.enter="navigateToTicket(ticket.id)"
                >
                  <div class="flex items-center justify-between mb-3">
                    <Tag :value="statusBadge(ticket.status).label" :severity="statusBadge(ticket.status).severity" class="text-xs px-2 py-0.5" />
                    <span class="text-xs text-gray-400 font-mono">#{{ ticket.id.slice(0, 8).toUpperCase() }}</span>
                  </div>
                  <div class="flex items-center gap-2 mb-2">
                    <i class="pi pi-tag text-xs text-gray-400" aria-hidden="true" />
                    <span class="text-sm text-gray-500">{{ getSectorName(ticket) }}</span>
                  </div>
                  <h3 class="font-semibold text-gray-800 mb-3 line-clamp-2">{{ getSubject(ticket) }}</h3>
                  <div class="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                        {{ getInitials(ticket.requester?.name || ticket.requester?.email || '?') }}
                      </div>
                      <span class="text-xs text-gray-500 truncate max-w-[80px] sm:max-w-[120px]">{{ ticket.requester?.email || '—' }}</span>
                    </div>
                    <span class="text-xs text-gray-400 flex-shrink-0">{{ formatDate(ticket.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </template>
  </main>
</template>
