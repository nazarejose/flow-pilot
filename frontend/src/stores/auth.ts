import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '../api/authApi'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  sub: string
  email: string
  name: string
  companyId: string
  sectorId: string
  role: string
}

function decodeUser(token: string) {
  const payload = jwtDecode<JwtPayload>(token)
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    companyId: payload.companyId,
    sectorId: payload.sectorId,
    role: payload.role,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const storedToken = localStorage.getItem('flowpilot_token') || ''

  // Reactive state
  const token = ref(storedToken)
  const user = ref(storedToken ? decodeUser(storedToken) : null)
  const isAuthenticated = computed(() => !!token.value)

  function isLoggedIn(): boolean {
    return !!token.value
  }

  function getUserRole(): string {
    return user.value?.role || ''
  }

  function setUser(newToken: string) {
    localStorage.setItem('flowpilot_token', newToken)
    token.value = newToken
    user.value = decodeUser(newToken)
  }

  function clearAuth() {
    localStorage.removeItem('flowpilot_token')
    token.value = ''
    user.value = null
  }

  async function doLogin(email: string, password: string) {
    const { access_token } = await loginApi(email, password)
    setUser(access_token)
    return access_token
  }

  function logout() {
    clearAuth()
  }

  return {
    isAuthenticated,
    token,
    user,
    isLoggedIn,
    getUserRole,
    doLogin,
    logout,
    setUser,
    clearAuth,
  }
})
