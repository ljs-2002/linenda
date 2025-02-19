<template>
  <div class="calendar-view">
    <CustomHeader
      :date="currentDate"
      :title="headerTitle"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @toggle-sidebar="emitToggleSidebar"
    />
    <FullCalendar ref="calendarRef" :options="calendarOptions">
      <template #dayCellContent="arg">
        <div class="calendar-day">
          <div :class="['day-content', { today: !arg.isPast && !arg.isFuture }]">
            <label class="day-label">{{ arg.date.getDate() }}</label>
            <span
              :class="[
                'lunar-text',
                { festival: getLunarDate(arg.date).festival },
                { 'today-lunar': !arg.isPast && !arg.isFuture }
              ]"
            >
              {{ getLunarDate(arg.date).festival || getLunarDate(arg.date).lunarDayName }}
            </span>
          </div>
          <div v-if="hasDailyEvents(arg.date)" class="event-dots">
            <template v-for="[tagId, count] in getDailyEventCounts(arg.date)" :key="tagId">
              <div v-if="count > 0" class="event-tag-count">
                <TagIcon :tag="getUrgencyTag(Number(tagId))" />
                <span class="count">{{ count }}</span>
              </div>
            </template>
          </div>
        </div>
      </template>
      <template #dayHeaderContent="arg">
        <span class="header-text">{{ arg.text.slice(-1) }}</span>
      </template>
    </FullCalendar>
    <EventDialog ref="eventDialogRef" @save="saveEvent" />
    <EventDetailsDialog ref="eventDetailsDialogRef" @update="updateEvent" @delete="deleteEvent" />
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useCalendarStore } from '../stores/calendar'
import { Lunar } from 'lunar-javascript'

import EventDialog from './EventDialog.vue'
import EventDetailsDialog from './EventDetailsDialog.vue'
import CustomHeader from './CustomHeader.vue'
import TagIcon from './TagIcon.vue'

const emit = defineEmits(['toggle-sidebar'])

const handleSidebarToggle = async () => {
  await nextTick()
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.updateSize()
  }
}

const emitToggleSidebar = async () => {
  emit('toggle-sidebar')
  await handleSidebarToggle()
}

const calendarStore = useCalendarStore()
const eventDialogRef = ref(null)
const eventDetailsDialogRef = ref(null)
const calendarRef = ref(null)

const currentDate = ref(new Date())
const headerTitle = ref('')

const formatDateTime = (date) => {
  console.log('formatDateTime', date)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

//###########################################################
// event-dots 显示逻辑
//###########################################################
const getUrgencyTag = (tagId) => {
  console.log('getUrgencyTag', calendarStore.urgencyTags, tagId)
  return calendarStore.getUrgencyTagById(tagId)
}

const getDailyEventCounts = (date) => {
  const tagCounts = calendarStore.getDailyEventCounts(date)
  const sortedtagCounts = Object.entries(tagCounts).sort(
    (tagCount1, tagCount2) => tagCount2[0] - tagCount1[0]
  )
  if (Object.keys(sortedtagCounts).length > 0) {
    console.log('getDailyEventCounts', sortedtagCounts)
  }

  return sortedtagCounts
}

const hasDailyEvents = (date) => {
  const counts = getDailyEventCounts(date)
  return Object.keys(counts).length > 0
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
  calendarRef.value.getApi().select(date)
  return date
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
  console.log(selectInfo)
  if (!selectInfo.jsEvent) {
    // 如果不是由用户交互触发的选择
    return
  }
  const startTime = new Date(selectInfo.startStr)
  const endTime = new Date(selectInfo.endStr)
  const isOneDay = endTime.getTime() - startTime.getTime() === 24 * 60 * 60 * 1000
  if (isOneDay) {
    // 只选择了一天
    if (currentDate.value.getDate() === startTime.getDate()) {
      // 选择了当前日期
      eventDialogRef.value?.showDialog({
        start: formatDateTime(startTime),
        end: formatDateTime(endTime),
        allDay: false,
        calendar: selectInfo.view.calendar
      })
    }
    currentDate.value = startTime
    calendarRef.value.getApi().gotoDate(startTime)
    updateHeaderTitle()
    // selectInfo.view.calendar.unselect();
  } else {
    // 选择了多个日期
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

// 添加农历日期计算函数
const getLunarDate = (date) => {
  const lunar = Lunar.fromDate(date)
  return {
    lunarDayName: lunar.getDayInChinese(),
    festival: lunar.getFestivals().join(' ') || ''
  }
}

const calendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'zh-cn',
  headerToolbar: false,
  footerToolbar: false,
  editable: true,
  selectable: true,
  dayMaxEvents: false,
  eventDisplay: 'none',
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
  --day-size: 46px;
  --day-radius: 50%;
  --dot-size: 4px;
  --date-font-size: 22px;
  --lunar-font-size: 12px;
  --header-font-size: 14px;
  --tr-height: 68px;
  --header-tr-height: 20px;
  --event-tag-font-size: 11px;

  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

/* 确保日期内容容器的样式正确 */
:deep(.calendar-day) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--day-size);
  height: var(--day-size);
  border-radius: var(--day-radius);
  position: relative;
}

:deep(.day-content) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--day-radius);
}

