<template>
  <el-dialog
    v-model="visible"
    :title="'事件详情'"
    width="50%"
    :close-on-click-modal="false"
    @closed="handleClose"
  >
    <EventCard v-if="formattedEvent" :event="formattedEvent" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleEdit">编辑</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </span>
    </template>
  </el-dialog>

  <EventDialog ref="eventDialogRef" @save="handleSave" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import EventDialog from './EventDialog.vue'
import EventCard from './EventCard.vue'
import { ElMessageBox } from 'element-plus'

const visible = ref(false)
const event = ref(null)
const eventDialogRef = ref(null)
const urgencyTags = ref([])
const typeTags = ref([])

// 格式化事件数据以适配 EventCard 组件的数据结构
const formattedEvent = computed(() => {
  if (!event.value) return null

  return {
    ...event.value,
    tags: {
      urgencyTag: getTagInfo(event.value?.extendedProps?.urgencyTagId, urgencyTags.value),
      typeTags:
        event.value?.extendedProps?.typeTagIds?.map((id) => getTagInfo(id, typeTags.value)) || []
    },
    title: event.value.title,
    start: event.value.start,
    end: event.value.end,
    allDay: event.value.allDay,
    description: event.value?.extendedProps?.description,
    url: event.value?.url
  }
})

const showDialog = (eventData) => {
  event.value = { ...eventData }
  visible.value = true
}

const handleEdit = () => {
  visible.value = false
  const { extendedProps, ...eventData } = event.value
  eventDialogRef.value?.showDialog({
    ...eventData,
    ...extendedProps
  })
}

const handleSave = (updatedEvent) => {
  emit('update', updatedEvent)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除事件 "${event.value.title}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await emit('delete', event.value)
    visible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除事件失败:', error)
    }
  }
}

const handleClose = () => {
  event.value = null
}

const getTagInfo = (id, tags) => {
  return tags.find((tag) => tag.id === id) || {}
}

onMounted(async () => {
  // 加载紧急程度和事件类型标签
  urgencyTags.value = await window.electron.ipcRenderer.invoke('get-all-urgency-tags')
  typeTags.value = await window.electron.ipcRenderer.invoke('get-all-type-tags')
})

defineExpose({
  showDialog
})

const emit = defineEmits(['update', 'delete'])
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 16px;
}
</style>
