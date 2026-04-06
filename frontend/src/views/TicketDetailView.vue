<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getTicket } from '../api/ticketsApi'
import type { Ticket } from '../api/types'
import TicketDetailCard from '../components/TicketDetailCard.vue'
import StatusChangePanel from '../components/StatusChangePanel.vue'
import CommentsThread from '../components/CommentsThread.vue'
import CommentInput from '../components/CommentInput.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const id = route.params.id as string
const ticket = ref<Ticket | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const commentsThread = ref<InstanceType<typeof CommentsThread> | null>(null)

async function fetchTicket() {
  try {
    ticket.value = await getTicket(id)
  } catch (e: any) {
    if (e?.statusCode === 404) { notFound.value = true }
    else { error.value = e?.error || 'Erro ao carregar chamado' }
  } finally { loading.value = false }
}

function onStatusChange(newTicket: Ticket) { ticket.value = newTicket }
function onCommentsRefresh() { commentsThread.value?.refresh() }

onMounted(() => fetchTicket())
</script>

<template>
  <div class="max-w-[900px] mx-auto pb-8">
    <div class="mb-4">
      <button @click="router.back()" class="text-sm text-blue-500 hover:underline flex items-center gap-1">
        <i class="pi pi-arrow-left text-xs" /> Voltar
      </button>
    </div>

    <div v-if="notFound" class="text-center py-16">
      <i class="pi pi-times-circle text-5xl text-gray-200 mb-3" />
      <h2 class="text-xl font-bold text-gray-700">Chamado não encontrado</h2>
      <p class="text-sm text-gray-400 mt-2">O chamado pode ter sido removido ou você não tem acesso.</p>
      <button @click="router.push('/tickets')" class="text-sm text-blue-500 hover:underline mt-3 inline-block">Voltar para lista</button>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <div v-else-if="loading" class="space-y-4">
      <div class="bg-white rounded-2xl p-8"><div class="h-6 w-64 bg-gray-100 rounded animate-pulse mb-2" /><div class="h-4 w-32 bg-gray-100 rounded animate-pulse" /></div>
    </div>

    <template v-else-if="ticket">
      <TicketDetailCard :ticket="ticket" />
      <StatusChangePanel :ticket="ticket" :user-role="authStore.userRole()" @status-change="onStatusChange" />
      <CommentsThread :ticket-id="id" ref="commentsThread" />
      <CommentInput :ticket-id="id" @comment-posted="onCommentsRefresh" />
    </template>
  </div>
</template>