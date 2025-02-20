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
  const dailyEventCounts = ref({})
  const urgencyTags = ref([])
  const typeTags = ref([])

  const updateDailyCounts = (dates, urgencyTagId, isAdd = true) => {
    if (!urgencyTagId) return

    dates.forEach((dateKey) => {
      // 确保对象存在
      if (!dailyEventCounts.value[dateKey]) {
        dailyEventCounts.value[dateKey] = {}
      }

      if (isAdd) {
        if (!dailyEventCounts.value[dateKey][urgencyTagId]) {
          dailyEventCounts.value[dateKey][urgencyTagId] = 0
        }
        dailyEventCounts.value[dateKey][urgencyTagId]++
      } else {
        if (dailyEventCounts.value[dateKey][urgencyTagId]) {
          dailyEventCounts.value[dateKey][urgencyTagId]--
          if (dailyEventCounts.value[dateKey][urgencyTagId] === 0) {
            delete dailyEventCounts.value[dateKey][urgencyTagId]
          }
        }
      }

      // 如果该日期没有任何事件，删除该日期的记录
      if (Object.keys(dailyEventCounts.value[dateKey]).length === 0) {
        delete dailyEventCounts.value[dateKey]
      }
    })
  }

  const getDailyEventCounts = (date) => {
    const dateKey = formatDateKey(date)
    return dailyEventCounts.value[dateKey] || {}
  }

  const addEvent = async (event) => {
    const newEvent = transformEvent(event)
    console.log('newEvent', newEvent)
    await window.electron.ipcRenderer.invoke('add-event', newEvent)
    const dates = getDateRange(newEvent.start, newEvent.end)
    updateDailyCounts(dates, newEvent.urgencyTagId, true)
  }

  const removeEvent = async (event) => {
    await window.electron.ipcRenderer.invoke('delete-event', event.id)
    events.value = events.value.filter((e) => e.id !== event.id)
    const dates = getDateRange(event.start, event.end)
    updateDailyCounts(dates, event.extendedProps?.urgencyTagId, false)
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

  const getTypeTagById = (id) => {
    return typeTags.value.find((tag) => tag.id === id)
  }

  // 初始化加载所有事件
  const initializeEvents = async () => {
    const [loadedEvents, loadedUrgencyTags, loadedTypeTags] = await Promise.all([
      window.electron.ipcRenderer.invoke('get-all-events'),
      window.electron.ipcRenderer.invoke('get-all-urgency-tags'),
      window.electron.ipcRenderer.invoke('get-all-type-tags')
    ])
    urgencyTags.value = loadedUrgencyTags
    typeTags.value = loadedTypeTags
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
  }

  const setEvents = (newEvents) => {
    events.value = newEvents.map((event) => {
      const { extendedProps, ...obj } = event.toPlainObject()
      return {
        ...obj,
        ...extendedProps
      }
    })
  }

  return {
    events,
    getDailyEventCounts,
    getUrgencyTagById,
    getTypeTagById,
    addEvent,
    removeEvent,
    changeEvent,
    setEvents,
    initializeEvents
  }
})
