<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getComments } from '../api/commentsApi'
import type { Comment } from '../api/types'
import Skeleton from 'primevue/skeleton'

const props = defineProps<{ ticketId: string }>()
const authStore = useAuthStore()
const comments = ref<Comment[]>([])
const loading = ref(true)
const error = ref('')
let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchComments() {
  try {
    comments.value = (await getComments(props.ticketId)).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  } catch (e: any) { error.value = e?.error || 'Erro ao carregar comentários' }
  finally { loading.value = false }
}

function isCurrentUser(authorId: string): boolean {
  return authorId === (authStore.user as any)?.id
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => { fetchComments(); pollInterval = setInterval(fetchComments, 10000) })
onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })

defineExpose({ refresh: fetchComments })
</script>

<template>
  <div class="bg-white rounded-2xl shadow-[0px_4px_15px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
    <div class="px-8 py-5 border-b border-gray-100">
      <h4 class="text-sm font-bold text-gray-700">Conversa</h4>
    </div>
    <div v-if="error" class="px-8 py-4"><p class="text-sm text-red-600">{{ error }}</p></div>
    <div v-else-if="loading" class="px-8 py-5">
      <div v-for="i in 3" :key="i" class="mb-4">
        <Skeleton class="h-3 w-24 mb-2" /><Skeleton class="h-4 w-full" />
      </div>
    </div>
    <div v-else-if="comments.length === 0" class="px-8 py-8 text-center">
      <i class="pi pi-comments text-3xl text-gray-200 mb-2" />
      <p class="text-sm text-gray-400">Nenhum comentário ainda</p>
    </div>
    <div v-else class="px-8 py-5 max-h-[400px] overflow-y-auto">
      <div v-for="comment in comments" :key="comment.id" class="mb-4">
        <div class="flex items-baseline gap-2 mb-1">
          <span class="text-xs font-bold" :class="isCurrentUser(comment.authorId) ? 'text-blue-600' : 'text-gray-700'">
            {{ comment.author?.name || 'Usuário' }}
          </span>
          <span class="text-[10px] text-gray-400">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ comment.content }}</p>
      </div>
    </div>
  </div>
</template>