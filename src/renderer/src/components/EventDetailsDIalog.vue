<template>
  <el-dialog v-model="visible" :title="'事件详情'" width="30%" @closed="handleClose">
    <div class="event-details">
      <p><strong>标题：</strong>{{ event?.title }}</p>
      <p><strong>开始时间：</strong>{{ formatDateTime(event?.start) }}</p>
      <p><strong>结束时间：</strong>{{ formatDateTime(event?.end) }}</p>
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
import { ref } from 'vue'
import EventDialog from './EventDialog.vue'
import { ElMessageBox } from 'element-plus'

const visible = ref(false)
const event = ref(null)
const eventDialogRef = ref(null)

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    .replace(/\//g, '-')
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
  console.log('Details2Dialog', eventData)
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
