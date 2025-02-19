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

const formatDateKey = (date) => {
  return date instanceof Date ? date.toDateString() : new Date(date).toDateString()
}

const getDateRange = (start, end) => {
  const dates = []
  const current = new Date(start)
  const endDate = new Date(end)

  while (current < endDate) {
    dates.push(formatDateKey(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export const useCalendarStore = defineStore('calendar', () => {
  const events = ref([])
  const dailyEventCounts = ref(new Map())
  const urgencyTags = ref([])

  const updateDailyCounts = (dates, urgencyTagId, isAdd = true) => {
    if (!urgencyTagId) return

    dates.forEach((dateKey) => {
      const currentCounts = dailyEventCounts.value.get(dateKey) || {}
      if (isAdd) {
        currentCounts[urgencyTagId] = (currentCounts[urgencyTagId] || 0) + 1
      } else {
        currentCounts[urgencyTagId] = Math.max(0, (currentCounts[urgencyTagId] || 0) - 1)
        if (currentCounts[urgencyTagId] === 0) {
          delete currentCounts[urgencyTagId]
        }
      }

      if (Object.keys(currentCounts).length > 0) {
        dailyEventCounts.value.set(dateKey, currentCounts)
      } else {
        dailyEventCounts.value.delete(dateKey)
      }
    })
  }

  const getDailyEventCounts = (date) => {
    const counts = dailyEventCounts.value.get(formatDateKey(date)) || {}
    // 转换为普通对象
    return Object.fromEntries(Object.entries(counts))
  }

  const addEvent = async (event) => {
    const newEvent = transformEvent(event)
    await window.electron.ipcRenderer.invoke('add-event', newEvent)
    const dates = getDateRange(newEvent.start, newEvent.end)
    updateDailyCounts(dates, newEvent.urgencyTagId, true)
  }

  const removeEvent = async (event) => {
    await window.electron.ipcRenderer.invoke('delete-event', event.id)
    const dates = getDateRange(event.start, event.end)
    updateDailyCounts(dates, event.urgencyTagId, false)
  }

  const changeEvent = async (event) => {
    try {
      const eventDetails = transformEvent(event)
      const oldEvent = events.value.find((e) => e.id === eventDetails.id)

      if (oldEvent) {
        const oldDates = getDateRange(oldEvent.start, oldEvent.end)
        updateDailyCounts(oldDates, oldEvent.urgencyTagId, false)
      }

      const newDates = getDateRange(eventDetails.start, eventDetails.end)
      updateDailyCounts(newDates, eventDetails.urgencyTagId, true)

      await window.electron.ipcRenderer.invoke('update-event', eventDetails)
    } catch (error) {
      console.error('更新事件失败', error)
    }
  }

  const getUrgencyTagById = (id) => {
    return urgencyTags.value.find((tag) => tag.id === id)
  }

  // 初始化加载所有事件
  const initializeEvents = async () => {
    const [loadedEvents, loadedTags] = await Promise.all([
      window.electron.ipcRenderer.invoke('get-all-events'),
      window.electron.ipcRenderer.invoke('get-all-urgency-tags')
    ])
    urgencyTags.value = loadedTags
    const eventsWithTags = await Promise.all(
      loadedEvents.map(async (event) => {
        const tags = await window.electron.ipcRenderer.invoke('get-event-tags', event.id)
        const dates = getDateRange(event.start, event.end)
        updateDailyCounts(dates, tags.urgencyTag?.id, true)
        return {
          ...event,
          color: tags.urgencyTag?.color,
          durationEditable: true,
          startEditable: true,
          allDay: Boolean(event.allDay),
          urgencyTagId: tags.urgencyTag?.id,
          typeTagIds: [...tags.typeTags.map((tag) => tag.id)]
        }
      })
    )
    events.value = eventsWithTags
    console.log('dayliEventCounts', dailyEventCounts.value)
  }

  const setEvents = (newEvents) => {
    events.value = newEvents.map((event) => {
      return event.toPlainObject()
    })
  }

  return {
    events,
    urgencyTags,
    getDailyEventCounts,
    getUrgencyTagById,
    addEvent,
    removeEvent,
    changeEvent,
    setEvents,
    initializeEvents
  }
})
