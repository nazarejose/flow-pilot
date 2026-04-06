<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between py-2 px-5 flex-1">
    <div class="flex items-center gap-3 ml-5">
      <div class="flex flex-col leading-tight">
        <span class="text-xs text-gray-500">Seg, 6</span>
        <span class="text-base font-semibold text-gray-900">17:40</span>
      </div>

      <div class="w-px h-7 bg-gray-200" />

      <div class="flex items-center gap-1">
        <i class="pi pi-sun text-yellow-500 text-lg" />
        <div class="flex flex-col leading-tight">
          <span class="text-base font-medium text-gray-700">29&deg;</span>
          <span class="text-[10px] text-gray-400 flex items-center gap-0.5">
            <i class="pi pi-map-marker text-[9px]" /> Fortaleza
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative cursor-pointer flex items-center p-2">
        <i class="pi pi-envelope text-gray-500 text-xl" />
        <span class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center -mt-1 -mr-1">
          2
        </span>
      </div>

      <div class="w-[34px] h-[34px] rounded-full border-2 border-blue-500 overflow-hidden cursor-pointer">
        <img
          src="https://randomuser.me/api/portraits/men/75.jpg"
          alt="Profile"
          class="w-full h-full object-cover"
        />
      </div>
    </div>
  </header>
</template>
