<template>
  <el-dialog v-model="visible" title="添加到岗位" width="500px">
    <el-select v-model="selectedGroupId" placeholder="请选择目标岗位" style="width: 100%">
      <el-option
        v-for="pos in positions"
        :key="pos.id"
        :label="`${pos.position} (${pos.resume_count || 0}份简历)`"
        :value="pos.id"
      />
    </el-select>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!selectedGroupId" @click="handleConfirm">确认添加</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PositionData } from '@/types'

const props = defineProps<{
  modelValue: boolean
  positions: PositionData[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [groupId: string]
}>()

const visible = ref(props.modelValue)
const selectedGroupId = ref('')

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    selectedGroupId.value = ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleConfirm = () => {
  if (selectedGroupId.value) {
    emit('confirm', selectedGroupId.value)
  }
}
</script>
