<template>
  <div id="app">
    <Sidebar />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
</script>

<style>
#app {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
