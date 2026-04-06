<script setup lang="ts">
import { ref, watch } from 'vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const setorOptions = [
  { label: 'TI', value: 'ti' },
  { label: 'RH', value: 'rh' },
  { label: 'MANUTENÇÃO', value: 'manutencao' },
  { label: 'QUALIDADE DE PRODUTOS', value: 'qualidade' },
]

const prioridadeOptions = [
  { label: 'Baixa - Opcional', value: 'low' },
  { label: 'Média - Necessário', value: 'medium' },
  { label: 'Alta - Crítico', value: 'high' },
]

// Dynamic field definitions per sector
const dynamicFields = {
  ti: [
    { key: 'tipo_problema', label: 'Tipo de Problema', type: 'select' as const, placeholder: 'Selecione...', options: ['Hardware', 'Software', 'Rede', 'Acesso'] },
    { key: 'ativo_relacionado', label: 'Ativo Relacionado', type: 'input' as const, placeholder: 'ID do PC, Impressora, Servidor...' },
    { key: 'sistema_operacional', label: 'Sistema Operacional', type: 'input' as const, placeholder: 'Windows 10, Linux, macOS...' },
    { key: 'mensagem_erro', label: 'Mensagem de Erro', type: 'input' as const, placeholder: 'Cole aqui a mensagem de erro exata...' },
  ],
  rh: [
    { key: 'assunto_rh', label: 'Assunto', type: 'select' as const, placeholder: 'Selecione...', options: ['Férias', 'Benefícios', 'Ponto Eletrônico', 'Recrutamento', 'Treinamento'] },
    { key: 'matricula', label: 'Matrícula do Funcionário', type: 'input' as const, placeholder: 'Digite sua matrícula...' },
    { key: 'data_desejada', label: 'Data Desejada para Resolução', type: 'input' as const, placeholder: 'DD/MM/AAAA' },
    { key: 'documentos', label: 'Anexo de Documentos', type: 'input' as const, placeholder: 'Anexe ou descreva os documentos...' },
  ],
  manutencao: [
    { key: 'local_afetado', label: 'Local/Área Afetada', type: 'input' as const, placeholder: 'Sala, Andar, Equipamento...' },
    { key: 'tipo_manutencao', label: 'Tipo de Manutenção', type: 'select' as const, placeholder: 'Selecione...', options: ['Elétrica', 'Hidráulica', 'Civil', 'Equipamentos'] },
    { key: 'gravidade', label: 'Gravidade do Dano', type: 'select' as const, placeholder: 'Selecione...', options: ['Leve', 'Moderado', 'Grave', 'Crítico'] },
    { key: 'interdicao', label: 'Necessidade de Interdição da Área', type: 'select' as const, placeholder: 'Selecione...', options: ['Não', 'Sim, parcial', 'Sim, total'] },
  ],
  qualidade: [
    { key: 'produto_lote', label: 'Produto/Lote Afetado', type: 'input' as const, placeholder: 'ID ou Nome do produto/lote...' },
    { key: 'tipo_nao_conformidade', label: 'Tipo de Não Conformidade', type: 'select' as const, placeholder: 'Selecione...', options: ['Defeito Estético', 'Defeito Funcional', 'Material'] },
    { key: 'quantidade_afetada', label: 'Quantidade Afetada', type: 'input' as const, placeholder: 'Ex: 50 unidades...' },
    { key: 'localizacao_falha', label: 'Localização da Falha no Processo', type: 'input' as const, placeholder: 'Ex: Extrusão, Injeção, Embalagem...' },
  ],
}

const form = ref({
  setor: null as string | null,
  prioridade: 'medium' as string,
  assunto: '',
  descricao: '',
  dynamic: {} as Record<string, string>,
})

const errors = ref({
  setor: false,
  prioridade: false,
  assunto: false,
  descricao: false,
})

const submitted = ref(false)

// Reset dynamic fields when sector changes
watch(() => form.value.setor, () => {
  form.value.dynamic = {}
})

function validate(): boolean {
  errors.value.setor = !form.value.setor
  errors.value.prioridade = !form.value.prioridade
  errors.value.assunto = !form.value.assunto.trim()
  errors.value.descricao = !form.value.descricao.trim()
  return !errors.value.setor && !errors.value.prioridade && !errors.value.assunto && !errors.value.descricao
}

function handleSubmit() {
  submitted.value = true
  if (validate()) {
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Chamado enviado!', life: 3000 })
    form.value = { setor: null, prioridade: 'medium', assunto: '', descricao: '', dynamic: {} }
    submitted.value = false
  }
}

function handleCancel() {
  form.value = { setor: null, prioridade: 'medium', assunto: '', descricao: '', dynamic: {} }
  submitted.value = false
  errors.value = { setor: false, prioridade: false, assunto: false, descricao: false }
}
</script>

