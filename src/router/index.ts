import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/teams'
    },
    // Auth routes
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue')
    },
    // Dashboard routes
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue')
    },
    // Team routes
    {
      path: '/teams',
      name: 'teams',
      component: () => import('@/views/teams/TeamsView.vue')
    },
    {
      path: '/teams/:id',
      name: 'team-detail',
      component: () => import('@/views/teams/TeamDetailView.vue')
    },
    // Notifications route
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/notifications/NotificationsView.vue')
    },
    // Settings route
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue')
    }
  ]
})

export default router
