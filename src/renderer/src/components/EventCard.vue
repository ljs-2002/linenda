<template>
  <div class="event-card">
    <div class="event-header">
      <div class="title-line">
        <TagIcon
          v-if="event.tags?.urgencyTag"
          :tag="event.tags.urgencyTag"
          :style-props="{ marginRight: '10px', fontSize: '22px', flexShrink: 0 }"
        />
        <h3 class="event-title" :title="event.title">{{ event.title }}</h3>
      </div>
      <div :class="['event-status', status.class]">
        {{ status.text }}
      </div>
    </div>
    <div v-if="event.tags?.typeTags?.length" class="type-tags">
      <TagIcon
        v-for="tag in event.tags.typeTags"
        :key="tag.id"
        :tag="tag"
        :style-props="{ marginRight: '8px', fontSize: '1.2em' }"
      />
    </div>
    <div class="event-time">
      <div class="time-container">
        <div class="time-wrapper">
          <div class="time-item" :title="formattedStartTime">
            <strong>开始：</strong>
            <span class="time-text">{{ formattedStartTime }}</span>
          </div>
          <div class="time-item" :title="formattedEndTime">
            <strong>结束：</strong>
            <span class="time-text">{{ formattedEndTime }}</span>
          </div>
        </div>
      </div>
    </div>
    <perfect-scrollbar v-if="event.description" class="event-description-container">
      <div class="event-description"><strong>描述：</strong>{{ event.description }}</div>
    </perfect-scrollbar>
    <div v-if="event.url" class="event-url">
      <strong>链接：</strong><a :href="event.url" target="_blank">查看详情</a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import TagIcon from './TagIcon.vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'

const props = defineProps({
  event: {
    type: Object,
    required: true
  }
})

const formattedStartTime = computed(() => {
  return formatDateTime(props.event.start, props.event.allDay)
})

const formattedEndTime = computed(() => {
  if (props.event.allDay) {
    // 对全天事件，结束时间减去一天
    const endDate = dayjs(props.event.end).subtract(1, 'day')
    return formatDateTime(endDate, props.event.allDay)
  }
  return formatDateTime(props.event.end, props.event.allDay)
})

const status = computed(() => {
  return getEventStatus(props.event)
})

const formatDateTime = (dateStr, isAllDay) => {
  return isAllDay ? dayjs(dateStr).format('YYYY-MM-DD') : dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const getEventStatus = (event) => {
  const now = dayjs()
  const start = dayjs(event.start)
  const end = dayjs(event.end)

  if (now.isBefore(start)) {
    return { text: '未开始', class: 'status-pending' }
  } else if (now.isAfter(end)) {
    return { text: '已完成', class: 'status-completed' }
  } else {
    return { text: '进行中', class: 'status-ongoing' }
  }
}
</script>

<style scoped>
.event-card {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 15px 20px 10px 20px; /* 上 右 下 左 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-width: 0;
  box-sizing: border-box;
  margin: 0;
  user-select: text;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden; /* 防止横向滚动 */
  max-width: 100%;
}

.title-line {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0; /* 确保flex子项可以收缩 */
}

.type-tags {
  margin: -4px 0 4px 0;
  display: flex;
  align-items: center;
  font-size: 18px; /* 增加基础字体大小 */
  flex-wrap: wrap; /* 允许标签换行 */
  gap: 8px; /* 使用gap替代margin，更均匀的间距 */
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.event-title {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  user-select: text;
}

.time-container {
  width: 100%;
}

.time-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.time-item {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  flex: 1 0 calc(50% - 6px);
}

.time-item strong {
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 8px;
}

.time-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.event-time {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 0;
  margin-bottom: 12px;
}

.event-description-container {
  flex: 1;
  min-height: 0;
  max-height: 200px;
  margin-bottom: 2px;
  position: relative;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
}

.event-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  user-select: text;
  padding-right: 8px;
  word-break: break-word; /* 确保长单词也能换行 */
  overflow-wrap: break-word;
  width: 100%;
  box-sizing: border-box;
}

.event-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 10px;
  user-select: none;
}

.status-pending {
  background-color: #e6f4ff;
  color: #1890ff;
}

.status-ongoing {
  background-color: #f6ffed;
  color: #52c41a;
}

.status-completed {
  background-color: #f5f5f5;
  color: #8c8c8c;
}

.event-description {
  margin-bottom: 4px;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  user-select: text;
}

.event-url {
  font-size: 14px;
}

.event-url a {
  color: #07c160;
  text-decoration: none;
  margin-left: 4px;
}

.event-card strong {
  color: #333;
  font-weight: 600;
}

:deep(.ps) {
  max-width: 100%;
  overflow-x: hidden !important;
}

:deep(.ps__rail-x) {
  display: none !important;
}
</style>
