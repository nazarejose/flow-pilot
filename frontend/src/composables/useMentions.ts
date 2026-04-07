import { ref, onMounted } from 'vue'
import { getUsers } from '../api/usersApi'
import type { User } from '../api/types'

export interface MentionItem {
  value: string
  searchText: string
  user: User
}

let cachedUsers: MentionItem[] | null = null

export function useMentions() {
  const mentionItems = ref<MentionItem[]>([])

  async function ensureUsers() {
    if (cachedUsers) {
      mentionItems.value = cachedUsers
      return
    }
    try {
      const users = await getUsers()
      cachedUsers = users.map((u) => ({
        value: (u.name || u.email).replace(/\s+/g, '_'),
        user: u,
        searchText: `${u.name} ${u.email}`,
      }))
      mentionItems.value = cachedUsers
    } catch {
      // silent
    }
  }

  // Preload users immediately
  onMounted(() => ensureUsers())

  return { mentionItems, ensureUsers }
}
