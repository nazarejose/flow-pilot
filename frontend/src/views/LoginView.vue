<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!email.value || !password.value) {
    error.value = 'Preencha e-mail e senha.'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await authStore.doLogin(email.value, password.value)
    router.push('/tickets')
  } catch (e: any) {
    error.value = 'E-mail ou senha inv\u00e1lidos.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- painel do formul\u00e1rio -->
    <main class="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8" aria-label="Formul\u00e1rio de login">
      <div class="w-full max-w-md">
        <div class="mb-6 sm:mb-8">
          <img src="/raposologo.png" alt="Logo Raposo Pl\u00e1sticos" class="w-32 sm:w-44 mb-4 mx-auto sm:mx-0" />
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Bem-vindo de volta!</h1>
          <p class="text-sm text-gray-400 mt-1 text-center sm:text-left">Entre com suas credenciais para acessar sua conta</p>
        </div>

        <div class="bg-white rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.04)] p-4 sm:p-6 border border-gray-100">
          <Message
            v-if="error"
            severity="error"
            closable
            @close="error = ''"
            class="mb-4 text-sm"
            role="alert"
            aria-live="assertive"
          >
            {{ error }}
          </Message>

          <form @submit.prevent="handleSubmit" class="space-y-4" role="login" aria-label="Login" novalidate>
            <div class="flex flex-col gap-1.5">
              <label for="login-email" class="text-sm font-semibold text-gray-700">E-mail:</label>
              <IconField>
                <InputIcon><i class="pi pi-envelope text-gray-400" aria-hidden="true" /></InputIcon>
                <InputText
                  id="login-email"
                  v-model="email"
                  type="email"
                  placeholder="meu@email.com"
                  class="w-full pl-9"
                  autocomplete="username"
                  aria-required="true"
                />
              </IconField>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="login-password" class="text-sm font-semibold text-gray-700">Senha:</label>
              <Password
                id="login-password"
                v-model="password"
                placeholder="Senha"
                :feedback="false"
                toggleMask
                class="w-full"
                inputClass="w-full"
                autocomplete="current-password"
                aria-required="true"
              />
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input id="login-remember" type="checkbox" class="w-3.5 h-3.5 accent-[#2a6a9e]" />
                <span class="text-xs text-gray-500">Lembrar-me</span>
              </label>
              <button type="button" class="text-xs font-medium text-[#2a6a9e] hover:underline">
                Esqueceu a senha?
              </button>
            </div>

            <Button
              label="Entrar"
              icon="pi pi-arrow-right"
              iconPos="right"
              type="submit"
              :loading="loading"
              :disabled="loading"
              class="w-full py-3 text-base font-semibold bg-[#2a6a9e] border-[#2a6a9e] hover:bg-[#1e5279] hover:border-[#1e5279]"
              aria-label="Fazer login"
            />
          </form>
        </div>

        <p class="text-xs text-gray-400 mt-4 text-center">
          Ao entrar, voc\u00ea concorda com nossos
          <button type="button" class="text-[#2a6a9e] underline">Termos de Servi\u00e7o</button> e
          <button type="button" class="text-[#2a6a9e] underline">Pol\u00edtica de Privacidade</button>
        </p>
      </div>
    </main>

    <!-- painel visual (direita) -->
    <div class="hidden lg:flex flex-1 items-center justify-center bg-[#e8edf4] relative overflow-hidden" aria-hidden="true">
      <div class="text-center max-w-md px-8 z-10">
        <div class="mb-8">
          <img src="/raposologo.png" alt="" class="w-44 mx-auto" aria-hidden="true" />
        </div>
        <p class="text-lg font-bold text-gray-700 mb-2">Acesso Seguro e Inteligente</p>
        <p class="text-sm text-gray-500 leading-relaxed">
          Login protegido com tecnologia de autentica\u00e7\u00e3o moderna, garantindo um acesso seguro e eficiente \u00e0 interface do Raposo Pl\u00e1sticos Dashboard.
        </p>
      </div>

      <!-- c\u00edrculo decorativo de fundo -->
      <div class="absolute w-96 h-96 border-2 border-[#cdd8e8] rounded-full opacity-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <div class="absolute w-72 h-72 border border-[#cdd8e8] rounded-full opacity-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
    </div>
  </div>
</template>
