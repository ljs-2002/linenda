<template>
  <div class="calendar-view">
    <CustomHeader
      :date="currentDate"
      :title="headerTitle"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
    />
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
    <EventDialog ref="eventDialogRef" @save="saveEvent" />
    <EventDetailsDialog ref="eventDetailsDialogRef" @update="updateEvent" @delete="deleteEvent" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import EventDialog from './EventDialog.vue'
import EventDetailsDialog from './EventDetailsDialog.vue'
import CustomHeader from './CustomHeader.vue'
import { useCalendarStore } from '../stores/calendar'

const calendarStore = useCalendarStore()
const eventDialogRef = ref(null)
const eventDetailsDialogRef = ref(null)
const calendarRef = ref(null)

const currentDate = ref(new Date())
const headerTitle = ref('')

const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

//###########################################################
// 子组件回调
//###########################################################
const saveEvent = async (eventData) => {
  const { calendar, ...eventDetails } = eventData
  const newEvent = {
    ...eventDetails,
    id: Date.now().toString()
  }
  calendar.addEvent(newEvent)
}

const updateEvent = async (eventData) => {
  const { calendar, ...eventDetails } = eventData
  // 更新日历显示
  const event = calendar.getEventById(eventDetails.id)
  if (event) {
    event.setProp('title', eventDetails.title)
    event.setProp('color', eventDetails.color)
    event.setDates(eventDetails.start, eventDetails.end, { allDay: eventDetails.allDay })
    event.setExtendedProp('description', eventDetails.description)
    event.setExtendedProp('typeTagIds', eventDetails.typeTagIds)
    event.setExtendedProp('urgencyTagId', eventDetails.urgencyTagId)
  }
}

const deleteEvent = async (eventData) => {
  const event = eventData.calendar.getEventById(eventData.id)
  if (event) {
    event.remove()
  }
}

const updateHeaderTitle = () => {
  const calendarApi = calendarRef.value.getApi()
  const date = calendarApi.getDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  headerTitle.value = `${year}年${month}月`
  currentDate.value = date
}

const handlePrev = () => {
  const calendarApi = calendarRef.value.getApi()
  calendarApi.prev()
  updateHeaderTitle()
}

const handleNext = () => {
  const calendarApi = calendarRef.value.getApi()
  calendarApi.next()
  updateHeaderTitle()
}

const handleToday = () => {
  const calendarApi = calendarRef.value.getApi()
  calendarApi.today()
  updateHeaderTitle()
}

//###########################################################
// FullCalendar 事件处理
//###########################################################
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

const handleEventSet = (events) => {
  calendarStore.setEvents(events)
}

const handleEventClick = async (clickInfo) => {
  console.log(clickInfo.event.toPlainObject())

  eventDetailsDialogRef.value?.showDialog({
    ...clickInfo.event.toPlainObject(),
    calendar: clickInfo.view.calendar
  })
}

const handleEventAdd = async (addInfo) => {
  await calendarStore.addEvent(addInfo.event)
}

const handleEventRemove = async (deleteInfo) => {
  await calendarStore.removeEvent(deleteInfo.event)
}

const handleEventChange = async (changeInfo) => {
  await calendarStore.changeEvent(changeInfo.event)
}

const calendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'zh-cn',
  headerToolbar: false,
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
  eventClick: handleEventClick,
  eventAdd: handleEventAdd,
  eventRemove: handleEventRemove,
  eventChange: handleEventChange
}

onMounted(() => {
  updateHeaderTitle()
})
</script>

<style scoped>
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
