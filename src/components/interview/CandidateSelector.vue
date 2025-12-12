<template>
  <el-card class="candidate-selector" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">选择候选人</span>
        <router-link to="/positions">
          <el-button type="primary" size="small" link>管理岗位</el-button>
        </router-link>
      </div>
    </template>

    <!-- 岗位选择 -->
    <div class="select-section">
      <label>招聘岗位:</label>
      <el-select
        :model-value="selectedPositionId"
        placeholder="请选择岗位"
        style="width: 100%"
        @update:model-value="$emit('update:selectedPositionId', $event)"
      >
        <el-option
          v-for="pos in positions"
          :key="pos.id"
          :label="`${pos.position} (${pos.resume_count || 0}人)`"
          :value="pos.id"
        />
      </el-select>
    </div>

    <!-- 候选人选择 -->
    <div v-if="currentPositionResumes.length > 0" class="select-section">
      <label>候选人:</label>
      <el-select
        :model-value="selectedResumeId"
        placeholder="请选择候选人"
        style="width: 100%"
        @update:model-value="handleResumeSelect"
      >
        <el-option
          v-for="resume in currentPositionResumes"
          :key="resume.id"
          :label="getResumeLabel(resume)"
          :value="resume.id"
        />
      </el-select>
    </div>

    <div v-else-if="selectedPositionId" class="empty-hint">
      <el-text type="info" size="small">该岗位暂无候选人</el-text>
      <router-link to="/screening">
        <el-button type="primary" size="small" link>去添加简历</el-button>
      </router-link>
    </div>

    <!-- 选中的候选人信息 -->
    <div v-if="selectedResume" class="selected-info">
      <div class="divider"></div>
      <h4>当前候选人</h4>
      <div class="info-card">
        <div class="info-row">
          <span class="name">{{ selectedResume.candidate_name }}</span>
        </div>
        <div class="info-row">
          <span class="label">岗位:</span>
          <span>{{ selectedResume.position_title }}</span>
        </div>
        <div v-if="getScore(selectedResume)" class="info-row">
          <span class="label">初筛评分:</span>
          <el-tag type="success" size="small">{{ getScore(selectedResume) }}</el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PositionData, ResumeData } from '@/types'

const props = defineProps<{
  positions: PositionData[]
  selectedPositionId: string | null
  selectedResumeId: string | null
}>()

const emit = defineEmits<{
  'update:selectedPositionId': [id: string | null]
  'update:selectedResumeId': [id: string | null]
  'select': [resume: ResumeData]
}>()

// 当前岗位下的简历
const currentPositionResumes = computed(() => {
  if (!props.selectedPositionId) return []
  const pos = props.positions.find(p => p.id === props.selectedPositionId)
  return pos?.resumes || []
})

// 当前选中的简历
const selectedResume = computed(() => {
  if (!props.selectedResumeId) return null
  return currentPositionResumes.value.find(r => r.id === props.selectedResumeId) || null
})

// 获取简历显示标签
const getResumeLabel = (resume: ResumeData) => {
  const name = resume.candidate_name || '未知候选人'
  const score = getScore(resume)
  return score ? `${name} (${score}分)` : name
}

// 获取评分
const getScore = (resume: ResumeData) => {
  return resume.screening_score?.comprehensive_score || null
}

// 选择简历
const handleResumeSelect = (id: string) => {
  emit('update:selectedResumeId', id)
  const resume = currentPositionResumes.value.find(r => r.id === id)
  if (resume) {
    emit('select', resume)
  }
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.select-section {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: #606266;
    font-weight: 500;
  }
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: #909399;
}

.selected-info {
  .divider {
    height: 1px;
    background: #e4e7ed;
    margin: 16px 0;
  }

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .info-card {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      .name {
        font-weight: 600;
        color: #303133;
        font-size: 15px;
      }

      .label {
        color: #909399;
      }
    }
  }
}
</style>
