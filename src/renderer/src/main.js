import './assets/main.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './index'
import { createPinia } from 'pinia'
import { useCalendarStore } from './stores/calendar'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(ElementPlus)

// 创建异步初始化函数
const initializeApp = async () => {
  const calendarStore = useCalendarStore()
  await calendarStore.initializeEvents()
  app.mount('#app')
}

// 执行初始化
initializeApp().catch(console.error)
