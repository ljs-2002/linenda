<template>
  <div class="event-card">
    <div class="event-header">
      <h3 class="event-title">{{ event.title }}</h3>
      <div :class="['event-status', status.class]">
        {{ status.text }}
      </div>
    </div>
    <div class="event-time">
      <div class="time-container">
        <div class="time-item">
          <strong>开始：</strong>
          <span>{{ formattedStartTime }}</span>
        </div>
        <div class="time-item">
          <strong>结束：</strong>
          <span>{{ formattedEndTime }}</span>
        </div>
      </div>
    </div>
    <div v-if="event.description" class="event-description">
      <strong>描述：</strong>{{ event.description }}
    </div>
    <div v-if="event.url" class="event-url">
      <strong>链接：</strong><a :href="event.url" target="_blank">查看详情</a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'

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
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-width: 0;
  box-sizing: border-box;
  margin: 0;
  user-select: text;
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
  user-select: text;
}

.time-container {
  display: flex;
  gap: 32px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-time {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 0;
  margin-bottom: 12px;
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
  margin-bottom: 12px;
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
</style>
