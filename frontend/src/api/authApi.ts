import api from './client'

export function login(email: string, password: string): Promise<{ access_token: string }> {
  return api.post('/auth/login', { email, password }).then((r) => r.data)
}
