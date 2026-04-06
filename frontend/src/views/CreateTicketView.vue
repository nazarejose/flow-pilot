<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { getPublishedHelpdesks } from '../api/helpdesksApi'
import { createTicket } from '../api/ticketsApi'
import type { Helpdesk, FieldSchema } from '../api/types'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Role guard
if (authStore.user?.role === 'attendant') {
  router.replace('/tickets')
}

// State
const helpdesks = ref<Helpdesk[]>([])
const loading = ref(true)
const selectedHelpdeskId = ref<string | null>(null)
const prioridade = ref('medium')
const fieldValues = ref<Record<string, unknown>>({})
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)

const selectedHelpdesk = computed(() =>
  helpdesks.value.find((h) => h.id === selectedHelpdeskId.value) || null,
)

function extractAssunto(): string | null {
  const assunto = fieldValues.value.assunto_do_problema as string | undefined
  if (assunto && assunto.trim()) return assunto.trim()
  return (fieldValues.value.assunto as string | undefined)?.trim() || null
}

const sectorMap: Record<string, string> = {
  ti: 'TI',
  rh: 'RH',
  manutencao: 'Manutenção',
  qualidade: 'Qualidade de Produtos',
}

const prioridadeOptions = [
  { label: 'Baixa - Opcional', value: 'baixa' },
  { label: 'Média - Necessário', value: 'média' },
  { label: 'Alta - Crítico', value: 'alta' },
]

const setores = computed(() => {
  const seen = new Map<string, string>()
  for (const h of helpdesks.value) {
    if (!seen.has(h.sectorId)) {
      const hd = helpdesks.value.find((h2) => h2.sectorId === h.sectorId)
      if (hd) seen.set(h.sectorId, hd.id)
    }
  }
  return Array.from(seen.entries()).map(([sectorId, hdId]) => {
    const hd = helpdesks.value.find((h2) => h2.sectorId === sectorId)
    return {
      label: sectorMap[sectorId] || hd?.name || sectorId,
      value: hdId,
      sectorId: hd?.sectorId || sectorId,
    }
  })
})

onMounted(async () => {
  try {
    helpdesks.value = await getPublishedHelpdesks()
  } catch {
    errors.value.form = 'Erro ao carregar setores. Tente novamente.'
  } finally {
    loading.value = false
  }
})

function onSetorChange(hdId: string) {
  const hd = helpdesks.value.find((h) => h.id === hdId)
  if (!hd) return
  // Reset field values
  fieldValues.value = {}
  for (const f of hd.schema) {
    if (f.type === 'checkbox') fieldValues.value[f.name] = false
    else if (f.type === 'number') fieldValues.value[f.name] = null
    else if (f.type === 'date') fieldValues.value[f.name] = null
    else fieldValues.value[f.name] = ''
  }
  submitted.value = false
  errors.value = {}
}

function fieldPlaceholder(field: FieldSchema): string {
  const defaults: Record<string, string> = {
    text: `Digite o ${field.label.toLowerCase()}...`,
    textarea: `Digite o ${field.label.toLowerCase()}...`,
    select: `Selecione...`,
    number: '0',
    date: 'DD/MM/AAAA',
    checkbox: '',
  }
  return defaults[field.type] || ''
}

