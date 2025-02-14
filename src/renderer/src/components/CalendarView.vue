<template>
  <div class="calendar-view">
    <FullCalendar :options="calendarOptions" />
    <EventDialog ref="eventDialogRef" @save="handleEventSave" />
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
import { useCalendarStore } from '../stores/calendar'

const calendarStore = useCalendarStore()
const eventDialogRef = ref(null)

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
    allDay: false,
    calendar: selectInfo.view.calendar
  })
  selectInfo.view.calendar.unselect() // clear date selection
}

const handleEventSave = (eventData) => {
  const { calendar, ...eventDetails } = eventData
  const newEvent = {
    ...eventDetails,
    id: Date.now().toString() // 简单的ID生成
  }
  calendar.addEvent(newEvent)
}

const handleEventSet = (events) => {
  calendarStore.updateEvents(events)
}

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listYear'
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  events: calendarStore.events,
  select: handleDateSelect,
  eventsSet: handleEventSet
}
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
