<template>
  <div class="calendar-view" :class="{ 'week-view': isWeekView }">
    <CustomHeader
      :date="currentDate"
      :title="headerTitle"
      @prev="handlePrev"
      @next="handleNext"
      @today="handleToday"
      @toggle-sidebar="emitToggleSidebar"
    />
    <div class="calendar-container">
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
      <div class="view-toggle" @click="toggleWeekView">
        <span class="toggle-arrow" :class="{ 'arrow-down': isWeekView }">▲</span>
      </div>
    </div>

    <!-- 事件展示区域 -->
    <div v-if="isWeekView" class="events-panel">
      <perfect-scrollbar>
        <div v-if="currentDayEvents.length" class="events-list">
          <EventCard
            v-for="event in currentDayEvents"
            :key="event.id"
            :event="event"
            class="event-item"
            @click="handleEventCardClick(event)"
          />
        </div>
        <div v-else class="no-events">暂无事件</div>
      </perfect-scrollbar>
    </div>
    <EventDialog
      ref="eventDialogRef"
      @save="saveEvent"
      @update="updateEvent"
      @delete="deleteEvent"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useCalendarStore } from '../stores/calendar'
import { Lunar } from 'lunar-javascript'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'

import EventDialog from './EventDialog.vue'
import CustomHeader from './CustomHeader.vue'
import TagIcon from './TagIcon.vue'
import EventCard from './EventCard.vue'

const calendarStore = useCalendarStore()
const eventDialogRef = ref(null)
const eventDetailsDialogRef = ref(null)
const calendarRef = ref(null)

const currentDate = ref(new Date())
const headerTitle = ref('')

const isWeekView = ref(false)

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
// 切换周视图
//###########################################################
const toggleWeekView = async () => {
  const calendarApi = calendarRef.value?.getApi()
  if (!calendarApi) return

  isWeekView.value = !isWeekView.value

  if (isWeekView.value) {
    // 切换到周视图
    calendarApi.changeView('dayGridWeek')
    calendarApi.gotoDate(currentDate.value)
    // 调整视图高度
    await nextTick()
    const viewContainer = calendarRef.value.$el.querySelector('.fc-view-harness')
    if (viewContainer) {
      viewContainer.style.height = '100px'
      viewContainer.style.minHeight = '100px'
      viewContainer.style.overflow = 'hidden'
    }
  } else {
    // 切换回月视图
    calendarApi.changeView('dayGridMonth')
    // 恢复原始高度
    await nextTick()
    const viewContainer = calendarRef.value.$el.querySelector('.fc-view-harness')
    if (viewContainer) {
      viewContainer.style.height = ''
      viewContainer.style.minHeight = ''
      viewContainer.style.overflow = 'hidden'
    }
    calendarApi.updateSize()
  }
  calendarApi.select(currentDate.value)
}

//###########################################################
// 周视图下事件显示
//###########################################################
const currentDayEvents = computed(() => {
  return calendarStore.events
    .filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      if (event.allDay) {
        eventEnd.setDate(eventEnd.getDate() - 1)
      }

      const currentDateValue = currentDate.value
      const currentDateStart = new Date(
        currentDateValue.getFullYear(),
        currentDateValue.getMonth(),
        currentDateValue.getDate()
      )
      const currentDateEnd = new Date(
        currentDateValue.getFullYear(),
        currentDateValue.getMonth(),
        currentDateValue.getDate(),
        23,
        59,
        59
      )

      // 检查事件是否与当前日期有重叠
      return (
        // 事件开始时间在当天
        (eventStart >= currentDateStart && eventStart <= currentDateEnd) ||
        // 事件结束时间在当天
        (eventEnd >= currentDateStart && eventEnd <= currentDateEnd) ||
        // 事件跨越当天（开始时间在当天之前，结束时间在当天之后）
        (eventStart <= currentDateStart && eventEnd >= currentDateEnd)
      )
    })
    .map((event) => ({
      ...event,
      tags: {
        urgencyTag: getUrgencyTag(event.urgencyTagId),
        typeTags: event.typeTagIds?.map((id) => calendarStore.getTypeTagById(id)) || []
      }
    }))
})

// 添加事件卡片点击处理
const handleEventCardClick = (event) => {
  eventDialogRef.value?.showDialog({
    ...event,
    calendar: calendarRef.value?.getApi()
  })
}

//###########################################################
// 侧边栏显示逻辑
//###########################################################
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

//###########################################################
// event-dots 显示逻辑
//###########################################################
const getUrgencyTag = (tagId) => {
  return calendarStore.getUrgencyTagById(tagId)
}

const getDailyEventCounts = (date) => {
  const tagCounts = calendarStore.getDailyEventCounts(date)
  const sortedtagCounts = Object.entries(tagCounts).sort(
    (tagCount1, tagCount2) => tagCount2[0] - tagCount1[0]
  )

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
  calendar.addEvent(eventDetails)
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
  eventChange: handleEventChange,
  views: {
    dayGridWeek: {
      titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
      dayHeaderFormat: { weekday: 'short' }
    }
  }
}

onMounted(() => {
  updateHeaderTitle()
})
</script>

<style scoped>
.calendar-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 8px 12px 4px rgba(0, 0, 0, 0.04);
}

.week-view .calendar-container {
  flex: 0 0 120px;
  min-height: 120px;
  max-height: 120px;
  position: relative; /* 确保定位上下文正确 */
}

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

  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden !important;
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

/* 周视图相关 */

.calendar-view.week-view {
  height: 100%; /* 改为100%以填充整个容器 */
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.fc) {
  height: 100% !important;
  overflow: hidden;
}

.calendar-view:not(.week-view) .calendar-container {
  flex: 1;
  height: 100%;
}

/* 修改切换按钮样式 */
.view-toggle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 16px;
  /* 移除背景色和阴影 */
  background-color: transparent;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
}

/* 周视图时调整切换按钮位置 */
.calendar-view:not(.week-view) .view-toggle {
  bottom: 10px; /* 月视图时的位置 */
}

.week-view .view-toggle {
  bottom: 2px;
}

.view-toggle:hover {
  background-color: transparent;
  transform: translateX(-50%);
}

.toggle-arrow {
  color: #666;
  font-size: 16px; /* 稍微调大箭头尺寸 */
}

.arrow-down {
  transform: rotate(180deg);
}

/* 事件展示区域 */
.events-panel {
  flex: 1;
  margin-top: 0; /* 移除顶部边距 */
  background-color: #ffffff;
  position: relative;
  z-index: 1; /* 确保在切换按钮之下 */
  box-shadow: inset 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: calc(100% - 120px);
  overflow: hidden;
}

:deep(.ps) {
  height: 100%;
  padding: 20px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.event-item {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.event-item:hover {
  transform: translateY(-2px);
}

.no-events {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 40px 0;
}
</style>
