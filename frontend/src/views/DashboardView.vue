<script setup lang="ts">
</script>

<template>
  <div class="flex-1 flex flex-col">
    <div class="flex items-center gap-4 mb-4">
      <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center text-xl flex-shrink-0">
        <i class="pi pi-chart-line" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-gray-900 m-0">Olá, Case - Estagio!</h2>
        <p class="text-sm text-gray-500 m-0.5">Bem-vindo ao seu espaço de trabalho</p>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-5 mb-auto">
      <div>
        <h3 class="text-base font-semibold text-gray-900 inline">Ações Rápidas</h3>
        <span class="inline text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2 align-middle">
          Acesso rápido
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="flex items-center gap-4 p-5 border border-gray-200 rounded-xl cursor-default">
          <div class="w-11 h-11 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center text-lg flex-shrink-0">
            <i class="pi pi-plus" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-900 m-0">Nova Tarefa</h4>
            <p class="text-xs text-gray-400 m-0.5">Criar nova tarefa</p>
          </div>
        </div>

        <div class="flex items-center gap-4 p-5 border border-gray-200 rounded-xl cursor-default">
          <div class="w-11 h-11 rounded-xl bg-purple-100 text-purple-500 flex items-center justify-center text-lg flex-shrink-0">
            <i class="pi pi-user" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-900 m-0">Meu Perfil</h4>
            <p class="text-xs text-gray-400 m-0.5">Editar informações</p>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-center text-xs text-gray-400 py-4 mt-auto">
      &copy; 2026 FlowPilot. Todos os direitos reservados. &middot; Desenvolvido por FlowPilot
      <span class="ml-3 cursor-pointer hover:text-gray-500">FAQ</span>
      <span class="ml-3 cursor-pointer hover:text-gray-500">Suporte</span>
    </footer>
  </div>
</template>
