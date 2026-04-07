<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const router = useRouter()
const authStore = useAuthStore()
const sidebarCollapsed = ref(true)
const mobileSidebar = ref(false)

function toggleSidebar() {
  // On mobile, toggle overlay sidebar. On desktop, toggle collapsed.
  if (window.innerWidth < 768) {
    mobileSidebar.value = !mobileSidebar.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function handleNavigate(event: Event) {
  const customEvent = event as CustomEvent<string>
  router.push(customEvent.detail)
  mobileSidebar.value = false
}

onMounted(() => {
  window.addEventListener('navigate', handleNavigate as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('navigate', handleNavigate as EventListener)
})
</script>

<template>
  <router-view v-if="!authStore.isAuthenticated" />

  <div v-else class="min-h-screen flex">
    <!-- Mobile sidebar overlay -->
    <div
      v-if="mobileSidebar"
      class="fixed inset-0 bg-black/30 z-40 md:hidden"
      @click="mobileSidebar = false"
    />
    <!-- Mobile sidebar -->
    <div
      v-if="mobileSidebar"
      class="fixed inset-y-0 left-0 z-50 md:hidden"
    >
      <AppSidebar :collapsed="false" @toggle-sidebar="mobileSidebar = false" />
    </div>
    <!-- Desktop sidebar -->
    <AppSidebar
      v-show="!mobileSidebar"
      class="hidden md:flex"
      :collapsed="sidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />
    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
        <router-view />
        <footer class="mt-auto pt-4 sm:pt-6 pb-3 border-t border-gray-200 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>&copy; 2026 FlowPilot. Todos os direitos reservados.</span>
          <div class="flex gap-4">
            <a href="#" class="text-blue-500 hover:underline">FAQ</a>
            <a href="#" class="text-blue-500 hover:underline">Suporte</a>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>
