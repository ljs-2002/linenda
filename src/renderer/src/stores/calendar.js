import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref([])

  const addEvent = (event) => {
    events.value.push(event)
  }

  // 初始化加载所有事件
  const initializeEvents = async () => {
    const loadedEvents = await window.electron.ipcRenderer.invoke('get-all-events')
    events.value = loadedEvents.map((event) => ({
      ...event,
      durationEditable: true,
      startEditable: true,
      allDay: Boolean(event.allDay)
    }))
  }

  const updateEvents = (newEvents) => {
    events.value = newEvents
  }

  return {
    events,
    addEvent,
    updateEvents,
    initializeEvents
  }
})
