<template>
  <el-dialog v-model="dialogVisible" :title="isNew ? '新建事件' : '编辑事件'" width="500px">
    <el-form :model="eventForm" :rules="rules" ref="formRef" label-width="100px">
      <!-- 基本配置 -->
      <el-form-item label="标题" prop="title">
        <el-input v-model="eventForm.title" placeholder="请输入事件标题"></el-input>
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
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="结束时间" prop="end">
        <el-date-picker
          v-model="eventForm.end"
          :type="eventForm.allDay ? 'date' : 'datetime'"
          placeholder="选择结束时间"
          :format="eventForm.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'"
          :value-format="eventForm.allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'"
        ></el-date-picker>
      </el-form-item>

      <!-- 高级配置 -->
      <el-collapse>
        <el-collapse-item title="高级配置">
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
        </el-collapse-item>
      </el-collapse>
    </el-form>

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
import { watch } from 'vue'

const dialogVisible = ref(false)
const isNew = ref(true)
const formRef = ref(null)

const eventForm = reactive({
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  start: [{ required: true, message: '请选择开始时间', trigger: 'change' }]
}

watch(
  () => eventForm.allDay,
  (newValue) => {
    if (newValue) {
      // 如果切换到整天事件,去掉时间部分
      if (eventForm.start) {
        eventForm.start = eventForm.start.split('T')[0]
      }
      if (eventForm.end) {
        eventForm.end = eventForm.end.split('T')[0]
      }
    }
  }
)

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
  Object.assign(eventForm, {
    title: '',
    start: '',
    end: '',
    allDay: false,
    url: '',
    description: ''
  })
}

const calendar = ref(null)

const showDialog = (data = null) => {
  if (data) {
    isNew.value = false
    const { calendar: cal, ...rest } = data
    calendar.value = cal
    Object.assign(eventForm, rest)
  } else {
    isNew.value = true
    resetForm()
  }
  dialogVisible.value = true
}

defineExpose({
  showDialog
})
</script>
