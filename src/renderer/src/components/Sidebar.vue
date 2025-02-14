<template>
  <div class="sidebar">
    <ul>
      <li
        :class="{ active: currentRoute === '/calendar' }"
        @click="navigateTo('/calendar')"
        title="日历视图"
      >
        <img src="@renderer/assets/calendar.svg" class="icon" />
      </li>
      <li :class="{ active: currentRoute === '/tasks' }" @click="navigateTo('/tasks')" title="任务">
        <img src="@renderer/assets/tasks.svg" class="icon" />
      </li>
      <li
        :class="{ active: currentRoute === '/settings' }"
        @click="navigateTo('/settings')"
        title="设置"
      >
        <img src="@renderer/assets/settings.svg" class="icon" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = ref(route.path)

watch(
  () => route.path,
  (newPath) => {
    currentRoute.value = newPath
  }
)

const navigateTo = (path) => {
  router.push(path)
}
</script>
