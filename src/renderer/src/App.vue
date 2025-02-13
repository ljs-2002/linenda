<script setup>

const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<template>
test
</template>
