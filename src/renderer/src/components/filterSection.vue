<template>
  <div class="filter-section">
    <h4>{{ title }}</h4>
    <div class="checkbox-group">
      <label v-for="option in options" :key="option.value">
        <input
          v-model="selectedValues"
          type="checkbox"
          :value="option.value"
          @change="emitChange"
        />
        <font-awesome-icon
          v-if="option.icon"
          :icon="option.icon"
          :style="{ marginRight: '4px', color: option.color }"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

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
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedValues = ref(props.modelValue)

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

.filter-section h4 {
  margin: 0 0 8px 0;
  color: #666;
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
</style>
