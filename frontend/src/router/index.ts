import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/meu-dia',
      name: 'meu-dia',
      component: () => import('../views/MeuDiaView.vue'),
    },
    {
      path: '/minhas-tarefas',
      name: 'minhas-tarefas',
      component: () => import('../views/MinhasTarefasView.vue'),
    },
    {
      path: '/meus-planners',
      name: 'meus-planners',
      component: () => import('../views/MeusPlannersView.vue'),
    },
    {
      path: '/helpdesk',
      name: 'helpdesk',
      component: () => import('../views/HelpdeskView.vue'),
    },
  ],
})

export default router
