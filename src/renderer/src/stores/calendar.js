import { defineStore } from 'pinia'
import { ref } from 'vue'

const transformEvent = (event) => {
  const { extendedProps, ...rest } = event.toPlainObject()
  console.log('event', event.toPlainObject())
  return {
    ...rest,
    ...extendedProps,
    allDay: Number(event.allDay),
    className: event.classNames.join(',')
  }
}

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref([])

  const addEvent = async (event) => {
    const newEvent = transformEvent(event)
    await window.electron.ipcRenderer.invoke('add-event', newEvent)
  }

  const removeEvent = async (event) => {
    await window.electron.ipcRenderer.invoke('delete-event', event.id)
  }

  const changeEvent = async (event) => {
    try {
      const eventDetails = transformEvent(event)
      await window.electron.ipcRenderer.invoke('update-event', eventDetails)
    } catch (error) {
      console.error('更新事件失败', error)
    }
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

  const setEvents = (newEvents) => {
    events.value = newEvents.map((event) => {
      return event.toPlainObject()
    })
  }

  return {
    events,
    addEvent,
    removeEvent,
    changeEvent,
    setEvents,
    initializeEvents
  }
})
