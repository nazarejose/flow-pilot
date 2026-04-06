<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const router = useRouter()
const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function handleNavigate(event: Event) {
  const customEvent = event as CustomEvent<string>
  router.push(customEvent.detail)
}

onMounted(() => {
  window.addEventListener('navigate', handleNavigate as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('navigate', handleNavigate as EventListener)
})
</script>

<template>
  <div class="min-h-screen flex">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" />
    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 bg-gray-50 px-8 py-6 flex flex-col">
        <router-view />
        <footer class="mt-auto pt-6 pb-4 border-t border-gray-200 text-xs text-gray-400 flex items-center justify-between">
          <span>&copy; 2026 FlowPilot. Todos os direitos reservados. &middot; Desenvolvido por FlowPilot</span>
          <div class="flex gap-4">
            <a href="#" class="text-blue-500 hover:underline">FAQ</a>
            <a href="#" class="text-blue-500 hover:underline">Suporte</a>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>
