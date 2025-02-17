<template>
  <el-dialog v-model="dialogVisible" :title="isNew ? '新建事件' : '编辑事件'" width="500px">
    <perfect-scrollbar class="dialog-scroll-container">
      <el-form ref="formRef" :model="eventForm" :rules="rules" label-width="100px">
        <!-- 基本配置 -->
        <el-form-item label="标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题"></el-input>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="eventForm.urgencyTagId" placeholder="请选择紧急程度">
            <template #default>
              <el-option
                v-for="tag in urgencyTags"
                :key="tag.id"
                :label="tag.tag_name"
                :value="tag.id"
              >
                <TagIcon :tag="tag" :style-props="{ marginRight: '4px' }" />
                {{ tag.tag_name }}
              </el-option>
            </template>
            <template v-if="getSelectedTag(eventForm.urgencyTagId)" #prefix>
              <TagIcon :tag="getSelectedTag(eventForm.urgencyTagId)" />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型">
          <el-select
            v-model="eventForm.typeTagIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            placeholder="请选择事件类型"
          >
            <template #label="{ label, value }">
              <TagIcon :tag="getTypeTag(value)" />
              {{ label }}
            </template>
            <el-option v-for="tag in typeTags" :key="tag.id" :label="tag.tag_name" :value="tag.id">
              <TagIcon v-if="tag" :tag="tag" :style-props="{ marginRight: '4px' }" />
              {{ tag.tag_name }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="整天事件">
          <el-switch v-model="eventForm.allDay"></el-switch>
        </el-form-item>
        <el-form-item label="开始时间" prop="start">
          <el-date-picker
            v-model="eventForm.start"
            :type="eventForm.allDay ? 'date' : 'datetime'"
            placeholder="选择开始时间"
            :format="eventForm.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'"
            :value-format="eventForm.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'"
            :disabled-date="getDisabledStartDate"
            @change="handleStartChange"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="end">
          <el-date-picker
            v-model="eventForm.end"
            :type="eventForm.allDay ? 'date' : 'datetime'"
            placeholder="选择结束时间"
            :format="eventForm.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'"
            :value-format="eventForm.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'"
            :disabled-date="getDisabledEndDate"
            @change="handleEndChange"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="eventForm.url" placeholder="请输入相关URL"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            placeholder="请输入事件描述"
          ></el-input>
        </el-form-item>
      </el-form>
    </perfect-scrollbar>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { watch, onMounted } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'
import TagIcon from './TagIcon.vue'

const dialogVisible = ref(false)
const isNew = ref(true)
const formRef = ref(null)
const firstSelectedField = ref(null)
const urgencyTags = ref([])
const typeTags = ref([])

const formatDateToLocal = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 处理日期范围限制逻辑
const getDisabledStartDate = (time) => {
  if (!eventForm.end) return false
  const endTime = new Date(eventForm.end)
  const currentTime = new Date(time)

  if (eventForm.allDay) {
    // 全天事件：结束日期需要比开始日期大
    const endDate = new Date(endTime)
    endDate.setDate(endDate.getDate() - 1)
    return currentTime >= endDate
  } else {
    // 非全天事件：不能跨天且不能晚于结束时间
    if (firstSelectedField.value === 'end') {
      return currentTime.toDateString() !== endTime.toDateString() || currentTime >= endTime
    }
    return false
  }
}

const getDisabledEndDate = (time) => {
  if (!eventForm.start) return false
  const startTime = new Date(eventForm.start)
  const currentTime = new Date(time)

  if (eventForm.allDay) {
    // 全天事件：结束日期需要比开始日期至少大1天
    const minEndDate = new Date(startTime)
    minEndDate.setDate(minEndDate.getDate() + 1) // 获取开始日期的后一天
    return currentTime < minEndDate
  } else {
    // 非全天事件：不能跨天且不能早于开始时间
    if (firstSelectedField.value === 'start') {
      return currentTime.toDateString() !== startTime.toDateString() || currentTime <= startTime
    }
    return false
  }
}

// 监听日期选择
const handleStartChange = () => {
  if (!firstSelectedField.value) {
    firstSelectedField.value = 'start'
  }
  // 当开始时间变化时，如果结束时间不符合规则，则清空结束时间
  if (eventForm.end) {
    const endDisabled = getDisabledEndDate(new Date(eventForm.end))
    if (endDisabled) {
      eventForm.end = ''
    }
  }
}

const handleEndChange = () => {
  if (!firstSelectedField.value) {
    firstSelectedField.value = 'end'
  }
  // 当结束时间变化时，如果开始时间不符合规则，则清空开始时间
  if (eventForm.start) {
    const startDisabled = getDisabledStartDate(new Date(eventForm.start))
    if (startDisabled) {
      eventForm.start = ''
    }
  }
}

const eventFormTamplate = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  description: '',
  durationEditable: true,
  startEditable: true,
  urgencyTagId: 1,
  typeTagIds: []
}

