<template>
  <div class="calendar-view">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
    <EventDialog ref="eventDialogRef" @save="handleEventSave" />
    <EventDetailsDialog
      ref="eventDetailsDialogRef"
      @save="handleEventUpdate"
      @delete="handleEventDelete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'

import EventDialog from './EventDialog.vue'
import EventDetailsDialog from './EventDetailsDialog.vue'
import { useCalendarStore } from '../stores/calendar'

const calendarStore = useCalendarStore()
const eventDialogRef = ref(null)
const eventDetailsDialogRef = ref(null)
const calendarRef = ref(null)

const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const handleDateSelect = (selectInfo) => {
  let startTime = new Date(selectInfo.startStr)
  let endTime = new Date(selectInfo.endStr)
  startTime.setHours(0, 0, 0, 0)
  endTime.setHours(0, 0, 0, 0)
  eventDialogRef.value?.showDialog({
    start: formatDateTime(startTime),
    end: formatDateTime(endTime),
    allDay: selectInfo.allDay,
    calendar: selectInfo.view.calendar
  })
  selectInfo.view.calendar.unselect() // clear date selection
}

const handleEventSave = async (eventData) => {
  const { calendar, ...eventDetails } = eventData
  const newEvent = {
    ...eventDetails,
    id: Date.now().toString() // 简单的ID生成
  }
  calendar.addEvent(newEvent)
  newEvent.allDay = Number(newEvent.allDay) // 转换 Boolean 为 INTEGER
  await window.electron.ipcRenderer.invoke('add-event', newEvent)
}

const handleEventSet = (events) => {
  calendarStore.updateEvents(events)
}

const handleEventClick = async (clickInfo) => {
  console.log(clickInfo.event)

  eventDetailsDialogRef.value?.showDialog({
    ...clickInfo.event.toPlainObject(),
    calendar: clickInfo.view.calendar
  })
}

const handleEventUpdate = async (eventData) => {
  const { calendar, ...eventDetails } = eventData
  // 更新日历显示
  const event = calendar.getEventById(eventDetails.id)
  if (event) {
    event.setProp('title', eventDetails.title)
    event.setStart(eventDetails.start)
    event.setEnd(eventDetails.end)
    event.setAllDay(eventDetails.allDay)
    event.setExtendedProp('description', eventDetails.description)
  }
  // 更新数据库
  try {
    await window.electron.ipcRenderer.invoke('update-event', {
      ...eventDetails,
      allDay: Number(eventDetails.allDay)
    })
  } catch (error) {
    console.error('更新事件失败', error)
  }
}

const handleEventDelete = async (eventData) => {
  const event = eventData.calendar.getEventById(eventData.id)
  if (event) {
    event.remove()
    await window.electron.ipcRenderer.invoke('delete-event', eventData.id)
  }
}

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listYear'
  },
  editable: true,
  selectable: true,
  eventDurationEditable: true,
  eventResizableFromStart: true,
  unselectAuto: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  events: calendarStore.events,
  select: handleDateSelect,
  eventsSet: handleEventSet,
  eventClick: handleEventClick
  // eventChange
  // eventAdd
  // eventRemove
})
</script>

<style>
.calendar-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
  height: 100%; /* 修改这里 */
  width: 100%;
}

.calendar-view .fc {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}
</style>
