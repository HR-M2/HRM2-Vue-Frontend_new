<template>
  <div class="candidate-card" :class="{ 'expanded': isExpanded }">
    <!-- 卡片头部 -->
    <div class="card-header" @click="toggleExpand">
      <div class="candidate-info">
        <div class="avatar">
          <el-icon><User /></el-icon>
        </div>
        <div class="info">
          <h3>{{ resume.candidate_name || '未知候选人' }}</h3>
          <p class="position">{{ resume.position_title || '未指定岗位' }}</p>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 综合推荐标签 -->
        <div v-if="finalRecommendation" class="recommendation-badge" :class="recommendationClass">
          <el-icon><Trophy /></el-icon>
          <span>{{ finalRecommendation.recommendation }}</span>
          <span class="score">{{ finalRecommendation.score }}分</span>
        </div>
        <div v-else class="status-badge pending">
          <el-icon><Clock /></el-icon>
          <span>待分析</span>
        </div>
        
        <el-icon class="expand-icon" :class="{ 'rotated': isExpanded }">
          <ArrowDown />
        </el-icon>
      </div>
    </div>
    
    <!-- 数据完整度进度条 -->
    <div class="completeness-bar">
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: completenessPercent + '%' }"></div>
      </div>
      <span class="bar-label">数据完整度 {{ completenessPercent }}%</span>
    </div>
    
    <!-- 展开内容 -->
    <transition name="expand">
      <div v-if="isExpanded" class="card-content">
        <!-- 数据源状态列表 -->
        <div class="data-sources">
          <h4 class="section-title">
            <el-icon><Document /></el-icon>
            分析数据源
          </h4>
          
          <!-- 1. 简历 -->
          <div class="data-item" :class="{ 'available': hasResume }">
            <div class="item-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-name">简历文件</span>
              <span class="item-status">{{ hasResume ? '已上传' : '未上传' }}</span>
            </div>
            <el-button v-if="hasResume" size="small" text type="primary" @click.stop="$emit('viewResume')">
              查看
            </el-button>
          </div>
          
          <!-- 2. 简历初筛报告 -->
          <div class="data-item" :class="{ 'available': hasScreeningReport }">
            <div class="item-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-name">简历初筛报告</span>
              <span class="item-status">
                {{ hasScreeningReport ? `评分 ${screeningScore}` : '未生成' }}
              </span>
            </div>
            <el-button v-if="hasScreeningReport" size="small" text type="primary" @click.stop="$emit('viewScreeningReport')">
              查看
            </el-button>
            <el-button v-else size="small" text @click.stop="$emit('goToScreening')">
              去初筛
            </el-button>
          </div>
          
          <!-- 3. 面试记录 -->
          <div class="data-item" :class="{ 'available': hasInterviewRecords }">
            <div class="item-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-name">面试问答记录</span>
              <span class="item-status">
                {{ hasInterviewRecords ? `${interviewQACount} 轮问答` : '无记录' }}
              </span>
            </div>
            <el-button v-if="hasInterviewRecords" size="small" text type="primary" @click.stop="$emit('viewInterviewRecords')">
              查看
            </el-button>
            <el-button v-else size="small" text @click.stop="$emit('goToInterview')">
              去面试
            </el-button>
          </div>
          
          <!-- 4. 面试分析报告 -->
          <div class="data-item" :class="{ 'available': hasInterviewReport }">
            <div class="item-icon">
              <el-icon><Memo /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-name">面试分析报告</span>
              <span class="item-status">
                {{ hasInterviewReport ? getInterviewRecommendation() : (hasInterviewRecords ? '有问答记录，可生成' : '未生成') }}
              </span>
            </div>
            <el-button v-if="hasInterviewReport" size="small" text type="primary" @click.stop="$emit('viewInterviewReport')">
              查看
            </el-button>
            <el-button 
              v-else-if="hasInterviewRecords" 
              size="small" 
              type="primary"
              :loading="isGeneratingReport"
              @click.stop="$emit('generateInterviewReport')"
            >
              生成报告
            </el-button>
          </div>
          
          <!-- 5. 面试视频分析（预留） -->
          <div class="data-item disabled">
            <div class="item-icon">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <div class="item-info">
              <span class="item-name">面试视频分析</span>
              <span class="item-status reserved">功能开发中</span>
            </div>
            <el-tag size="small" type="info">预留</el-tag>
          </div>
        </div>
        
        <!-- 综合分析操作区 -->
        <div class="analysis-section">
          <h4 class="section-title">
            <el-icon><MagicStick /></el-icon>
            综合分析
          </h4>
          
          <div v-if="!canAnalyze" class="analysis-requirements">
            <el-alert type="warning" :closable="false" show-icon>
              <template #title>
                需要以下数据才能进行综合分析：
              </template>
              <ul class="requirements-list">
                <li :class="{ 'met': hasResume }">
                  <el-icon><Check v-if="hasResume" /><Close v-else /></el-icon>
                  简历文件
                </li>
                <li :class="{ 'met': hasScreeningReport }">
                  <el-icon><Check v-if="hasScreeningReport" /><Close v-else /></el-icon>
                  简历初筛报告
                </li>
                <li :class="{ 'met': hasInterviewReport }">
                  <el-icon><Check v-if="hasInterviewReport" /><Close v-else /></el-icon>
                  面试分析报告
                </li>
              </ul>
            </el-alert>
          </div>
          
          <div v-else-if="isAnalyzing" class="analysis-progress">
            <el-progress :percentage="analysisProgress" :status="analysisStatus" :stroke-width="12" />
            <p class="progress-text">{{ analysisStatusText }}</p>
          </div>
          
          <div v-else-if="finalRecommendation" class="analysis-result">
            <div class="result-header">
              <div class="result-badge" :class="recommendationClass">
                <el-icon><Trophy /></el-icon>
                <span class="result-text">{{ finalRecommendation.recommendation }}</span>
                <span class="result-score">{{ finalRecommendation.score }}分</span>
              </div>
              <el-button size="small" text type="primary" @click.stop="$emit('viewFinalReport')">
                查看完整报告
              </el-button>
            </div>
            <div class="result-summary">
              <p>{{ finalRecommendation.summary }}</p>
            </div>
            <el-button type="primary" plain size="small" @click.stop="$emit('startAnalysis')">
              重新分析
            </el-button>
          </div>
          
          <div v-else class="analysis-action">
            <el-button 
              type="primary" 
              size="large"
              :loading="isAnalyzing"
              @click.stop="$emit('startAnalysis')"
            >
              <el-icon><MagicStick /></el-icon>
              开始综合分析
            </el-button>
            <p class="action-hint">将综合简历、初筛报告、面试记录生成最终录用建议</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  User, Trophy, Clock, ArrowDown, Document, DataAnalysis, 
  ChatDotRound, Memo, VideoCamera, MagicStick, Check, Close 
} from '@element-plus/icons-vue'
import type { ResumeData } from '@/types'

