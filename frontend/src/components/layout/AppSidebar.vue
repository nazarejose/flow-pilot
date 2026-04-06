<script setup lang="ts">
import { useRoute } from 'vue-router'

defineEmits<{ toggleSidebar: [] }>()
const props = defineProps<{ collapsed: boolean }>()
const route = useRoute()

function navigate(path: string) {
  window.dispatchEvent(new CustomEvent('navigate', { detail: path }))
}

function itemClass(path: string) {
  const base = 'flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-700 hover:bg-gray-50'
  return route.path === path ? 'bg-blue-50 text-blue-600 font-medium' : base
}
function iconClass(path: string) {
  return route.path === path ? 'pi text-base min-w-[1.2rem] text-center text-blue-600' : 'pi text-sm min-w-[1.2rem] text-center text-gray-400'
}
</script>

<template>
  <aside
    class="min-h-screen bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-200"
    :class="props.collapsed ? 'w-[72px]' : 'w-[260px]'"
  >
    <div class="flex items-center gap-2 p-4" :class="props.collapsed ? 'justify-center p-4' : 'justify-between'">
      <img
        v-if="!props.collapsed"
        src="/raposologo.png"
        alt="Raposo Plásticos"
        class="w-[130px] object-contain h-8"
      />
      <button
        class="w-7 h-7 rounded-md border-none bg-blue-600 cursor-pointer flex items-center justify-center text-white text-xs flex-shrink-0"
        @click="$emit('toggleSidebar')"
      >
        <i class="pi" :class="props.collapsed ? 'pi-arrow-right' : 'pi-arrow-left'" />
      </button>
    </div>

    <nav class="flex-1 px-3 pb-3">
      <ul class="list-none p-0 m-0">
        <li class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-300 cursor-not-allowed select-none">
          <i class="pi pi-th-large text-sm min-w-[1.2rem] text-center text-gray-300" />
          <span v-show="!props.collapsed">Dashboard</span>
        </li>
      </ul>

      <p v-show="!props.collapsed" class="text-[10px] font-bold tracking-widest text-gray-400 mt-4 mb-2 ml-3 uppercase">
        NAVEGAÇÃO
      </p>

      <ul class="list-none p-0 m-0">
        <li class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-300 cursor-not-allowed select-none">
          <i class="pi pi-clipboard text-sm min-w-[1.2rem] text-center text-gray-300" />
          <span v-show="!props.collapsed">Meu Dia</span>
        </li>
        <li class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-300 cursor-not-allowed select-none">
          <i class="pi pi-list-check text-sm min-w-[1.2rem] text-center text-gray-300" />
          <span v-show="!props.collapsed">Minhas Tarefas</span>
        </li>
        <li class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-gray-300 cursor-not-allowed select-none">
          <i class="pi pi-calendar-clock text-sm min-w-[1.2rem] text-center text-gray-300" />
          <span v-show="!props.collapsed">Meus Planners</span>
        </li>
        <li
          class="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm rounded-lg transition-all duration-150 mb-0.5 whitespace-nowrap overflow-hidden text-blue-600 font-medium hover:bg-blue-50"
          @click="navigate('/helpdesk')"
        >
          <i class="pi pi-phone text-base min-w-[1.2rem] text-center text-blue-600" />
          <span v-show="!props.collapsed">Abrir um chamado</span>
        </li>
      </ul>
    </nav>
  </aside>
</template>