function validate(): boolean {
  errors.value = {}
  let valid = true

  if (!selectedHelpdeskId.value) {
    errors.value.setor = 'Selecione um setor'
    valid = false
  }

  const hd = helpdesks.value.find((h) => h.id === selectedHelpdeskId.value)
  if (hd) {
    for (const f of hd.schema) {
      if (f.required) {
        const val = fieldValues.value[f.name]
        if (val === undefined || val === null || val === '' || val === false) {
          errors.value[f.name] = `${f.label} é obrigatório`
          valid = false
        }
      }
    }
  }

  if (!prioridade.value) {
    errors.value.prioridade = 'Selecione a prioridade'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  submitted.value = true
  if (!validate()) return

  submitting.value = true
  try {
    // Build field values with assunto
    const payload: Record<string, unknown> = {
      prioridade: prioridade.value,
      ...fieldValues.value,
    }

    await createTicket({
      helpdeskId: selectedHelpdeskId.value!,
      fieldValues: payload,
    })

    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Chamado criado!', life: 3000 })
    router.push('/tickets')
  } catch (e: any) {
    errors.value.form = e?.error || 'Erro ao criar chamado. Tente novamente.'
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.push('/tickets')
}
</script>

<template>
  <div class="max-w-[900px] mx-auto pb-8">
    <h2 class="text-xl font-bold text-gray-800 mb-6">Abrir Novo Chamado</h2>

    <!-- Error banner -->
    <Message
      v-if="errors.form"
      severity="error"
      class="mb-6"
      closable
      @close="errors.form = ''"
    >
      {{ errors.form }}
    </Message>

    <div class="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.04)] overflow-hidden mb-8">
      <div class="px-8 pt-6 pb-3 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800 m-0">Dados do Chamado</h3>
        <p class="text-sm text-gray-400 m-0.5">Preencha os campos abaixo para abrir um chamado.</p>
      </div>

      <form class="px-8 pt-5 pb-6" @submit.prevent="handleSubmit">
        <!-- Fixed fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-600">Setor de Destino</label>
            <Select
              v-model="selectedHelpdeskId"
              :options="setores"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um setor..."
              :class="{ 'p-invalid': submitted && errors.setor }"
              @change="onSetorChange(selectedHelpdeskId!)"
            />
            <Message v-if="submitted && errors.setor" severity="error" size="small" variant="simple" class="text-xs">
              {{ errors.setor }}
            </Message>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-600">Prioridade</label>
            <Select
              v-model="prioridade"
              :options="prioridadeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione a prioridade..."
              :class="{ 'p-invalid': submitted && errors.prioridade }"
            />
            <Message v-if="submitted && errors.prioridade" severity="error" size="small" variant="simple" class="text-xs">
              {{ errors.prioridade }}
            </Message>
          </div>
        </div>

        <!-- Dynamic fields -->
        <div v-if="selectedHelpdesk" class="mb-5">
          <div class="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
            <i class="pi pi-sliders-h" /> Campos do Setor: {{ setorMap[selectedHelpdesk.sectorId] || selectedHelpdesk.name }}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div v-for="field in selectedHelpdesk.schema" :key="field.name" class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-gray-600">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>

              <InputText
                v-if="field.type === 'text'"
                v-model="fieldValues[field.name]"
                :placeholder="fieldPlaceholder(field)"
                class="w-full"
              />
              <Textarea
                v-else-if="field.type === 'textarea'"
                v-model="fieldValues[field.name]"
                :placeholder="fieldPlaceholder(field)"
                rows="3"
                class="w-full"
              />
              <Select
                v-else-if="field.type === 'select'"
                v-model="fieldValues[field.name]"
                :options="field.options || []"
                :placeholder="fieldPlaceholder(field)"
                class="w-full"
              />
              <InputNumber
                v-else-if="field.type === 'number'"
                v-model="fieldValues[field.name]"
                :placeholder="fieldPlaceholder(field)"
                class="w-full"
              />
              <DatePicker
                v-else-if="field.type === 'date'"
                v-model="fieldValues[field.name]"
                :placeholder="fieldPlaceholder(field)"
                class="w-full"
              />
              <div v-else-if="field.type === 'checkbox'" class="flex items-center gap-2">
                <Checkbox v-model="fieldValues[field.name]" binary />
                <span class="text-sm text-gray-600">{{ field.label }}</span>
              </div>

              <Message
                v-if="submitted && errors[field.name]"
                severity="error"
                size="small"
                variant="simple"
                class="text-xs"
              >
                {{ errors[field.name] }}
              </Message>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
          <Button
            label="Cancelar"
            severity="secondary"
            rounded
            outlined
            class="px-6"
            @click="handleCancel"
          />
          <Button
            label="Enviar Chamado"
            severity="primary"
            icon="pi pi-send"
            rounded
            type="submit"
            :loading="submitting"
            class="px-6"
          />
        </div>
      </form>
    </div>

    <Toast />
  </div>
</template>
