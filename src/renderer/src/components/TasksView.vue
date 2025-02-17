<template>
  <div class="tasks-view">
    <!-- 左侧第二侧边栏 -->
    <div class="second-sidebar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: currentTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        {{ tab.name }}
      </div>
    </div>

    <!-- 右侧事件列表 -->
    <perfect-scrollbar class="events-container">
      <div v-if="events.length === 0" class="no-events">暂无事件</div>
      <div v-else class="event-cards">
        <EventCard v-for="event in filteredEvents" :key="event.id" :event="event" />
      </div>
    </perfect-scrollbar>

    <!-- 添加过滤器组件 -->
    <EventFilter v-model="selectedFilters" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import EventCard from './EventCard.vue'
import EventFilter from './EventFilter.vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'

const currentTab = ref('week7')
const events = ref([])
const selectedFilters = ref({
  status: [],
  urgencyTags: [],
  typeTags: []
})

const tabs = [
  { id: 'week7', name: '近7天' },
  { id: 'thisWeek', name: '本周' },
  { id: 'thisMonth', name: '本月' },
  { id: 'thisYear', name: '本年' }
]

const getDateRange = (tabId) => {
  const today = dayjs()
  switch (tabId) {
    case 'week7':
      return {
        start: today.subtract(7, 'day').format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD')
      }
    case 'thisWeek':
      return {
        start: today.startOf('week').format('YYYY-MM-DD'),
        end: today.endOf('week').format('YYYY-MM-DD')
      }
    case 'thisMonth':
      return {
        start: today.startOf('month').format('YYYY-MM-DD'),
        end: today.endOf('month').format('YYYY-MM-DD')
      }
    case 'thisYear':
      return {
        start: today.startOf('year').format('YYYY-MM-DD'),
        end: today.endOf('year').format('YYYY-MM-DD')
      }
  }
}

const switchTab = async (tabId) => {
  currentTab.value = tabId
  const { start, end } = getDateRange(tabId)
  const result = await window.electron.ipcRenderer.invoke('get-events-by-date-range', start, end)

  // 获取所有事件的标签信息
  const eventIds = result.map((event) => event.id)
  const tagsResult = await window.electron.ipcRenderer.invoke('get-events-tags-by-ids', eventIds)
  events.value = result
    .map((event) => ({
      ...event,
      tags: tagsResult[event.id]
    }))
    .sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf())
  // 添加滚动重置
  const container = document.querySelector('.ps')
  if (container) {
    container.scrollTop = 0
  }
}

onMounted(() => {
  switchTab('week7')
})

const filteredEvents = computed(() => {
  if (!Object.values(selectedFilters.value).some((arr) => arr.length > 0)) {
    return events.value
  }

  return events.value.filter((event) => {
    const statusMatch =
      selectedFilters.value.status.length === 0 ||
      selectedFilters.value.status.includes(getEventStatus(event))

    const urgencyMatch =
      selectedFilters.value.urgencyTags.length === 0 ||
      selectedFilters.value.urgencyTags.includes(event.tags?.urgencyTag?.id)

    const typeMatch =
      selectedFilters.value.typeTags.length === 0 ||
      event.tags?.typeTags?.some((tag) => selectedFilters.value.typeTags.includes(tag.id))

    return statusMatch && urgencyMatch && typeMatch
  })
})

// 获取事件状态的辅助函数
const getEventStatus = (event) => {
  const now = dayjs()
  const start = dayjs(event.start)
  const end = dayjs(event.end)

  if (now.isBefore(start)) {
    return 'pending'
  } else if (now.isAfter(end)) {
    return 'completed'
  } else {
    return 'ongoing'
  }
}
</script>

<style>
.tasks-view {
  display: flex;
  height: 100%;
}

.second-sidebar {
  width: 120px;
  background-color: #f7f7f7;
  border-right: 1px solid #e6e6e6;
  padding: 10px 0;
}

.tab-item {
  padding: 16px 0;
  text-align: center;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s ease;
}

.tab-item:hover {
  background-color: #e6e6e6;
}

.tab-item.active {
  background-color: #e6e6e6;
  color: #07c160;
}

.events-container {
  flex: 1;
  padding: 20px;
  min-width: 0; /* 防止flex子项超出容器 */
  box-sizing: border-box; /* 添加这行确保padding计入总宽度 */
  height: 100%; /* 确保容器有高度 */
  position: relative; /* 添加定位上下文 */
}

.no-events {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.event-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box; /* 添加这行确保宽度计算包含padding和border */
  min-height: 100%; /* 确保内容区域至少占满容器高度 */
}
</style>
