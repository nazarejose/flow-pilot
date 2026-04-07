<script setup lang="ts">
import { ref } from 'vue'
import { Mentionable } from 'vue-mention'
import { createComment } from '../api/commentsApi'
import { useMentions } from '../composables/useMentions'
import Button from 'primevue/button'

const props = defineProps<{ ticketId: string }>()
const emit = defineEmits<{ commentPosted: [] }>()

const text = ref('')
const submitting = ref(false)
const { mentionItems, ensureUsers } = useMentions()

async function handleSubmit() {
  if (!text.value.trim()) return
  submitting.value = true
  try {
    await createComment(props.ticketId, text.value.trim())
    emit('commentPosted')
    text.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden mb-4 sm:mb-6">
    <div class="px-4 sm:px-8 py-4 sm:py-5">
      <label for="comment-text" class="text-xs font-bold text-gray-600 mb-2 block">Escrever comentário</label>

      <Mentionable
        :keys="['@']"
        :items="mentionItems"
        :insert-space="true"
        :limit="8"
        @open="ensureUsers"
      >
        <textarea
          id="comment-text"
          v-model="text"
          placeholder="Digite seu comentário... Use @ para mencionar"
          rows="3"
          class="mention-textarea"
          aria-label="Comentário do ticket"
        />

        <template #item-@="{ item }">
          <div class="flex items-center gap-2 px-3 py-1.5">
            <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
              {{ (item.user?.name || item.searchText).split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-700 truncate">{{ item.user?.name }}</div>
              <div class="text-xs text-gray-400 truncate">{{ item.user?.email }}</div>
            </div>
            <div class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{{ item.user?.role }}</div>
          </div>
        </template>
      </Mentionable>

      <div class="flex justify-end mt-3">
        <Button
          label="Enviar comentário"
          severity="primary"
          icon="pi pi-send"
          rounded
          size="small"
          :disabled="!text.trim() || submitting"
          :loading="submitting"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mention-textarea {
  width: 100%;
  resize: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.mention-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
</style>
