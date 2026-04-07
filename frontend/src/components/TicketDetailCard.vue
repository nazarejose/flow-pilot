<script setup lang="ts">
import type { Ticket } from '../api/types'
import Tag from 'primevue/tag'

defineProps<{ ticket: Ticket }>()

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; severity: string }> = {
    open: { label: 'Aberto', severity: 'warn' },
    in_progress: { label: 'Em Progresso', severity: 'info' },
    resolved: { label: 'Resolvido', severity: 'success' },
    closed: { label: 'Fechado', severity: 'secondary' },
  }
  return map[status] || { label: status, severity: 'info' }
}

const priorityMap: Record<string, string> = {
  baixa: 'Baixa', média: 'Média', alta: 'Alta',
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function getDynamicFields(fieldValues: Record<string, unknown>) {
  const skip = new Set(['assunto', 'assunto_do_problema', 'prioridade'])
  return Object.entries(fieldValues).filter(([key]) => !skip.has(key))
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
    <div class="px-8 pt-6 pb-4 border-b border-gray-100">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-bold text-gray-800 m-0">
            {{ (ticket.fieldValues?.assunto || ticket.fieldValues?.assunto_do_problema || 'Sem assunto') as string }}
          </h3>
          <p class="text-sm text-gray-400 mt-1">{{ ticket.helpdesk?.name || '—' }}</p>
        </div>
        <Tag :value="statusBadge(ticket.status).label" :severity="statusBadge(ticket.status).severity" class="text-xs px-2 py-0.5" />
      </div>
    </div>
    <div class="px-8 py-5">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <span class="text-[10px] font-bold text-gray-400 uppercase">Solicitante</span>
          <p class="text-sm text-gray-700 mt-0.5">{{ ticket.requester?.name || '—' }}</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-gray-400 uppercase">Prioridade</span>
          <p class="text-sm text-gray-700 mt-0.5">{{ priorityMap[ticket.fieldValues?.prioridade as string] || '—' }}</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-gray-400 uppercase">Atendente</span>
          <p class="text-sm text-gray-700 mt-0.5">{{ ticket.assignedTo?.name || 'Não atribuído' }}</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-gray-400 uppercase">Criado em</span>
          <p class="text-sm text-gray-700 mt-0.5">{{ formatDate(ticket.createdAt) }}</p>
        </div>
      </div>
      <div v-if="getDynamicFields(ticket.fieldValues).length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="[key, val] in getDynamicFields(ticket.fieldValues)" :key="key" class="bg-gray-50 rounded-xl p-4">
          <span class="text-[10px] font-bold text-gray-400 uppercase">{{ formatKey(key) }}</span>
          <p class="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{{ val ?? '—' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>