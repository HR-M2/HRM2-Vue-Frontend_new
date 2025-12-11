<template>
  <el-card class="recommend-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">录用推荐</span>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-if="!positionId" class="empty-state">
      <el-empty description="请选择岗位以查看推荐结果" :image-size="100" />
    </div>

    <div v-else-if="resumes.length === 0" class="empty-state">
      <el-empty description="该岗位暂无候选人" :image-size="100" />
    </div>

    <!-- 候选人列表 -->
    <div v-else class="resumes-list">
      <div
        v-for="resume in sortedResumes"
        :key="resume.id"
        class="resume-item"
        :class="getRecommendationClass(resume)"
      >
        <div class="resume-header">
          <div class="candidate-info">
            <h4>{{ resume.candidate_name || '未知候选人' }}</h4>
            <div class="recommendation-badge" :class="getRecommendBadgeClass(resume)">
              {{ getRecommendText(resume) }}
            </div>
          </div>
          <div
            class="score-badge"
            :class="getScoreBadgeClass(getComprehensiveScore(resume))"
          >
            <span class="score-label">综合评分</span>
            <span class="score-value">{{ getComprehensiveScore(resume) || 'N/A' }}</span>
          </div>
        </div>

        <!-- 评分详情 -->
        <div class="score-breakdown">
          <div class="score-item">
            <span class="label">HR评分:</span>
            <strong>{{ resume.scores?.hr_score || resume.screening_score?.comprehensive_score || 'N/A' }}</strong>
          </div>
          <div class="score-item">
            <span class="label">技术评分:</span>
            <strong>{{ resume.scores?.technical_score || 'N/A' }}</strong>
          </div>
          <div class="score-item">
            <span class="label">管理评分:</span>
            <strong>{{ resume.scores?.manager_score || 'N/A' }}</strong>
          </div>
        </div>

        <!-- 视频分析状态 -->
        <div v-if="resume.video_analysis_status || resume.video_analysis" class="video-status">
          <span class="label">视频分析:</span>
          <el-tag :type="getVideoStatusType(resume)" size="small">
            {{ getVideoStatusText(resume) }}
          </el-tag>
        </div>

        <!-- 摘要 -->
        <div v-if="resume.summary || resume.screening_summary" class="resume-summary">
          <h5>初筛摘要:</h5>
          <div v-html="renderMarkdown(resume.summary || resume.screening_summary || '')"></div>
        </div>

        <!-- 操作按钮 -->
        <div class="resume-actions">
          <el-button size="small" @click="$emit('viewReport', resume)">
            初筛报告
          </el-button>
          <el-button
            size="small"
            :type="hasVideoAnalysis(resume) ? 'success' : 'primary'"
            @click="$emit('viewVideo', resume)"
          >
            {{ hasVideoAnalysis(resume) ? '查看面试分析' : '面试分析' }}
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import type { ResumeData } from '@/types'

// 注意: 批量评估功能（analysisTask, isLoading, isRunning, progress 等）已废弃
// 请使用单人综合分析功能（recommendApi.analyzeCandidate）
const props = defineProps<{
  positionId: string | null
  resumes: ResumeData[]
}>()

defineEmits<{
  viewReport: [resume: ResumeData]
  viewVideo: [resume: ResumeData]
}>()

// 排序后的简历
const sortedResumes = computed(() => {
  return [...props.resumes].sort((a, b) => {
    const scoreA = getComprehensiveScore(a) || 0
    const scoreB = getComprehensiveScore(b) || 0
    return scoreB - scoreA
  })
})

// 获取综合评分
const getComprehensiveScore = (resume: ResumeData) => {
  return resume.scores?.comprehensive_score || resume.screening_score?.comprehensive_score
}

// 视频分析状态
const hasVideoAnalysis = (resume: ResumeData) => {
  return resume.video_analysis_status === 'completed' || resume.video_analysis?.status === 'completed'
}

const getVideoStatusType = (resume: ResumeData) => {
  const status = resume.video_analysis_status || resume.video_analysis?.status
  const types: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    failed: 'danger'
  }
  return types[status || ''] || 'info'
}

const getVideoStatusText = (resume: ResumeData) => {
  const status = resume.video_analysis_status || resume.video_analysis?.status
  const texts: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status || ''] || '未分析'
}

// 评分相关样式
const getScoreBadgeClass = (score?: number) => {
  if (score === undefined || score === null) return 'score-na'
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const getRecommendationClass = (resume: ResumeData) => {
  const score = getComprehensiveScore(resume)
  if (!score) return ''
  if (score >= 80) return 'recommend-strong'
  if (score >= 60) return 'recommend-normal'
  return 'recommend-weak'
}

const getRecommendBadgeClass = (resume: ResumeData) => {
  const score = getComprehensiveScore(resume)
  if (!score) return 'badge-na'
  if (score >= 80) return 'badge-strong'
  if (score >= 60) return 'badge-normal'
  return 'badge-weak'
}

const getRecommendText = (resume: ResumeData) => {
  const score = getComprehensiveScore(resume)
  if (!score) return '待评估'
  if (score >= 80) return '强烈推荐'
  if (score >= 60) return '建议录用'
  return '谨慎考虑'
}

// 渲染 Markdown
const renderMarkdown = (text: string) => marked(text)
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

// 空状态
.empty-state {
  padding: 40px 0;
}

// 简历列表
.resumes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resume-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #909399;

  &.recommend-strong {
    border-left-color: #67c23a;
    background: #f0f9eb;
  }

  &.recommend-normal {
    border-left-color: #409eff;
    background: #ecf5ff;
  }

  &.recommend-weak {
    border-left-color: #e6a23c;
    background: #fdf6ec;
  }
}

.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .candidate-info {
    h4 {
      margin: 0 0 8px 0;
      font-size: 15px;
      color: #303133;
    }
  }
}

.recommendation-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.badge-strong {
    background: #67c23a;
    color: white;
  }

  &.badge-normal {
    background: #409eff;
    color: white;
  }

  &.badge-weak {
    background: #e6a23c;
    color: white;
  }

  &.badge-na {
    background: #909399;
    color: white;
  }
}

.score-badge {
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  background: #f0f9eb;

  &.score-high {
    background: #f0f9eb;
    .score-value { color: #67c23a; }
  }

  &.score-medium {
    background: #fdf6ec;
    .score-value { color: #e6a23c; }
  }

  &.score-low {
    background: #fef0f0;
    .score-value { color: #f56c6c; }
  }

  &.score-na {
    background: #f5f7fa;
    .score-value { color: #909399; }
  }

  .score-label {
    display: block;
    font-size: 11px;
    color: #909399;
    margin-bottom: 2px;
  }

  .score-value {
    font-size: 18px;
    font-weight: 600;
  }
}

.score-breakdown {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;

  .score-item {
    font-size: 13px;

    .label {
      color: #909399;
    }

    strong {
      color: #303133;
      margin-left: 4px;
    }
  }
}

.video-status {
  margin: 12px 0;
  font-size: 13px;

  .label {
    color: #909399;
    margin-right: 8px;
  }
}

.resume-summary {
  margin: 12px 0;

  h5 {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: #303133;
  }

  :deep(p) {
    margin: 0;
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
  }
}

.resume-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
