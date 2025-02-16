<template>
  <div class="tag-selector">
    <div class="urgency-tags">
      <div class="tag-section-title">紧急程度</div>
      <el-radio-group v-model="selectedUrgencyId" @change="handleUrgencyChange">
        <el-radio v-for="tag in urgencyTags" :key="tag.urgency_tag_id" :label="tag.urgency_tag_id">
          <font-awesome-icon :icon="tag.icon_name" />
          {{ tag.tag_name }}
        </el-radio>
      </el-radio-group>
    </div>

    <div class="type-tags">
      <div class="tag-section-title">事件类型</div>
      <el-checkbox-group v-model="selectedTypeIds" @change="handleTypeChange">
        <el-checkbox v-for="tag in typeTags" :key="tag.type_tag_id" :label="tag.type_tag_id">
          <font-awesome-icon :icon="tag.icon_name" />
          {{ tag.tag_name }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ urgencyTagId: 1, typeTagIds: [] })
  }
})

const emit = defineEmits(['update:modelValue'])

const urgencyTags = ref([])
const typeTags = ref([])
const selectedUrgencyId = ref(props.modelValue.urgencyTagId)
const selectedTypeIds = ref(props.modelValue.typeTagIds)

const handleUrgencyChange = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    urgencyTagId: value
  })
}

const handleTypeChange = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    typeTagIds: value
  })
}

onMounted(async () => {
  urgencyTags.value = await window.electron.ipcRenderer.invoke('get-all-urgency-tags')
  typeTags.value = await window.electron.ipcRenderer.invoke('get-all-type-tags')
})
</script>

<style scoped>
.tag-selector {
  margin: 15px 0;
}

.tag-section-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.urgency-tags,
.type-tags {
  margin-bottom: 20px;
}

.el-radio,
.el-checkbox {
  margin-right: 20px;
  margin-bottom: 10px;
}

.font-awesome-icon {
  margin-right: 5px;
}
</style>