:deep(.day-label) {
  font-size: var(--date-font-size);
  font-weight: 600;
  line-height: 1.2;
  color: #333;
}

:deep(.event-dots) {
  position: absolute;
  bottom: -14px;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.event-tag-count) {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: #fff;
  padding: 0px 2px;
  border-radius: 4px;
  font-size: var(--event-tag-font-size);
}

:deep(.event-tag-count:not(:last-child))::after {
  content: '|';
  color: #6e6e6e;
  margin-left: 2px;
  font-size: var(--event-tag-font-size);
}

:deep(.count) {
  font-size: var(--event-tag-font-size);
  font-weight: 500;
  color: #666;
  line-height: 1;
}

:deep(.lunar-text) {
  font-size: var(--lunar-font-size);
  color: #999;
  line-height: 1;
  margin-top: 2px;
  margin-bottom: 6px;
}

:deep(.festival) {
  color: #ff4d4f;
}

/* 当天的样式 */
:deep(.today) {
  border: 1px solid #1890ff;
  width: var(--day-size);
  height: var(--day-size);
  border-radius: var(--day-radius);
}

:deep(.today-lunar) {
  color: #1890ff;
}

:deep(.header-text) {
  font-size: var(--header-font-size);
  color: #333;
}

/* 移除表格边框 */
:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border: none !important;
}

:deep(.fc-theme-standard .fc-scrollgrid) {
  border: none !important;
}

:deep(.fc-scrollgrid-sync-table) {
  height: auto !important;
}

/* 调整日历单元格布局和间距 */
:deep(.fc-daygrid-day) {
  background: none !important;
  padding: 0 !important; /* 减小单元格间距 */
}

:deep(.fc-daygrid-body) {
  width: 100% !important;
}

:deep(.fc-daygrid-body table) {
  width: 100% !important;
}

/* 减小行间距 */
:deep(tr) {
  height: var(--tr-height); /* 减小行高 */
}

:deep(.fc-scrollgrid-section-header tr) {
  height: var(--header-tr-height) !important;
}

:deep(.fc-daygrid-day-frame) {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 100%;
  width: var(--day-size);
  margin: auto;
  border-radius: var(--day-radius);
  background: none !important;
}

:deep(.fc-daygrid-day-top) {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2px;
}

:deep(.fc-daygrid-day-events) {
  display: none;
}

:deep(.fc-daygrid-bg-harness) {
  position: absolute;
  height: var(--day-size);
  background-color: transparent;
  top: 50%;
  transform: translateY(-50%);
  border-radius: calc(var(--day-size) / 2);
}

:deep(.fc-highlight) {
  height: var(--day-size);
  border-radius: calc(var(--day-size) / 2);
}

/* 确保选中和当天状态的圆圈大小一致 */
:deep(.fc-day-today .calendar-day) {
  width: var(--day-size);
  height: var(--day-size);
  border-radius: var(--day-radius);
}
</style>
