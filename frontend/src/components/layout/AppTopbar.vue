<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()
</script>

<template>
  <header class="h-2 bg-white border-b border-gray-200 flex items-center justify-between py-4 sm:py-6 lg:py-10 px-4 sm:px-5">
    <div class="flex items-center gap-3">
      <!-- Hamburger (mobile only) -->
      <button @click="$emit('toggleSidebar')" class="md:hidden p-2 -ml-2 rounded-md hover:bg-gray-100" aria-label="Abrir menu">
        <i class="pi pi-bars text-gray-600 text-lg" aria-hidden="true" />
      </button>
      <time class="hidden sm:flex flex-col leading-tight">
        <span class="text-xs text-gray-500">Seg, 6</span>
        <span class="text-base font-semibold text-gray-900">17:40</span>
      </time>
      <div class="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-gray-200" aria-hidden="true">
        <i class="pi pi-sun text-yellow-500 text-lg" aria-hidden="true" />
        <div class="flex flex-col leading-tight">
          <span class="text-base font-medium text-gray-700">29&deg;</span>
          <span class="text-[10px] text-gray-400 flex items-center gap-0.5">
            <i class="pi pi-map-marker text-[9px]" aria-hidden="true" /> Fortaleza
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      <button class="relative flex items-center p-2" aria-label="Mensagens, 2 não lidas">
        <i class="pi pi-envelope text-gray-500 text-lg sm:text-xl" aria-hidden="true" />
        <span class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center -mt-1 -mr-1" aria-hidden="true">
          2
        </span>
      </button>

      <div class="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full border-2 border-blue-500 overflow-hidden cursor-pointer flex-shrink-0">
        <img
          src="https://randomuser.me/api/portraits/men/75.jpg"
          alt="Foto do perfil"
          class="w-full h-full object-cover"
        />
      </div>
    </div>
  </header>
</template>
