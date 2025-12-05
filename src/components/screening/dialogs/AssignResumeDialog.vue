<template>
  <el-dialog v-model="visible" title="添加简历到岗位" width="80%" @close="handleClose">
    <div class="dialog-header">
      <el-alert
        title="选择简历添加到当前岗位，以便后续针对该岗位进行初筛分析"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="filter-options">
        <el-checkbox v-model="hideAssigned">
          不显示已分配的简历
        </el-checkbox>
      </div>
    </div>
    
    <div v-if="selectedPositionId" class="selected-position-info">
      <span>目标岗位: </span>
      <el-tag type="primary">{{ positionName }}</el-tag>
    </div>
    <div v-else class="no-position-warning">
      <el-alert title="请先在左侧选择一个岗位" type="warning" show-icon />
    </div>
    
    <div class="resumes-selection">
      <el-table
        :data="filteredResumes"
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
        <el-table-column label="标识" width="100" align="center">
          <template #default="{ row }">
            <span class="hash-value">{{ getShortId(row.id) }}</span>
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
        添加到岗位 ({{ selectedResumeIds.length }})
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useScreeningUtils } from '@/composables/useScreeningUtils'
import type { ResumeData } from '@/types'

const props = defineProps<{
  modelValue: boolean
  selectedPositionId: string | null
  positionName: string
  availableResumes: ResumeData[]
  assignedResumeIds: string[]  // 已分配到任何岗位的简历ID列表
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
const hideAssigned = ref(true)  // 默认勾选，不显示已分配的简历

// 过滤后的简历列表
const filteredResumes = computed(() => {
  if (!hideAssigned.value) {
    return props.availableResumes
  }
  return props.availableResumes.filter(r => !props.assignedResumeIds.includes(r.id))
})

// 获取简历ID的短标识（前8位）
const getShortId = (id: string) => {
  if (!id) return 'N/A'
  return id.substring(0, 8)
}

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

// 添加到岗位
const handleAssign = () => {
  emit('assign', selectedResumeIds.value)
}

// 暴露方法
defineExpose({
  selectedResumeIds
})
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;

  .el-alert {
    flex: 1;
  }

  .filter-options {
    flex-shrink: 0;
    padding-top: 8px;
  }
}

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

.hash-value {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
