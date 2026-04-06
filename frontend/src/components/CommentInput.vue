<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getUsers } from '../api/usersApi'
import { createComment } from '../api/commentsApi'
import type { User } from '../api/types'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

const props = defineProps<{ ticketId: string }>()
const emit = defineEmits<{ commentPosted: [] }>()

const content = ref('')
const submitting = ref(false)
const showMentions = ref(false)
const mentionSearch = ref('')
const allUsers = ref<User[]>([])
let usersLoaded = false

const filteredUsers = computed(() => {
  const search = mentionSearch.value.toLowerCase()
  return search ? allUsers.value.filter(u => u.name.toLowerCase().includes(search)) : allUsers.value
})

async function loadUsers() {
  if (usersLoaded) return
  usersLoaded = true
  try { allUsers.value = await getUsers() } catch { /* silently fail */ }
}

function insertMention(user: User) {
  const before = content.value.substring(0, content.value.lastIndexOf('@'))
  const after = content.value.substring(content.value.lastIndexOf('@') + mentionSearch.value.length + 1)
  content.value = before + `@${user.name} ` + after
  showMentions.value = false
  mentionSearch.value = ''
}

async function handleSubmit() {
  if (!content.value.trim()) return
  submitting.value = true
  try {
    await createComment(props.ticketId, content.value)
    emit('commentPosted')
    content.value = ''
  } catch { /* error handled by toast in parent */ }
  finally { submitting.value = false }
}

function handleInput() {
  const text = content.value
  const cursorIdx = text.length
  const lastAt = text.lastIndexOf('@')
  if (lastAt !== -1 && lastAt < cursorIdx) {
    const afterAt = text.substring(lastAt + 1, cursorIdx)
    if (!afterAt.includes(' ')) {
      mentionSearch.value = afterAt
      showMentions.value = true
      loadUsers()
    }
  } else {
    showMentions.value = false
  }
}

watch(content, () => handleInput())
</script>

<template>
  <div class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
    <div class="px-8 py-5">
      <label class="text-xs font-bold text-gray-600 mb-2 block">Escrever comentário</label>
      <div class="relative">
        <Textarea v-model="content" placeholder="Digite seu comentário... Use @ para mencionar" rows="3" class="w-full" />
        <div v-if="showMentions && filteredUsers.length > 0" class="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[200px] overflow-y-auto z-10">
          <div v-for="user in filteredUsers" :key="user.id" class="px-4 py-2.5 cursor-pointer hover:bg-blue-50 text-sm text-gray-700 transition-colors" @mousedown.prevent="insertMention(user)">
            <span class="font-medium">@{{ user.name }}</span>
            <span class="text-gray-400 text-xs ml-2">{{ user.email }}</span>
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-3">
        <Button label="Enviar comentário" severity="primary" icon="pi pi-send" rounded size="small" :disabled="!content.trim() || submitting" :loading="submitting" @click="handleSubmit" />
      </div>
    </div>
  </div>
</template>