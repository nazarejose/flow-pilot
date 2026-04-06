import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = true
  const token = 'mock-jwt-token'
  const user = {
    name: 'Admin User',
    email: 'admin@flowpilot.com',
    role: 'admin',
    companyId: '1',
  }

  function isLoggedIn(): boolean {
    return isAuthenticated
  }

  function userRole(): string {
    return user.role
  }

  return {
    isAuthenticated,
    token,
    user,
    isLoggedIn,
    userRole,
  }
})
