<template>
  <div class="filter-section">
    <div class="section-header">
      <h4>
        <span
          v-if="showIntersectionToggle"
          class="section-title"
          :class="{ 'intersection-active': isIntersection }"
          @click="toggleIntersection"
        >
          {{ title }}
        </span>
        <span v-else>{{ title }}</span>
        <span v-if="hasSelectedValues" class="section-clear-btn" @click="clearSection">清除</span>
      </h4>
    </div>
    <div class="checkbox-group">
      <label v-for="option in options" :key="option.value">
        <input
          v-model="selectedValues"
          type="checkbox"
          :value="option.value"
          @change="emitChange"
        />
        <TagIcon
          v-if="option.icon"
          :tag="{ icon_name: option.icon, tag_name: option.label, color: option.color }"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import TagIcon from './TagIcon.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  showIntersectionToggle: {
    type: Boolean,
    default: false
  },
  initialIntersection: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'intersection-change'])

const selectedValues = ref(props.modelValue)
const isIntersection = ref(props.initialIntersection)
// 计算是否有选中的值
const hasSelectedValues = computed(() => selectedValues.value.length > 0)

const toggleIntersection = () => {
  isIntersection.value = !isIntersection.value
  emit('intersection-change', isIntersection.value)
}

// 清除当前section的选中值
const clearSection = () => {
  selectedValues.value = []
  emit('update:modelValue', [])
}

const emitChange = () => {
  emit('update:modelValue', selectedValues.value)
}

watch(
  () => props.modelValue,
  (newVal) => {
    selectedValues.value = newVal
  }
)
</script>

<style scoped>
.filter-section {
  margin-bottom: 16px;
}

.section-header {
  margin: 0 0 8px 0;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.section-header h4 {
  margin: 0;
  height: 24px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.section-clear-btn {
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  padding: 2px 4px;
  opacity: 0.8;
  flex-shrink: 0;
}

.section-clear-btn:hover {
  color: #66b1ff;
  opacity: 1;
}

.checkbox-group {
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex-wrap: wrap;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.section-title {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.section-title:hover {
  color: #07c160;
}

.section-title.intersection-active {
  color: #ff4d4f;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.section-title.intersection-active:hover {
  color: #ff7875;
}
</style>
