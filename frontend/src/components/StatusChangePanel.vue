<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import type { Ticket, TicketStatus } from '../api/types'
import { updateTicketStatus } from '../api/ticketsApi'

const props = defineProps<{ ticket: Ticket; userRole: string }>()
const emit = defineEmits<{ statusChange: [ticket: Ticket] }>()
const toast = useToast()
const newStatus = ref<TicketStatus>('')
const error = ref('')
const loading = ref(false)

type StatusOption = { label: string; value: TicketStatus }

const statusMap: Record<string, Record<string, StatusOption>> = {
  open: {
    attendant: { label: 'Em Progresso', value: 'in_progress' },
    admin: { label: 'Em Progresso', value: 'in_progress' },
    requester: { label: 'Cancelar', value: 'closed' },
  },
  in_progress: {
    attendant: { label: 'Resolvido', value: 'resolved' },
    admin: { label: 'Resolvido', value: 'resolved' },
    requester: { label: 'Fechar', value: 'closed' },
  },
  resolved: {
    attendant: { label: 'Fechar', value: 'closed' },
    admin: { label: 'Fechar', value: 'closed' },
  },
}

const allowedStatuses = computed<StatusOption[]>(() => {
  const transitions = statusMap[props.ticket.status] || {}
  return Object.values(transitions)
})

const isClosed = computed(() => props.ticket.status === 'closed')

async function handleConfirm() {
  if (!newStatus.value) { error.value = 'Selecione uma ação.'; return }
  error.value = ''
  loading.value = true
  try {
    const result = await updateTicketStatus(props.ticket.id, newStatus.value)
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Status atualizado!', life: 3000 })
    emit('statusChange', result)
    newStatus.value = ''
  } catch (e: any) { error.value = e?.error || 'Erro ao atualizar status.' }
  finally { loading.value = false }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
    <div class="px-8 py-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-gray-600">Status:</span>
          <Tag :value="props.ticket.status" :severity="props.ticket.status === 'closed' ? 'secondary' : 'info'" class="text-[10px] px-2 py-0.5" />
        </div>
        <template v-if="isClosed">
          <span class="text-sm text-gray-400">Chamado encerrado</span>
        </template>
        <template v-else-if="allowedStatuses.length === 0">
          <span class="text-sm text-gray-400">—</span>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <Select v-model="newStatus" :options="allowedStatuses" optionLabel="label" optionValue="value" placeholder="Selecionar..." class="w-[200px]" />
            <Button label="Confirmar" severity="primary" rounded size="small" :loading="loading" @click="handleConfirm" class="px-4" />
          </div>
        </template>
      </div>
      <Message v-if="error" severity="error" size="small" variant="simple" class="text-xs mt-2">{{ error }}</Message>
    </div>
  </div>
</template>