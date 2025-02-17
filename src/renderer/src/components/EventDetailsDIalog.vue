<template>
  <el-dialog v-model="visible" :title="'事件详情'" width="30%" @closed="handleClose">
    <div class="event-details">
      <p v-if="event?.extendedProps?.urgencyTagId" class="title-line">
        <TagIcon :tag="getTagInfo(event.extendedProps.urgencyTagId, urgencyTags)" />
        <strong>{{ event?.title }}</strong>
      </p>
      <p v-if="event?.extendedProps?.typeTagIds?.length" class="type-tags">
        <TagIcon
          v-for="id in event.extendedProps.typeTagIds"
          :key="id"
          :tag="getTagInfo(id, typeTags)"
          :style-props="{ marginRight: '8px' }"
        />
      </p>
      <p><strong>开始时间：</strong>{{ formatDateTime(event?.start, event?.allDay) }}</p>
      <p><strong>结束时间：</strong>{{ formatDateTime(event?.end, event?.allDay) }}</p>
      <p><strong>全天事件：</strong>{{ event?.allDay ? '是' : '否' }}</p>
      <p v-if="event?.url"><strong>链接：</strong>{{ event?.url }}</p>
      <p v-if="event?.extendedProps.description">
        <strong>描述：</strong>{{ event?.extendedProps.description }}
      </p>
    </div>

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
import { ref, onMounted } from 'vue'
import EventDialog from './EventDialog.vue'
import { ElMessageBox } from 'element-plus'
import TagIcon from './TagIcon.vue'

const visible = ref(false)
const event = ref(null)
const eventDialogRef = ref(null)
const urgencyTags = ref([])
const typeTags = ref([])

const formatDateTime = (dateTime, isAllDay = false) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(isAllDay
      ? {}
      : {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
  }
  return date.toLocaleString('zh-CN', options).replace(/\//g, '-')
}

const showDialog = (eventData) => {
  event.value = {
    ...eventData
  }
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

const handleClose = async () => {
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
.event-details p {
  margin: 8px 0;
}
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
