<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{ collapsed: boolean }>()
const route = useRoute()
const authStore = useAuthStore()

function navigate(path: string) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: path }))
}

function handleLogout() {
  authStore.logout()
  navigate('/login')
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
</script>

<template>
  <aside
    class="min-h-screen bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-200 shadow-lg md:shadow-none"
    :class="props.collapsed && !isMobile ? 'w-[72px]' : 'w-[260px]'"
    aria-label="Menu de navegação"
  >
    <div class="flex items-center gap-2 p-4" :class="props.collapsed && !isMobile ? 'justify-center p-4' : 'justify-between'">
      <img
        v-if="!props.collapsed || isMobile"
        src="/raposologo.png"
        alt="Raposo Plásticos"
        class="w-[130px] object-contain h-8"
      />
      <button
        class="w-7 h-7 rounded-md border-none bg-blue-600 cursor-pointer flex items-center justify-center text-white text-xs flex-shrink-0"
        @click="$emit('toggleSidebar')"
        aria-label="Alternar menu lateral"
      >
        <i class="pi" :class="(props.collapsed && !isMobile) ? 'pi-arrow-right' : 'pi-arrow-left'" aria-hidden="true" />
      </button>
    </div>

    <nav class="flex-1 px-3 pb-3" aria-label="Navegação principal">
      <ul class="list-none p-0 m-0">
        <li
          class="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden hover:bg-gray-50"
          :class="route.path === '/dashboard' && 'bg-blue-50 text-blue-600'"
          @click="navigate('/dashboard')"
          @keydown.enter="navigate('/dashboard')"
          tabindex="0"
          role="menuitem"
        >
          <i class="pi pi-th-large text-sm min-w-[1.2rem] text-center" :class="route.path === '/dashboard' ? 'text-blue-600' : 'text-gray-500'" aria-hidden="true" />
          <span v-show="!props.collapsed || isMobile">Dashboard</span>
        </li>
      </ul>

      <p v-show="!props.collapsed || isMobile" class="text-[10px] font-bold tracking-widest text-gray-400 mt-4 mb-2 ml-3 uppercase">
        Chamados
      </p>

      <ul class="list-none p-0 m-0" role="menu">
        <li
          class="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-500 hover:bg-gray-50"
          :class="route.path === '/tickets' && 'bg-blue-50 text-blue-600'"
          @click="navigate('/tickets')"
          @keydown.enter="navigate('/tickets')"
          tabindex="0"
          role="menuitem"
        >
          <i class="pi pi-ticket text-sm min-w-[1.2rem] text-center" :class="route.path === '/tickets' ? 'text-blue-600' : 'text-gray-500'" aria-hidden="true" />
          <span v-show="!props.collapsed || isMobile">Meus Chamados</span>
        </li>
        <li
          class="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-500 hover:bg-gray-50"
          :class="route.path === '/tickets/new' && 'bg-blue-50 text-blue-600'"
          @click="navigate('/tickets/new')"
          @keydown.enter="navigate('/tickets/new')"
          tabindex="0"
          role="menuitem"
        >
          <i class="pi pi-phone text-sm min-w-[1.2rem] text-center" :class="route.path === '/tickets/new' ? 'text-blue-600' : 'text-gray-500'" aria-hidden="true" />
          <span v-show="!props.collapsed || isMobile">Abrir chamado</span>
        </li>
      </ul>
    </nav>

    <!-- Logout -->
    <div class="px-3 pb-3 border-t border-gray-100 pt-3">
      <button
        class="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm rounded-lg transition-all duration-150 whitespace-nowrap overflow-hidden text-red-500 hover:bg-red-50 border-0 bg-transparent w-full text-left"
        @click="handleLogout"
        aria-label="Sair do sistema"
      >
        <i class="pi pi-sign-out text-sm min-w-[1.2rem] text-center text-red-500" aria-hidden="true" />
        <span v-show="!props.collapsed || isMobile">Sair</span>
      </button>
    </div>
  </aside>
</template>
