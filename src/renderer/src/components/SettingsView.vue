<template>
  <div class="settings-view">
    <h2>设置</h2>
    <div class="settings-section">
      <h3>数据库位置</h3>
      <div class="db-path-container">
        <el-input
          v-model="dbPath"
          readonly
          placeholder="请选择数据库存储位置"
          class="db-path-input"
        >
          <template #append>
            <el-button @click="selectDirectory"> 选择目录 </el-button>
          </template>
        </el-input>
        <el-button type="primary" :disabled="!hasPathChanged" @click="saveDbPath">
          保存更改
        </el-button>
        <el-button v-if="hasPathChanged" @click="resetPath"> 重置 </el-button>
      </div>
      <p class="path-hint">当前数据库位置: {{ currentDbPath }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const dbPath = ref('')
const currentDbPath = ref('')
const hasPathChanged = ref(false)

// 读取当前数据库路径
const loadCurrentPath = async () => {
  const path = await window.electron.ipcRenderer.invoke('get-db-path')
  currentDbPath.value = path
  dbPath.value = path
}

// 选择新目录
const selectDirectory = async () => {
  const result = await window.electron.ipcRenderer.invoke('select-directory')
  if (result.success) {
    dbPath.value = result.path
    hasPathChanged.value = dbPath.value !== currentDbPath.value
  }
}

// 保存新的数据库路径
const saveDbPath = async () => {
  try {
    const result = await window.electron.ipcRenderer.invoke('update-db-path', dbPath.value)
    if (result.success) {
      ElMessage.success('数据库位置更新成功')
      currentDbPath.value = dbPath.value
      hasPathChanged.value = false
    } else {
      ElMessage.error(result.error || '更新失败')
      resetPath()
    }
  } catch (error) {
    ElMessage.error('更新数据库位置时发生错误')
    resetPath()
  }
}

// 重置路径
const resetPath = () => {
  dbPath.value = currentDbPath.value
  hasPathChanged.value = false
}

onMounted(() => {
  loadCurrentPath()
})
</script>

<style scoped>
.settings-view {
  padding: 24px;
}

h2 {
  margin-bottom: 24px;
  color: #333;
}

.settings-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-bottom: 16px;
  color: #333;
}

.db-path-container {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.db-path-input {
  flex: 1;
}

.path-hint {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}
</style>
