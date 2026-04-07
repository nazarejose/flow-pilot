import axios from 'axios'
import type { ApiError } from './types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth interceptor — attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowpilot_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data && typeof config.data === 'object') {
    const cleaned = { ...config.data }
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === '' && k !== 'password') delete cleaned[k]
    })
    config.data = cleaned
  }
  return config
})

// Error interceptor — map HTTP errors to Portuguese messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status
    const message = error.response?.data?.message || error.message

    let userMessage = 'Erro inesperado. Tente novamente.'

    if (error.response?.status === 401) {
      userMessage = 'Sessão expirada. Faça login novamente.'
    } else if (error.response?.status === 403) {
      userMessage = 'Você não tem permissão para esta ação.'
    } else if (error.response?.status === 404) {
      userMessage = 'Recurso não encontrado.'
    } else if (error.response?.status === 429) {
      userMessage = 'Muitas requisições. Aguarde um momento.'
    } else if (statusCode && statusCode >= 500) {
      userMessage = 'Erro no servidor. Tente novamente mais tarde.'
    } else if (message) {
      userMessage = message
    }

    const apiError: ApiError = {
      success: false,
      error: userMessage,
      statusCode,
    }

    return Promise.reject(apiError)
  },
)

export default api
