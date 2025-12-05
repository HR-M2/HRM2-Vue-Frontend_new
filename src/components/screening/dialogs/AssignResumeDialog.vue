<template>
  <el-dialog v-model="visible" title="分配简历到岗位" width="80%" @close="handleClose">
    <el-alert
      title="选择已完成初筛的简历，分配到当前选中的岗位"
      type="info"
      show-icon
      style="margin-bottom: 16px;"
    />
    
    <div v-if="selectedPositionId" class="selected-position-info">
      <span>目标岗位: </span>
      <el-tag type="primary">{{ positionName }}</el-tag>
    </div>
    <div v-else class="no-position-warning">
      <el-alert title="请先在左侧选择一个岗位" type="warning" show-icon />
    </div>
    
    <div class="resumes-selection">
      <el-table
        :data="availableResumes"
        row-key="id"
        style="width: 100%"
        v-loading="loading"
        max-height="400"
      >
        <el-table-column label="选择" width="60" align="center">
          <template #default="{ row }">
            <el-checkbox
              v-model="selectedResumeIds"
              :label="row.id"
            />
          </template>
        </el-table-column>
        <el-table-column prop="candidate_name" label="候选人" min-width="120">
          <template #default="{ row }">
            {{ row.candidate_name || '未知候选人' }}
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.screening_score">{{ row.screening_score.comprehensive_score }}</span>
            <span v-else>N/A</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleAssign"
        :disabled="selectedResumeIds.length === 0 || !selectedPositionId"
        :loading="submitting"
      >
        分配到岗位 ({{ selectedResumeIds.length }})
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useScreeningUtils } from '@/composables/useScreeningUtils'
import type { ResumeData } from '@/types'

const props = defineProps<{
  modelValue: boolean
  selectedPositionId: string | null
  positionName: string
  availableResumes: ResumeData[]
  loading: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  assign: [resumeIds: string[]]
  close: []
}>()

const { formatDate } = useScreeningUtils()

const visible = ref(props.modelValue)
const selectedResumeIds = ref<string[]>([])

// 同步 visible
watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 关闭时清理
const handleClose = () => {
  selectedResumeIds.value = []
  emit('close')
}

// 分配
const handleAssign = () => {
  emit('assign', selectedResumeIds.value)
}

// 暴露方法
defineExpose({
  selectedResumeIds
})
</script>

<style scoped lang="scss">
.selected-position-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f0f9eb;
  border-radius: 6px;
  
  span {
    color: #606266;
  }
}

.no-position-warning {
  margin-bottom: 16px;
}

.resumes-selection {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
