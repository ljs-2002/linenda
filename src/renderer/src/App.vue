<template>
  <div id="app">
    <SystemTitleBar />
    <div class="main-content">
      <Sidebar v-show="showSidebar" />
      <div class="content">
        <router-view @toggle-sidebar="toggleSidebar" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SystemTitleBar from './components/SystemTitleBar.vue'

const showSidebar = ref(true)

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}
</script>

<style>
#app {
  display: flex;
  flex-direction: column; /* 修改为列布局 */
  height: 100vh;
  width: 100vw;
}

.main-content {
  flex: 1;
  display: flex; /* 保持原有的水平布局 */
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