interface InterviewSession {
  id: string
  qa_records: Array<{ question: string; answer: string }>
  final_report?: {
    overall_assessment?: {
      recommendation_score: number
      recommendation: string
      summary: string
    }
  }
}

interface FinalRecommendation {
  score: number
  recommendation: string
  summary: string
}

const props = defineProps<{
  resume: ResumeData
  interviewSession?: InterviewSession | null
  finalRecommendation?: FinalRecommendation | null
  isAnalyzing?: boolean
  analysisProgress?: number
  analysisStatusText?: string
  isGeneratingReport?: boolean
}>()

defineEmits<{
  viewResume: []
  viewScreeningReport: []
  viewInterviewRecords: []
  viewInterviewReport: []
  viewFinalReport: []
  goToScreening: []
  goToInterview: []
  startAnalysis: []
  generateInterviewReport: []
}>()

const isExpanded = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 数据状态计算
const hasResume = computed(() => !!props.resume.resume_content || !!(props.resume as any).file_path)

const hasScreeningReport = computed(() => {
  return !!props.resume.screening_score || !!props.resume.report_md_url
})

const screeningScore = computed(() => {
  return props.resume.screening_score?.comprehensive_score || 'N/A'
})

const hasInterviewRecords = computed(() => {
  return props.interviewSession?.qa_records && props.interviewSession.qa_records.length > 0
})

const interviewQACount = computed(() => {
  return props.interviewSession?.qa_records?.length || 0
})

const hasInterviewReport = computed(() => {
  return !!props.interviewSession?.final_report
})

