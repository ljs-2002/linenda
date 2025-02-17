<template>
  <div class="filter-container">
    <!-- 悬浮球 -->
    <div class="filter-ball" :class="{ active: isOpen }" @click.stop="toggleFilter">
      <img src="../assets/filter.svg" alt="filter" />
      <!-- 添加小红点 -->
      <div v-if="!isOpen && hasActiveFilters" class="indicator"></div>
    </div>

    <!-- 过滤面板 -->
    <transition name="fade">
      <div v-if="isOpen" class="filter-panel" @click.stop>
        <div class="filter-header">
          <h3>
            筛选条件
            <span v-if="hasActiveFilters" class="clear-btn" @click="clearFilters">清除</span>
          </h3>
          <div class="header-actions">
            <span class="close-btn" @click="toggleFilter">&times;</span>
          </div>
        </div>
        <div class="filter-content">
          <FilterSection
            v-for="section in sections"
            :key="section.id"
            v-model="selectedFilters[section.id]"
            :title="section.title"
            :options="section.options"
            @update:model-value="handleFilterChange(section.id, $event)"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import FilterSection from './FilterSection.vue'
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  sections: {
    type: Array,
    required: true
  },
  initSections: {
    type: Function,
    default: () => Promise.resolve()
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectedFilters = ref(props.modelValue)
const hasActiveFilters = computed(() => {
  return Object.values(selectedFilters.value).some((filters) => filters.length > 0)
})
watch(
  () => props.modelValue,
  (newValue) => {
    selectedFilters.value = newValue
  },
  { deep: true }
)

const toggleFilter = () => {
  isOpen.value = !isOpen.value
}

const handleFilterChange = (sectionId, value) => {
  selectedFilters.value[sectionId] = value
  emit('update:modelValue', selectedFilters.value)
}

const clearFilters = () => {
  selectedFilters.value = {
    status: [],
    urgencyTags: [],
    typeTags: []
  }
  emit('update:modelValue', selectedFilters.value)
}

// 添加点击外部关闭的处理函数
const handleClickOutside = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

// 组件挂载时添加点击事件监听
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  // 执行初始化函数
  await props.initSections()
})

// 组件卸载时移除点击事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.filter-container {
  position: fixed;
  right: 30px;
  bottom: 30px;
  z-index: 1000;
}

.filter-ball {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: rgba(106, 133, 254, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative; /* 添加相对定位 */
}

/* 添加小红点样式 */
.indicator {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  background-color: #df5558;
  border-radius: 50%;
}

.filter-ball:hover {
  background-color: rgba(106, 133, 254, 1);
}

.filter-ball.active {
  background-color: rgba(106, 133, 254, 1);
}

.filter-ball img {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.filter-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-header h3 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px; /* 标题和清除按钮的间距 */
}

.header-actions {
  display: flex;
  align-items: center;
}

.close-btn {
  cursor: pointer;
  font-size: 24px;
  color: #999;
}

.clear-btn {
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
  padding: 2px 0; /* 添加垂直内边距 */
}

.clear-btn:hover {
  color: #66b1ff;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-section h4 {
  margin: 0 0 8px 0;
  color: #666;
}

.checkbox-group {
  display: flex;
  flex-direction: row; /* 改为横向排列 */
  gap: 16px;
  flex-wrap: wrap; /* 允许换行 */
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap; /* 防止文字换行 */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
