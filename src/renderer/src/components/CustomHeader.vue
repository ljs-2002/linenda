<template>
  <div class="custom-header">
    <div class="left-section">
      <span class="today-date">{{ day }}</span>
      <span class="navigation">
        <button class="nav-button" @click="prev">‹</button>
        <span class="title">{{ title }}</span>
        <button class="nav-button" @click="next">›</button>
      </span>
    </div>
    <div class="right-section">
      <button class="today-button" @click="today">今</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  onPrev: {
    type: Function,
    required: true
  },
  onNext: {
    type: Function,
    required: true
  },
  onToday: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['prev', 'next', 'today'])

const day = computed(() => {
  return String(props.date.getDate()).padStart(2, '0')
})

const prev = () => {
  emit('prev')
}

const next = () => {
  emit('next')
}

const today = () => {
  emit('today')
}
</script>

<style scoped>
.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px 20px;
}

.left-section {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.today-date {
  font-size: 42px;
  color: #666;
  font-weight: 400;
  line-height: 1;
}

.navigation {
  display: flex;
  align-items: center;
  height: 24px;
  margin-bottom: 4px;
}

.nav-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 30px;
  font-weight: 300;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  color: #666;
  margin: 0 6px;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.right-section {
  display: flex;
  align-items: flex-end;
}

.today-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14x;
  padding: 4px 8px;
  height: 24px;
  display: flex;
  align-items: center;
}

.nav-button:hover,
.today-button:hover {
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
