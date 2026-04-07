import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routeMeta: Record<string, { title: string; description: string }> = {
  login: { title: 'Login — FlowPilot', description: 'Entre com suas credenciais para acessar a plataforma de gestão de chamados corporativa.' },
  dashboard: { title: 'Dashboard — FlowPilot', description: 'Acompanhe indicadores e métricas dos chamados da sua empresa.' },
  'meus-chamados': { title: 'Meus Chamados — FlowPilot', description: 'Acompanhe e gerencie seus chamados abertos.' },
  'tickets-new': { title: 'Abrir Chamado — FlowPilot', description: 'Abra um novo chamado para solicitar atendimento.' },
  'tickets-detail': { title: 'Detalhe do Chamado — FlowPilot', description: 'Acompanhe o andamento e converse sobre o chamado.' },
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/tickets',
    name: 'meus-chamados',
    component: () => import('../views/MeusChamadosView.vue'),
  },
  {
    path: '/tickets/new',
    name: 'tickets-new',
    component: () => import('../views/CreateTicketView.vue'),
  },
  {
    path: '/tickets/:id',
    name: 'tickets-detail',
    component: () => import('../views/TicketDetailView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})

router.beforeEach((to) => {
  const hasToken = !!localStorage.getItem('flowpilot_token')
  if (to.meta.public) return true
  if (!hasToken && to.path !== '/login') return { path: '/login' }
  if (hasToken && to.path === '/login') return { path: '/tickets' }
  return true
})

router.afterEach((to) => {
  const meta = routeMeta[to.name as string]
  if (meta) {
    document.title = meta.title
    const existing = document.querySelector('meta[name="description"]')
    if (existing) {
      existing.setAttribute('content', meta.description)
    }
  }
})

export default router
