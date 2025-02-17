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
        <div class="tab-content">
          {{ tab.name
          }}<span v-if="currentTab === tab.id" class="tab-count"
            >({{ filteredEvents.length }})</span
          >
        </div>
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
    <EventFilter
      v-model="selectedFilters"
      :sections="filterSections"
      :init-sections="initFilterSections"
      @intersection-change="handleIntersectionChange"
    />

    <!-- 添加日期选择对话框 -->
    <el-dialog
      v-model="dateDialogVisible"
      title="自定义时间范围"
      width="240px"
      :modal="false"
      :close-on-click-modal="true"
      :draggable="true"
      destroy-on-close
      class="custom-dialog date-range-dialog"
      :append-to-body="true"
    >
      <el-form class="date-range-form" size="default">
        <el-form-item class="compact-form-item">
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="开始日期"
            :disabled-date="disabledStartDate"
            value-format="YYYY-MM-DD"
            :popper-options="{ strategy: 'fixed' }"
            @change="handleStartDateChange"
          />
        </el-form-item>
        <el-form-item class="compact-form-item">
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="结束日期"
            :disabled-date="disabledEndDate"
            value-format="YYYY-MM-DD"
            :popper-options="{ strategy: 'fixed' }"
            @change="handleEndDateChange"
          />
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import EventCard from './EventCard.vue'
import EventFilter from './EventFilter.vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'
import { ElDatePicker, ElDialog } from 'element-plus'
import 'element-plus/dist/index.css'

const currentTab = ref('week7')
const events = ref([])

const dateDialogVisible = ref(false)
const startDate = ref('')
const endDate = ref('')

const cachedCustomDates = ref({
  start: '',
  end: ''
})

const selectedFilters = ref({
  status: [],
  urgencyTags: [],
  typeTags: []
})

const tabs = [
  { id: 'week7', name: '近7天' },
  { id: 'today', name: '今天' },
  { id: 'thisWeek', name: '本周' },
  { id: 'thisMonth', name: '本月' },
  { id: 'thisYear', name: '本年' },
  { id: 'custom', name: '自定义' },
  { id: 'all', name: '全部' }
]

const filterSections = ref([
  {
    id: 'status',
    title: '状态',
    showIntersectionToggle: false,
    initialIntersection: false,
    options: [
      { label: '未开始', value: 'pending' },
      { label: '进行中', value: 'ongoing' },
      { label: '已完成', value: 'completed' }
    ]
  },
  {
    id: 'urgencyTags',
    title: '重要程度',
    showIntersectionToggle: false,
    initialIntersection: false,
    options: []
  },
  {
    id: 'typeTags',
    title: '类型',
    showIntersectionToggle: true,
    initialIntersection: false, // 设置初始状态为并集
    options: []
  }
])

const sectionIntersectionStates = ref({
  typeTags: false
})

const handleIntersectionChange = (sectionId, isIntersection) => {
  sectionIntersectionStates.value[sectionId] = isIntersection
  // 强制更新 filterSections 以触发重新渲染
  filterSections.value = filterSections.value.map((section) => {
    if (section.id === sectionId) {
      return {
        ...section,
        initialIntersection: isIntersection
      }
    }
    return section
  })
}