const eventForm = reactive(eventFormTamplate)
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  start: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const emit = defineEmits(['save'])

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    emit('save', { ...eventForm, calendar: calendar.value })
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error(error)
    ElMessage.error('请填写必填项')
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(eventForm, eventFormTamplate)
  firstSelectedField.value = null
}

watch(
  () => eventForm.allDay,
  (newValue) => {
    // 当切换全天事件状态时，重置日期选择顺序
    firstSelectedField.value = null
    if (eventForm.start && eventForm.end) {
      const startTime = new Date(eventForm.start)
      const endTime = new Date(eventForm.end)

      if (newValue) {
        // 切换到全天事件
        eventForm.start = formatDateToLocal(startTime)
        // 确保结束日期至少比开始日期大1天
        const minEndTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000)
        if (endTime <= minEndTime) {
          eventForm.end = formatDateToLocal(minEndTime)
        } else {
          eventForm.end = formatDateToLocal(endTime)
        }
      } else {
        // 切换到非全天事件时，强制设置时间在同一天
        const dateStr = formatDateToLocal(startTime)
        eventForm.start = `${dateStr} 00:00`
        eventForm.end = `${dateStr} 23:59`
        // 设置标记，表明已经进行过切换
        firstSelectedField.value = 'start' // 将开始时间设为第一个选择的字段
      }
    }
  }
)

const calendar = ref(null)
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return d1.toDateString() === d2.toDateString()
}

const processEventData = (data) => {
  const { calendar: cal, ...rest } = data
  calendar.value = cal
  // 检查非全天事件的日期是否跨天
  if (!rest.allDay && rest.start && rest.end) {
    const startDate = new Date(rest.start)
    const endDate = new Date(rest.end)
    if (!isSameDay(startDate, endDate)) {
      // 如果跨天，将结束时间设置为开始时间的当天23:59
      rest.end = `${rest.start.split(' ')[0]} 23:59`
    }
  }
  Object.assign(eventForm, rest)
}

const showDialog = async (data = null) => {
  // 重置表单
  resetForm()

  if (!data) {
    isNew.value = true
    dialogVisible.value = true
    return
  }

  isNew.value = !data.id
  const processedData = processEventData(data)
  Object.assign(eventForm, processedData)
  dialogVisible.value = true
}

const getSelectedTag = (id) => {
  return urgencyTags.value.find((tag) => tag.id === id)
}

const getTypeTag = (id) => {
  return typeTags.value.find((tag) => tag.id === id)
}

onMounted(async () => {
  // 加载紧急程度和事件类型标签
  urgencyTags.value = await window.electron.ipcRenderer.invoke('get-all-urgency-tags')
  typeTags.value = await window.electron.ipcRenderer.invoke('get-all-type-tags')
})

defineExpose({
  showDialog
})
</script>

<style scoped>
.el-select .el-input__prefix {
  display: flex;
  align-items: center;
  left: 8px;
}

.el-select .el-input__inner {
  padding-left: 0; /* 为图标留出空间 */
}

.dialog-scroll-container {
  max-height: calc(80vh - 150px); /* 设置最大高度，减去标题和按钮的高度 */
  padding-right: 20px; /* 为滚动条留出空间 */
  overflow: hidden;
}

.el-collapse-item__content {
  transition: all 0.3s ease-in-out;
  padding-bottom: 16px;
}
</style>
