import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/calendar' },
  { path: '/calendar', component: () => import('./components/CalendarView.vue') },
  { path: '/tasks', component: () => import('./components/TasksView.vue') },
  { path: '/settings', component: () => import('./components/SettingsView.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