const getDateRange = (tabId) => {
  const today = dayjs()
  switch (tabId) {
    case 'today':
      return {
        start: today.format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD')
      }
    case 'week7':
      return {
        start: today.subtract(6, 'day').format('YYYY-MM-DD'),
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

const setEvents = async (result) => {
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

const switchTab = async (tabId) => {
  if (tabId === 'custom') {
    if (currentTab.value === 'custom') {
      // 如果当前已经是 custom，只显示对话框
      dateDialogVisible.value = true
      return
    }
    // 更新当前标签
    currentTab.value = tabId

    // 如果有缓存的日期，使用缓存的日期查询
    if (cachedCustomDates.value.start || cachedCustomDates.value.end) {
      startDate.value = cachedCustomDates.value.start
      endDate.value = cachedCustomDates.value.end
      const result = await window.electron.ipcRenderer.invoke(
        'get-events-by-date-range',
        startDate.value,
        endDate.value
      )
      await setEvents(result)
    } else {
      events.value = []
    }

    // 显示日期选择对话框
    dateDialogVisible.value = true
    return
  }
  currentTab.value = tabId
  let result
  if (tabId === 'all') {
    result = await window.electron.ipcRenderer.invoke('get-all-events')
    events.value = result.sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf())
  } else {
    const { start, end } = getDateRange(tabId)
    console.log(start, end)
    result = await window.electron.ipcRenderer.invoke('get-events-by-date-range', start, end)
  }

  // 获取所有事件的标签信息
  await setEvents(result)
}

// 日期限制函数
const disabledStartDate = (time) => {
  if (!endDate.value) return false
  return dayjs(time).isAfter(endDate.value)
}

const disabledEndDate = (time) => {
  if (!startDate.value) return false
  return dayjs(time).isBefore(startDate.value)
}

const handleStartDateChange = async (date) => {
  cachedCustomDates.value.start = date
  if (!date && endDate.value) {
    const result = await window.electron.ipcRenderer.invoke(
      'get-events-by-date-range',
      null,
      endDate.value
    )
    await setEvents(result)
  } else if (date && endDate.value) {
    const result = await window.electron.ipcRenderer.invoke(
      'get-events-by-date-range',
      date,
      endDate.value
    )
    await setEvents(result)
  }
}

const handleEndDateChange = async (date) => {
  cachedCustomDates.value.end = date
  if (!date && startDate.value) {
    const result = await window.electron.ipcRenderer.invoke(
      'get-events-by-date-range',
      startDate.value,
      null
    )
    await setEvents(result)
  } else if (startDate.value && date) {
    const result = await window.electron.ipcRenderer.invoke(
      'get-events-by-date-range',
      startDate.value,
      date
    )
    await setEvents(result)
  }
}

onMounted(() => {
  switchTab('week7')
})

// 初始化过滤器部分函数
const initFilterSections = async () => {
  const urgencyTags = await window.electron.ipcRenderer.invoke('get-all-urgency-tags')
  const typeTags = await window.electron.ipcRenderer.invoke('get-all-type-tags')

  filterSections.value = filterSections.value.map((section) => {
    if (section.id === 'urgencyTags') {
      section.options = urgencyTags.map((tag) => ({
        label: tag.tag_name,
        value: tag.id,
        icon: tag.icon_name,
        color: tag.color
      }))
    } else if (section.id === 'typeTags') {
      section.options = typeTags.map((tag) => ({
        label: tag.tag_name,
        value: tag.id,
        icon: tag.icon_name,
        color: tag.color
      }))
    }
    return section
  })
}

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
      (sectionIntersectionStates.value.typeTags
        ? // 交集：所有选中的标签都要匹配
          selectedFilters.value.typeTags.every((tagId) =>
            event.tags?.typeTags?.some((tag) => tag.id === tagId)
          )
        : // 并集：匹配任一选中的标签
          event.tags?.typeTags?.some((tag) => selectedFilters.value.typeTags.includes(tag.id)))

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

<style scoped>
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
  padding: 16px 10px;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s ease;
}

.tab-content {
  text-align: center; /* 居中对齐 */
}

.tab-count {
  font-size: 13px; /* 数字稍微小一点 */
  color: #999; /* 数字颜色浅一点 */
  margin-left: 2px; /* 与标题保持小距离 */
  display: inline-block; /* 确保和文字在同一行 */
}

.tab-item.active .tab-count {
  color: #07c160; /* 激活状态下数字颜色跟随主色 */
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
  z-index: 1;
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

.date-range-dialog .el-dialog {
  border-radius: 8px;
  overflow: visible;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: fixed !important;
  top: 200px !important;
  left: 40px !important;
  transform: none !important;
  background: #ffffff;
  width: 220px !important;
  z-index: 2001;
}

.date-range-dialog .el-dialog__header {
  background-color: #ffffff;
  padding: 12px 15px 8px;
  margin: 0;
  border-bottom: 1px solid #ebeef5;
  cursor: move;
}

.date-range-dialog .el-dialog__title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
}

.date-range-dialog .el-dialog__body {
  padding: 12px;
  background-color: #ffffff;
}

.date-range-dialog .el-dialog__headerbtn {
  top: 11px;
  right: 12px;
}

.date-range-form {
  margin: 0;
}

.date-range-form .el-form-item.compact-form-item {
  margin-bottom: 8px;
}

.date-range-form .el-form-item:last-child {
  margin-bottom: 0;
}

.date-range-form .el-date-picker {
  width: 100%;
}

.date-range-form .el-input__wrapper {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.date-range-form .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.date-range-form .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #07c160 inset;
}

/* 日期选择器弹出层样式优化 */
.el-picker-panel {
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.el-picker-panel .el-date-picker__header {
  margin: 4px 0;
}

.el-picker-panel .el-date-picker__content {
  padding: 0 8px 8px;
}

.el-picker-panel .el-date-table th {
  padding: 4px;
  font-weight: 400;
}

.el-picker-panel .el-date-table td {
  padding: 2px;
}
</style>
