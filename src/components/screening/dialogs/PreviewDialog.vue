<template>
  <el-dialog v-model="visible" title="简历内容预览" width="60%">
    <div class="preview-content">
      <h3>{{ file?.name }}</h3>
      <pre class="content-display">{{ file?.content || '无内容' }}</pre>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ResumeFile } from '@/types'

const props = defineProps<{
  modelValue: boolean
  file: ResumeFile | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})
</script>

<style scoped lang="scss">
.preview-content {
  h3 {
    margin: 0 0 16px 0;
    color: #303133;
  }

  .content-display {
    background: #f6f8fa;
    padding: 16px;
    border-radius: 6px;
    max-height: 400px;
    overflow: auto;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 13px;
    color: #303133;
  }
}
</style>
