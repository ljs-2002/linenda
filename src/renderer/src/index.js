import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarView from './components/CalendarView.vue'
import TasksView from './components/TasksView.vue'
import SettingsView from './components/SettingsView.vue'

const routes = [
  { path: '/', redirect: '/calendar' },
  { path: '/calendar', component: CalendarView },
  { path: '/tasks', component: TasksView },
  { path: '/settings', component: SettingsView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