const getInterviewRecommendation = () => {
  const report = props.interviewSession?.final_report
  if (!report?.overall_assessment) return '已生成'
  return report.overall_assessment.recommendation
}

// 数据完整度
const completenessPercent = computed(() => {
  let count = 0
  if (hasResume.value) count++
  if (hasScreeningReport.value) count++
  if (hasInterviewRecords.value) count++
  if (hasInterviewReport.value) count++
  // 视频分析暂不计入
  return Math.round((count / 4) * 100)
})

// 是否可以进行综合分析
const canAnalyze = computed(() => {
  return hasResume.value && hasScreeningReport.value && hasInterviewReport.value
})

// 分析状态
const analysisStatus = computed(() => {
  if (props.analysisProgress === 100) return 'success'
  return ''
})

// 推荐等级样式
const recommendationClass = computed(() => {
  if (!props.finalRecommendation) return ''
  const score = props.finalRecommendation.score
  if (score >= 80) return 'level-strong'
  if (score >= 60) return 'level-normal'
  if (score >= 40) return 'level-weak'
  return 'level-reject'
})
</script>

<style scoped lang="scss">
.candidate-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  &.expanded {
    border-color: #667eea;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  cursor: pointer;
  
  .candidate-info {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      .el-icon {
        font-size: 24px;
        color: white;
      }
    }
    
    .info {
      h3 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a2e;
      }
      
      .position {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .expand-icon {
      transition: transform 0.3s;
      color: #9ca3af;
      
      &.rotated {
        transform: rotate(180deg);
      }
    }
  }
}

.recommendation-badge, .status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  
  .score {
    margin-left: 4px;
    font-weight: 600;
  }
}

.recommendation-badge {
  &.level-strong {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  &.level-normal {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }
  &.level-weak {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }
  &.level-reject {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
  }
}

.status-badge.pending {
  background: #f3f4f6;
  color: #6b7280;
}

.completeness-bar {
  padding: 0 24px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .bar-track {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 3px;
      transition: width 0.3s;
    }
  }
  
  .bar-label {
    font-size: 12px;
    color: #9ca3af;
    white-space: nowrap;
  }
}

.card-content {
  padding: 0 24px 24px;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  
  .el-icon {
    color: #667eea;
  }
}

.data-sources {
  .data-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 10px;
    margin-bottom: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
    
    &.available {
      background: #f0fdf4;
      border-color: #bbf7d0;
      
      .item-icon {
        background: #10b981;
      }
      
      .item-status {
        color: #10b981;
      }
    }
    
    &.disabled {
      opacity: 0.6;
      
      .item-status.reserved {
        color: #9ca3af;
        font-style: italic;
      }
    }
    
    .item-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .el-icon {
        font-size: 16px;
        color: white;
      }
    }
    
    .item-info {
      flex: 1;
      
      .item-name {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
      }
      
      .item-status {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }
}

.analysis-section {
  margin-top: 8px;
  
  .analysis-requirements {
    .requirements-list {
      margin: 8px 0 0;
      padding-left: 0;
      list-style: none;
      
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 4px;
        
        &.met {
          color: #10b981;
        }
        
        .el-icon {
          font-size: 14px;
        }
      }
    }
  }
  
  .analysis-progress {
    padding: 20px;
    background: #f0f9ff;
    border-radius: 12px;
    text-align: center;
    
    .progress-text {
      margin: 12px 0 0;
      font-size: 13px;
      color: #3b82f6;
    }
  }
  
  .analysis-result {
    padding: 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-radius: 12px;
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .result-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 24px;
      
      &.level-strong {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      &.level-normal {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      &.level-weak {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      &.level-reject {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }
      
      .result-text {
        font-weight: 600;
      }
      
      .result-score {
        font-size: 18px;
        font-weight: 700;
      }
    }
    
    .result-summary {
      p {
        margin: 0;
        font-size: 14px;
        color: #374151;
        line-height: 1.6;
      }
    }
  }
  
  .analysis-action {
    text-align: center;
    padding: 24px;
    background: linear-gradient(135deg, #f0f5ff 0%, #ede9fe 100%);
    border-radius: 12px;
    
    .el-button {
      padding: 12px 32px;
      font-size: 15px;
    }
    
    .action-hint {
      margin: 12px 0 0;
      font-size: 13px;
      color: #6b7280;
    }
  }
}

// 展开动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>
