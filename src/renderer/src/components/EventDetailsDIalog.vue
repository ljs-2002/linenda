<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑事件' : '事件详情'"
    width="30%"
    @closed="handleClose"
  >
    <template v-if="!isEdit">
      <div class="event-details">
        <p><strong>标题：</strong>{{ event?.title }}</p>
        <p><strong>开始时间：</strong>{{ event?.start }}</p>
        <p><strong>结束时间：</strong>{{ event?.end }}</p>
        <p><strong>全天事件：</strong>{{ event?.allDay ? '是' : '否' }}</p>
        <p v-if="event?.url"><strong>链接：</strong>{{ event?.url }}</p>
        <p v-if="event?.extendedProps.description">
          <strong>描述：</strong>{{ event?.extendedProps.description }}
        </p>
      </div>
    </template>
    <template v-else>
      <el-form :model="editingEvent" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="editingEvent.title" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="editingEvent.start" type="datetime" format="YYYY-MM-DD HH:mm" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="editingEvent.end" type="datetime" format="YYYY-MM-DD HH:mm" />
        </el-form-item>
        <el-form-item label="全天事件">
          <el-switch v-model="editingEvent.allDay" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="editingEvent.url" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingEvent.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <span class="dialog-footer">
        <template v-if="!isEdit">
          <el-button @click="handleEdit">编辑</el-button>
          <el-button type="danger" @click="handleDelete">删除</el-button>
        </template>
        <template v-else>
          <el-button @click="isEdit = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </template>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const isEdit = ref(false)
const event = ref(null)
const editingEvent = ref(null)

const formatDateTime = (date) => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showDialog = (eventData) => {
  event.value = {
    ...eventData,
    start: formatDateTime(eventData.start),
    end: formatDateTime(eventData.end)
  }
  const { extendedProps, ...restEventProps } = event.value
  editingEvent.value = { ...restEventProps, ...(extendedProps || {}) }
  visible.value = true
  isEdit.value = false
}

const handleEdit = () => {
  isEdit.value = true
}

const handleSave = () => {
  emit('save', {
    ...editingEvent.value,
    calendar: event.value.calendar
  })
  visible.value = false
}

const handleDelete = () => {
  if (confirm(`确定要删除事件 "${event.value.title}" 吗？`)) {
    emit('delete', event.value)
    visible.value = false
  }
}

const handleClose = () => {
  isEdit.value = false
  event.value = null
  editingEvent.value = null
}

defineExpose({
  showDialog
})

const emit = defineEmits(['save', 'delete'])
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
