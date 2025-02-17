<template>
  <font-awesome-icon
    :icon="tag.icon_name"
    :title="tag.tag_name || tag.urgency_tag_name"
    :style="{ color: tag.color, ...styleProps }"
  />
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps({
  tag: {
    type: Object,
    required: true
  },
  styleProps: {
    type: Object,
    default: () => ({})
  }
})
</script>