<template>
  <div class="max-w-[900px] mx-auto pb-8">
    <div class="flex items-center gap-2 text-sm text-gray-400 mb-1">
      <span>Dashboard</span>
      <span>&gt;</span>
      <span>Novo Chamado</span>
    </div>

    <h2 class="text-xl font-bold text-gray-800 mb-6">Central de Suporte</h2>

    <div class="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.04)] overflow-hidden mb-8">
      <div class="px-8 pt-6 pb-3 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800 m-0">Novo Chamado</h3>
        <p class="text-sm text-gray-400 m-0.5">Preencha os dados abaixo para solicitar atendimento técnico ou administrativo.</p>
      </div>

      <form class="px-8 pt-5 pb-6" @submit.prevent="handleSubmit">
        <!-- Fixed fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-600">Setor de Destino</label>
            <Select
              v-model="form.setor"
              :options="setorOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um setor..."
              :class="{ 'p-invalid': submitted && errors.setor }"
              class="w-full"
            />
            <Message
              v-if="submitted && errors.setor"
              severity="error"
              size="small"
              variant="simple"
              class="text-xs"
            >
              Selecione um setor.
            </Message>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-600">Prioridade</label>
            <Select
              v-model="form.prioridade"
              :options="prioridadeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione a prioridade..."
              :class="{ 'p-invalid': submitted && errors.prioridade }"
              class="w-full"
            />
            <Message
              v-if="submitted && errors.prioridade"
              severity="error"
              size="small"
              variant="simple"
              class="text-xs"
            >
              Selecione uma prioridade.
            </Message>
          </div>
        </div>

        <div class="mb-5 flex flex-col gap-1.5">
          <label class="text-xs font-bold text-gray-600">Assunto do Problema</label>
          <InputText
            v-model="form.assunto"
            placeholder="Ex: Falha na extrusora 04 ou Problema no login do sistema"
            :class="{ 'p-invalid': submitted && errors.assunto }"
            class="w-full"
          />
          <Message
            v-if="submitted && errors.assunto"
            severity="error"
            size="small"
            variant="simple"
            class="text-xs"
          >
            Informe o assunto do problema.
          </Message>
        </div>

        <!-- Dynamic fields based on selected sector -->
        <div v-if="form.setor && dynamicFields[form.setor]" class="mb-5">
          <div class="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
            <i class="pi pi-sliders-h" />
            Campos do Setor: {{ setorOptions.find(s => s.value === form.setor)?.label }}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              v-for="field in dynamicFields[form.setor]"
              :key="field.key"
              class="flex flex-col gap-1.5"
            >
              <label class="text-xs font-bold text-gray-600">{{ field.label }}</label>
              <Select
                v-if="field.type === 'select'"
                v-model="form.dynamic[field.key]"
                :options="field.options"
                :placeholder="field.placeholder"
                class="w-full"
              />
              <InputText
                v-else
                v-model="form.dynamic[field.key]"
                :placeholder="field.placeholder"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="mb-5 flex flex-col gap-1.5">
          <label class="text-xs font-bold text-gray-600">Descrição detalhada</label>
          <Textarea
            v-model="form.descricao"
            placeholder="Descreva o problema com o máximo de detalhes possível e a situação encontrada..."
            rows="5"
            :class="{ 'p-invalid': submitted && errors.descricao }"
            class="w-full"
          />
          <Message
            v-if="submitted && errors.descricao"
            severity="error"
            size="small"
            variant="simple"
            class="text-xs"
          >
            Adicione uma descrição do problema.
          </Message>
        </div>

        <div class="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <i class="pi pi-info-circle text-blue-500 text-xl flex-shrink-0 mt-0.5" />
          <p class="text-sm text-gray-500 m-0 leading-relaxed">
            Ao enviar este chamado, um número de protocolo será gerado e enviado para seu e-mail corporativo.
            O tempo médio de resposta para este setor é de 4 horas úteis.
          </p>
        </div>

        <div class="flex gap-3 justify-end">
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
            class="px-6"
          />
        </div>
      </form>
    </div>

    <div class="pt-1">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-800 m-0">Meus últimos chamados</h3>
        <span class="text-sm text-blue-500 cursor-pointer font-medium">Ver todo histórico</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden relative hover:shadow-[0px_6px_20px_rgba(0,0,0,0.07)] transition-shadow">
          <div class="absolute top-0 left-0 w-[3px] h-full bg-blue-500" />
          <div class="p-5 pl-[22px]">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">MANUTENÇÃO - #44098</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Em análise</span>
            </div>
            <h4 class="text-sm font-semibold text-gray-800 m-0 mb-1">Ruido estranho motor B22</h4>
            <p class="text-xs text-gray-400 m-0">Enviado hoje às 08:45</p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden relative hover:shadow-[0px_6px_20px_rgba(0,0,0,0.07)] transition-shadow">
          <div class="absolute top-0 left-0 w-[3px] h-full bg-green-500" />
          <div class="p-5 pl-[22px]">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">TI - #44021</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Resolvido</span>
            </div>
            <h4 class="text-sm font-semibold text-gray-800 m-0 mb-1">Acesso ao servidor de arquivos</h4>
            <p class="text-xs text-gray-400 m-0">Concluído em 12 Out, 2023</p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden flex items-center justify-center">
          <div class="flex flex-col items-center py-8 text-center">
            <i class="pi pi-clock text-3xl text-gray-200 mb-2" />
            <p class="text-sm text-gray-300 m-0">Nenhum chamado recente</p>
          </div>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>
