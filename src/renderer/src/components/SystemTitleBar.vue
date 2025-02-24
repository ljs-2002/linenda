<template>
  <div
    class="system-titlebar"
    :class="{ 'is-mac': isMac, 'is-maximized': isMaximized }"
    @dblclick="handleDoubleClick"
  >
    <div class="title-content">
      <div class="left-section">
        <img src="@resources/icons/icon.ico" class="logo" />
        <span class="divider"></span>
      </div>
      <span class="title">{{ title }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const title = ref('Linenda')
const isMac = ref(false)
const isMaximized = ref(false)

// 初始化
onMounted(async () => {
  // 获取平台信息
  isMac.value = await window.api.getPlatform()

  // 监听窗口状态变化
  window.api.onWindowStateChanged((state) => {
    isMaximized.value = state.isMaximized
  })
})

// 清理监听
onBeforeUnmount(() => {
  window.api.onWindowStateChanged(() => {})
})

// 处理双击标题栏 (Mac)
const handleDoubleClick = () => {
  if (isMac.value) {
    window.api.windowControl(isMaximized.value ? 'unmaximize' : 'maximize')
  }
}
</script>

<style scoped>
/* 基础样式 */
.system-titlebar {
  height: 36px; /* 需要与/main/index.js中titleBarOverlay里的height保持一致 */
  -webkit-app-region: drag;
  position: relative;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

/* 标题内容区域 */
.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  margin: 0 auto; /* 居中显示 */
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #e8e8e8;
  margin: 0 4px;
}

/* Mac适配 */
.system-titlebar.is-mac {
  padding-left: 78px;
  background: linear-gradient(to bottom, #f9f9f9, #f5f5f5);
}

/* Windows适配 */
.system-titlebar:not(.is-mac) {
  padding-right: 144px;
}

.logo {
  width: 18px; /* 稍微调小logo尺寸 */
  height: 18px;
  -webkit-app-region: no-drag;
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: scale(1.1); /* 添加hover效果 */
}

.title {
  font-size: 14px;
  font-weight: 500; /* 稍微加粗 */
  -webkit-app-region: no-drag;
  color: #333333;
  letter-spacing: 0.3px; /* 增加字间距 */
  user-select: none;
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .system-titlebar {
    background-color: #1e1e1e;
    border-bottom: 1px solid #2d2d2d;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .system-titlebar.is-mac {
    background: linear-gradient(to bottom, #2d2d2d, #252525);
  }

  .title {
    color: #ffffff;
  }

  .divider {
    background-color: #3d3d3d;
  }

  .logo {
    filter: brightness(0.9) contrast(1.1);
  }
}

/* 添加窗口最大化时的样式 */
.system-titlebar.is-maximized {
  border-top: 1px solid transparent;
  height: 35px; /* 最大化时稍微调整高度 */
}

/* 添加动画过渡 */
.system-titlebar {
  transition: all 0.2s ease;
}
</style>
