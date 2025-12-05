<template>
  <el-card class="video-resumes-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">候选人视频分析</span>
        <el-tag v-if="selectedPosition" type="info" size="small">
          {{ selectedPosition.position }}
        </el-tag>
      </div>
    </template>

    <!-- 未选择岗位 -->
    <div v-if="!selectedPosition" class="empty-state">
      <el-empty description="请在左侧选择岗位查看候选人" :image-size="100" />
    </div>

    <!-- 岗位无简历 -->
    <div v-else-if="!resumes.length" class="empty-state">
      <el-empty description="该岗位暂无候选人简历" :image-size="100">
        <el-button type="primary" size="small" @click="$emit('goToScreening')">
          去初筛添加
        </el-button>
      </el-empty>
    </div>

    <!-- 简历列表 -->
    <div v-else class="resumes-list">
      <div 
        v-for="resume in resumes" 
        :key="resume.id" 
        class="resume-item"
        :class="{ 'has-video': resume.video_analysis_status }"
      >
        <!-- 候选人信息 -->
        <div class="resume-header">
          <div class="candidate-info">
            <h4>{{ resume.candidate_name || '未知候选人' }}</h4>
            <span class="position">{{ resume.position_title }}</span>
          </div>
          <div 
            class="score-badge"
            :class="getScoreBadgeClass(resume.screening_score?.comprehensive_score)"
          >
            <span class="score-label">综合评分</span>
            <span class="score-value">{{ resume.screening_score?.comprehensive_score || 'N/A' }}</span>
          </div>
        </div>

        <!-- 初筛评分 -->
        <div class="score-breakdown">
          <div class="score-item">
            <span class="label">HR:</span>
            <strong>{{ resume.screening_score?.hr_score || 'N/A' }}</strong>
          </div>
          <div class="score-item">
            <span class="label">技术:</span>
            <strong>{{ resume.screening_score?.technical_score || 'N/A' }}</strong>
          </div>
          <div class="score-item">
            <span class="label">管理:</span>
            <strong>{{ resume.screening_score?.manager_score || 'N/A' }}</strong>
          </div>
        </div>

        <!-- 视频分析结果 -->
        <div 
          v-if="resume.video_analysis && resume.video_analysis.status === 'completed'" 
          class="video-analysis-scores"
        >
          <div class="section-title">
            <el-icon><VideoCamera /></el-icon>
            视频分析评分
          </div>
          <div class="analysis-grid">
            <div class="analysis-item fraud">
              <span class="label">欺诈风险:</span>
              <strong :class="getFraudScoreClass(resume.video_analysis.fraud_score)">
                {{ formatScore(resume.video_analysis.fraud_score) }}
              </strong>
            </div>
            <div class="analysis-item">
              <span class="label">自信度:</span>
              <strong>{{ formatScore(resume.video_analysis.confidence_score) }}</strong>
            </div>
            <div class="analysis-item">
              <span class="label">外倾性:</span>
              <strong>{{ formatScore(resume.video_analysis.extraversion_score) }}</strong>
            </div>
            <div class="analysis-item">
              <span class="label">开放性:</span>
              <strong>{{ formatScore(resume.video_analysis.openness_score) }}</strong>
            </div>
            <div class="analysis-item">
              <span class="label">宜人性:</span>
              <strong>{{ formatScore(resume.video_analysis.agreeableness_score) }}</strong>
            </div>
            <div class="analysis-item">
              <span class="label">尽责性:</span>
              <strong>{{ formatScore(resume.video_analysis.conscientiousness_score) }}</strong>
            </div>
          </div>
        </div>

        <!-- 视频分析状态 -->
        <div v-else-if="resume.video_analysis" class="video-status">
          <span class="label">视频分析状态:</span>
          <el-tag :type="getVideoStatusType(resume.video_analysis.status)" size="small">
            {{ getVideoStatusText(resume.video_analysis.status) }}
          </el-tag>
        </div>

        <!-- 操作按钮 -->
        <div class="resume-actions">
          <el-button 
            size="small" 
            @click="$emit('viewDetail', resume)"
          >
            查看简历
          </el-button>
          <el-button
            v-if="!resume.video_analysis"
            size="small"
            type="primary"
            @click="$emit('uploadVideo', resume)"
          >
            <el-icon><Upload /></el-icon>
            上传视频
          </el-button>
          <el-button
            v-else-if="resume.video_analysis.status === 'completed'"
            size="small"
            type="success"
            @click="$emit('viewVideoResult', resume)"
          >
            <el-icon><VideoCamera /></el-icon>
            查看分析
          </el-button>
          <el-button
            v-else-if="resume.video_analysis.status === 'processing'"
            size="small"
            type="warning"
            loading
          >
            分析中...
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VideoCamera, Upload } from '@element-plus/icons-vue'
import type { PositionData, ResumeData } from '@/types'

const props = defineProps<{
  selectedPosition: PositionData | null
}>()

defineEmits<{
  goToScreening: []
  viewDetail: [resume: ResumeData]
  uploadVideo: [resume: ResumeData]
  viewVideoResult: [resume: ResumeData]
}>()

// 从岗位获取简历列表
const resumes = computed(() => {
  return props.selectedPosition?.resumes || []
})

// 工具函数
const formatScore = (score?: number) => {
  if (score === undefined || score === null) return 'N/A'
  return score.toFixed(2)
}

const getScoreBadgeClass = (score?: number) => {
  if (score === undefined || score === null) return 'score-na'
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

const getFraudScoreClass = (score?: number) => {
  if (score === undefined || score === null) return ''
  if (score >= 0.7) return 'fraud-high'
  if (score >= 0.4) return 'fraud-medium'
  return 'fraud-low'
}

const getVideoStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getVideoStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '等待处理',
    processing: '分析中',
    completed: '已完成',
    failed: '分析失败'
  }
  return texts[status] || status
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

.empty-state {
  padding: 40px 0;
}

.resumes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resume-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #909399;
  transition: all 0.2s;

  &.has-video {
    border-left-color: #409eff;
  }

  &:hover {
    background: #f5f7fa;
  }
}

.resume-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .candidate-info {
    h4 {
      margin: 0 0 4px 0;
      font-size: 15px;
      color: #303133;
    }

    .position {
      font-size: 13px;
      color: #909399;
    }
  }
}

.score-badge {
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  background: #f5f7fa;

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

  .score-label {
    display: block;
    font-size: 11px;
    color: #909399;
    margin-bottom: 2px;
  }

  .score-value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
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

.video-analysis-scores {
  margin: 12px 0;
  padding: 12px;
  background: #ecf5ff;
  border-radius: 6px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #409eff;
    margin-bottom: 10px;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .analysis-item {
    font-size: 12px;

    .label {
      color: #606266;
    }

    strong {
      margin-left: 4px;
      color: #303133;

      &.fraud-high { color: #f56c6c; }
      &.fraud-medium { color: #e6a23c; }
      &.fraud-low { color: #67c23a; }
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

.resume-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
