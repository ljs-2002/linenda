<template>
  <div class="filter-container">
    <!-- 悬浮球 -->
    <div class="filter-ball" :class="{ active: isOpen }" @click.stop="toggleFilter">
      <img src="../assets/filter.svg" alt="filter" />
      <!-- 添加小红点 -->
      <div v-if="!isOpen && selectedStatus.length > 0" class="indicator"></div>
    </div>

    <!-- 过滤面板 -->
    <transition name="fade">
      <div v-if="isOpen" class="filter-panel" @click.stop>
        <div class="filter-header">
          <h3>
            筛选条件
            <span v-if="selectedStatus.length > 0" class="clear-btn" @click="clearFilters"
              >清除</span
            >
          </h3>
          <div class="header-actions">
            <span class="close-btn" @click="toggleFilter">&times;</span>
          </div>
        </div>
        <div class="filter-content">
          <div class="filter-section">
            <h4>状态</h4>
            <div class="checkbox-group">
              <label v-for="status in statusOptions" :key="status.value">
                <input
                  v-model="selectedStatus"
                  type="checkbox"
                  :value="status.value"
                  @change="emitChange"
                />
                <span>{{ status.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
//TODO: 将filter-content部分做成类似组件可以直接循环插入相关内容
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectedStatus = ref(props.modelValue)

const statusOptions = [
  { label: '未开始', value: 'pending' },
  { label: '进行中', value: 'ongoing' },
  { label: '已完成', value: 'completed' }
]

const toggleFilter = () => {
  isOpen.value = !isOpen.value
}

const emitChange = () => {
  emit('update:modelValue', selectedStatus.value)
}

watch(
  () => props.modelValue,
  (newVal) => {
    selectedStatus.value = newVal
  }
)
// 添加清除过滤器的方法
const clearFilters = () => {
  selectedStatus.value = []
  emitChange()
}

// 添加点击外部关闭的处理函数
const handleClickOutside = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

// 组件挂载时添加点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
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
