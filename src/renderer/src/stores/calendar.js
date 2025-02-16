import { defineStore } from 'pinia'
import { ref } from 'vue'

const transformEvent = (event) => {
  const { extendedProps, ...rest } = event.toPlainObject()
  return {
    ...rest,
    ...extendedProps,
    typeTagIds: [...extendedProps.typeTagIds],
    allDay: Number(event.allDay)
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
    const eventsWithTags = await Promise.all(
      loadedEvents.map(async (event) => {
        const tags = await window.electron.ipcRenderer.invoke('get-event-tags', event.id)
        console.log(tags)
        return {
          ...event,
          durationEditable: true,
          startEditable: true,
          allDay: Boolean(event.allDay),
          urgencyTagId: tags.urgencyTag?.id,
          typeTagIds: [...tags.typeTags.map((tag) => tag.id)]
        }
      })
    )
    events.value = eventsWithTags
    console.log(eventsWithTags)
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
