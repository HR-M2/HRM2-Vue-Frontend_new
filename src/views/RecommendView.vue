<template>
  <div class="recommend-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <el-icon><TrophyBase /></el-icon>
        </div>
        <div class="header-text">
          <h1 class="page-title">综合分析决策平台</h1>
          <p class="page-desc">整合简历、初筛报告、面试记录，AI智能生成最终录用建议</p>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-value">{{ positionsList.length }}</span>
          <span class="stat-label">岗位</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalCandidates }}</span>
          <span class="stat-label">候选人</span>
        </div>
        <div class="stat-item highlight">
          <span class="stat-value">{{ analyzedCount }}</span>
          <span class="stat-label">已分析</span>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧面板：岗位列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>招聘岗位</h3>
          <el-button size="small" text type="primary" @click="goToScreening">
            <el-icon><Plus /></el-icon>
            添加候选人
          </el-button>
        </div>
        <div class="position-list">
          <div
            v-for="pos in positionsList"
            :key="pos.id"
            class="position-item"
            :class="{ 'active': selectedPositionId === pos.id }"
            @click="selectPosition(pos)"
          >
            <div class="position-info">
              <span class="position-name">{{ pos.position }}</span>
              <span class="position-count">{{ pos.resumes?.length || 0 }} 人</span>
            </div>
            <div class="position-progress">
              <div 
                class="progress-bar" 
                :style="{ width: getPositionAnalyzedPercent(pos) + '%' }"
              ></div>
            </div>
          </div>
          <div v-if="positionsList.length === 0" class="empty-positions">
            <el-empty description="暂无岗位" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 右侧面板：候选人分析卡片 -->
      <div class="right-panel">
        <div v-if="!selectedPositionId" class="empty-state">
          <el-empty description="请选择左侧岗位查看候选人" :image-size="120" />
        </div>
        
        <div v-else-if="currentResumes.length === 0" class="empty-state">
          <el-empty description="该岗位暂无候选人">
            <el-button type="primary" @click="goToScreening">添加候选人</el-button>
          </el-empty>
        </div>
        
        <div v-else class="candidates-container">
          <div class="panel-header">
            <h3>候选人综合分析</h3>
            <span class="candidate-count">共 {{ currentResumes.length }} 人</span>
          </div>
          
          <div class="candidates-list">
            <CandidateAnalysisCard
              v-for="resume in currentResumes"
              :key="resume.id"
              :resume="resume"
              :interview-session="getInterviewSession(resume.id)"
              :final-recommendation="getFinalRecommendation(resume.id)"
              :is-analyzing="isAnalyzingResume(resume.id)"
              :analysis-progress="getAnalysisProgress(resume.id)"
              :analysis-status-text="getAnalysisStatusText(resume.id)"
              :is-generating-report="isGeneratingReportForResume(resume.id)"
              @view-resume="viewResumeDetail(resume)"
              @view-screening-report="viewScreeningReport(resume)"
              @view-interview-records="viewInterviewRecords(resume)"
              @view-interview-report="viewInterviewReport(resume)"
              @view-final-report="viewFinalReport(resume)"
              @go-to-screening="goToScreening"
              @go-to-interview="goToInterview(resume)"
              @start-analysis="startCandidateAnalysis(resume)"
              @generate-interview-report="generateInterviewReportForResume(resume)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 简历内容查看对话框 -->
    <el-dialog
      v-model="showResumeDialog"
      title="简历内容"
      width="700px"
      destroy-on-close
    >
      <div v-if="selectedResumeContent" class="resume-content-view">
        <pre class="resume-text">{{ selectedResumeContent }}</pre>
      </div>
      <template #footer>
        <el-button @click="showResumeDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 初筛报告查看对话框 -->
    <el-dialog
      v-model="showScreeningDialog"
      title="简历初筛报告"
      width="650px"
      destroy-on-close
    >
      <div v-if="selectedScreeningResume" class="screening-report-dialog">
        <!-- 候选人信息 -->
        <div class="report-section">
          <h4>候选人信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">姓名:</span>
              <span class="value">{{ selectedScreeningResume.candidate_name || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">岗位:</span>
              <span class="value">{{ selectedScreeningResume.position_title || '-' }}</span>
            </div>
          </div>
        </div>
        
        <!-- 初筛评分 -->
        <div v-if="selectedScreeningResume.screening_score" class="report-section">
          <h4>初筛评分</h4>
          <div class="scores-grid">
            <div class="score-item primary">
              <span class="score-label">综合评分</span>
              <span class="score-value">{{ selectedScreeningResume.screening_score.comprehensive_score || '-' }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">HR评分</span>
              <span class="score-value">{{ selectedScreeningResume.screening_score.hr_score || '-' }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">技术评分</span>
              <span class="score-value">{{ selectedScreeningResume.screening_score.technical_score || '-' }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">管理评分</span>
              <span class="score-value">{{ selectedScreeningResume.screening_score.manager_score || '-' }}</span>
            </div>
          </div>
        </div>
        
        <!-- 初筛评价 -->
        <div v-if="selectedScreeningResume.screening_summary" class="report-section">
          <h4>初筛评价</h4>
          <div class="summary-content">{{ selectedScreeningResume.screening_summary }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showScreeningDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 面试记录查看对话框 -->
    <el-dialog
      v-model="showInterviewDialog"
      title="面试问答记录"
      width="700px"
      destroy-on-close
    >
      <div v-if="selectedInterviewSession" class="interview-records">
        <div 
          v-for="(qa, index) in selectedInterviewSession.qa_records" 
          :key="index"
          class="qa-item"
        >
          <div class="qa-question">
            <span class="qa-label">Q{{ index + 1 }}:</span>
            <span>{{ qa.question }}</span>
          </div>
          <div class="qa-answer">
            <span class="qa-label">A:</span>
            <span>{{ qa.answer }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showInterviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 面试报告查看对话框 -->
    <el-dialog
      v-model="showInterviewReportDialog"
      title="面试分析报告"
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedInterviewReport" class="interview-report">
        <div class="report-header">
          <div class="report-score" :class="getReportScoreClass(selectedInterviewReport)">
            <span class="score-value">{{ selectedInterviewReport.overall_assessment?.recommendation_score }}</span>
            <span class="score-label">分</span>
          </div>
          <div class="report-recommendation">
            {{ selectedInterviewReport.overall_assessment?.recommendation }}
          </div>
        </div>
        <div class="report-summary">
          <h4>评估总结</h4>
          <p>{{ selectedInterviewReport.overall_assessment?.summary }}</p>
        </div>
        <div v-if="selectedInterviewReport.highlights?.length" class="report-section">
          <h4>亮点</h4>
          <ul>
            <li v-for="(item, i) in selectedInterviewReport.highlights" :key="i">{{ item }}</li>
          </ul>
        </div>
        <div v-if="selectedInterviewReport.red_flags?.length" class="report-section warning">
          <h4>需关注</h4>
          <ul>
            <li v-for="(item, i) in selectedInterviewReport.red_flags" :key="i">{{ item }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="showInterviewReportDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 综合分析详情对话框 -->
    <el-dialog
      v-model="showComprehensiveDialog"
      title="综合分析详情"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedComprehensiveAnalysis" class="comprehensive-analysis">
        <!-- 总体评分 -->
        <div class="analysis-header">
          <div class="score-circle" :class="getComprehensiveScoreClass(selectedComprehensiveAnalysis.score)">
            <span class="score-value">{{ selectedComprehensiveAnalysis.score }}</span>
            <span class="score-label">分</span>
          </div>
          <div class="header-info">
            <h3 class="recommendation-label">{{ selectedComprehensiveAnalysis.recommendation }}</h3>
            <p class="analysis-time" v-if="selectedComprehensiveAnalysis.created_at">
              分析时间：{{ formatDateTime(selectedComprehensiveAnalysis.created_at) }}
            </p>
          </div>
        </div>
        
        <!-- 维度评分雷达 -->
        <div class="dimension-scores">
          <h4>多维度 Rubric 评估</h4>
          <div class="dimension-grid">
            <div 
              v-for="(dim, key) in selectedComprehensiveAnalysis.dimensions" 
              :key="key"
              class="dimension-item"
            >
              <div class="dimension-header">
                <span class="dimension-name">{{ dim.dimension_name }}</span>
                <span class="dimension-score" :class="getDimensionScoreClass(dim.dimension_score)">
                  {{ dim.dimension_score }}/5
                </span>
              </div>
              <el-progress 
                :percentage="dim.dimension_score * 20" 
                :stroke-width="8"
                :color="getDimensionColor(dim.dimension_score)"
              />
              <div class="dimension-details">
                <div v-if="dim.strengths?.length" class="detail-section">
                  <span class="detail-label">优势：</span>
                  <span>{{ dim.strengths.join('、') }}</span>
                </div>
                <div v-if="dim.weaknesses?.length" class="detail-section weakness">
                  <span class="detail-label">不足：</span>
                  <span>{{ dim.weaknesses.join('、') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 综合报告 -->
        <div class="comprehensive-report-text">
          <h4>综合分析报告</h4>
          <div class="report-content" v-html="formatReportContent(selectedComprehensiveAnalysis.summary)"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showComprehensiveDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrophyBase, Plus } from '@element-plus/icons-vue'

// 组件导入
import { CandidateAnalysisCard } from '@/components/recommend'

// API 和类型
import { positionApi, interviewAssistApi, recommendApi } from '@/api'
import type { PositionData, ResumeData } from '@/types'

const router = useRouter()

// ========== 类型定义 ==========
interface InterviewSession {
  id: string
  resume_id: string
  qa_records: Array<{ question: string; answer: string }>
  final_report?: {
    overall_assessment?: {
      recommendation_score: number
      recommendation: string
      summary: string
    }
    highlights?: string[]
    red_flags?: string[]
  }
}

interface FinalRecommendation {
  score: number
  recommendation: string
  summary: string
}

// ========== 岗位管理 ==========
const positionsList = ref<PositionData[]>([])
const selectedPositionId = ref<string | null>(null)

// 当前选中岗位的简历
const currentResumes = computed(() => {
  if (!selectedPositionId.value) return []
  const pos = positionsList.value.find(p => p.id === selectedPositionId.value)
  return pos?.resumes || []
})

// 统计数据
const totalCandidates = computed(() => {
  return positionsList.value.reduce((sum, pos) => sum + (pos.resumes?.length || 0), 0)
})

const analyzedCount = computed(() => {
  return Object.keys(finalRecommendations.value).length
})

// 加载岗位列表
const loadPositionsList = async () => {
  try {
    const result = await positionApi.getPositions({ include_resumes: true })
    positionsList.value = (result.positions || []).map(p => ({ ...p, showAll: false }))
    
    // 默认选中第一个
    const firstPosition = positionsList.value[0]
    if (firstPosition && !selectedPositionId.value) {
      selectedPositionId.value = firstPosition.id ?? null
    }
    
    // 加载所有简历的面试会话
    await loadAllInterviewSessions()
  } catch (err) {
    console.error('加载岗位列表失败:', err)
  }
}

// 选择岗位
const selectPosition = (pos: PositionData) => {
  selectedPositionId.value = pos.id || null
}

// 获取岗位已分析百分比
const getPositionAnalyzedPercent = (pos: PositionData) => {
  const resumes = pos.resumes || []
  if (resumes.length === 0) return 0
  const analyzed = resumes.filter(r => finalRecommendations.value[r.id!]).length
  return Math.round((analyzed / resumes.length) * 100)
}

// 跳转到简历初筛
const goToScreening = () => {
  router.push('/screening')
}

// 跳转到面试
const goToInterview = (resume: ResumeData) => {
  router.push('/interview')
}

// ========== 面试会话管理 ==========
const interviewSessions = ref<Record<string, InterviewSession>>({})
const finalRecommendations = ref<Record<string, FinalRecommendation>>({})
const analyzingResumes = ref<Set<string>>(new Set())
const analysisProgress = ref<Record<string, number>>({})
const analysisStatusTexts = ref<Record<string, string>>({})
const generatingReportResumes = ref<Set<string>>(new Set())

// 加载所有简历的面试会话和历史分析结果
const loadAllInterviewSessions = async () => {
  const allResumes = positionsList.value.flatMap(p => p.resumes || [])
  
  for (const resume of allResumes) {
    if (!resume.id) continue
    try {
      // 查询该简历关联的面试会话
      const sessions = await interviewAssistApi.getSessionsByResumeId(resume.id)
      if (sessions && sessions.length > 0) {
        // 取最新的会话
        const latestSession = sessions[0] as InterviewSession
        interviewSessions.value[resume.id] = latestSession
      }
      
      // 查询历史综合分析结果
      const analysis = await recommendApi.getCandidateAnalysis(resume.id)
      if (analysis) {
        finalRecommendations.value[resume.id] = {
          score: analysis.final_score,
          recommendation: analysis.recommendation.label,
          summary: analysis.comprehensive_report
        }
        dimensionScoresMap.value[resume.id] = analysis.dimension_scores
      }
    } catch (err) {
      // 静默处理
    }
  }
}

// 获取面试会话
const getInterviewSession = (resumeId: string) => {
  return interviewSessions.value[resumeId] || null
}

// 获取最终推荐
const getFinalRecommendation = (resumeId: string) => {
  return finalRecommendations.value[resumeId] || null
}

// 是否正在分析
const isAnalyzingResume = (resumeId: string) => {
  return analyzingResumes.value.has(resumeId)
}

// 获取分析进度
const getAnalysisProgress = (resumeId: string) => {
  return analysisProgress.value[resumeId] || 0
}

// 获取分析状态文本
const getAnalysisStatusText = (resumeId: string) => {
  return analysisStatusTexts.value[resumeId] || ''
}

// 是否正在生成面试报告
const isGeneratingReportForResume = (resumeId: string) => {
  return generatingReportResumes.value.has(resumeId)
}

// 为指定简历生成面试分析报告
const generateInterviewReportForResume = async (resume: ResumeData) => {
  if (!resume.id) return
  
  const session = interviewSessions.value[resume.id]
  if (!session) {
    ElMessage.warning('未找到面试会话')
    return
  }
  
  generatingReportResumes.value.add(resume.id)
  
  try {
    ElMessage.info('正在生成面试分析报告...')
    
    // 调用后端 API 生成报告
    const result = await interviewAssistApi.generateReport(session.id, {
      include_conversation_log: true
    })
    
    // 更新会话中的报告数据
    if (result.report) {
      session.final_report = result.report
      interviewSessions.value[resume.id] = { ...session }
    }
    
    ElMessage.success('面试分析报告已生成')
    
  } catch (err: any) {
    console.error('生成面试报告失败:', err)
    ElMessage.error(err.message || '生成面试报告失败')
  } finally {
    generatingReportResumes.value.delete(resume.id)
  }
}

// ========== 综合分析 ==========
const startCandidateAnalysis = async (resume: ResumeData) => {
  if (!resume.id) return
  
  analyzingResumes.value.add(resume.id)
  analysisProgress.value[resume.id] = 10
  analysisStatusTexts.value[resume.id] = '正在启动综合分析...'
  
  try {
    // 调用后端综合分析 API
    analysisProgress.value[resume.id] = 20
    analysisStatusTexts.value[resume.id] = '正在分析候选人数据...'
    
    const result = await recommendApi.analyzeCandidate(resume.id)
    
    // 更新进度
    analysisProgress.value[resume.id] = 100
    analysisStatusTexts.value[resume.id] = '分析完成'
    
    // 保存结果
    finalRecommendations.value[resume.id] = {
      score: result.final_score,
      recommendation: result.recommendation.label,
      summary: result.comprehensive_report
    }
    
    // 保存详细维度评分（可用于详情展示）
    if (!dimensionScoresMap.value) {
      dimensionScoresMap.value = {}
    }
    dimensionScoresMap.value[resume.id] = result.dimension_scores
    
    ElMessage.success(`综合分析完成：${result.recommendation.label} (${result.final_score}分)`)
    
  } catch (err: any) {
    console.error('综合分析失败:', err)
    ElMessage.error(err.message || '综合分析失败')
    analysisStatusTexts.value[resume.id] = '分析失败'
  } finally {
    analyzingResumes.value.delete(resume.id)
  }
}

// 维度评分详情存储
const dimensionScoresMap = ref<Record<string, any>>({})

// ========== 对话框 ==========
const showResumeDialog = ref(false)
const showScreeningDialog = ref(false)
const showInterviewDialog = ref(false)
const showInterviewReportDialog = ref(false)
const showComprehensiveDialog = ref(false)
const selectedResumeContent = ref<string>('')
const selectedScreeningResume = ref<ResumeData | null>(null)
const selectedInterviewSession = ref<InterviewSession | null>(null)
const selectedInterviewReport = ref<InterviewSession['final_report'] | null>(null)
const selectedComprehensiveAnalysis = ref<{
  score: number
  recommendation: string
  summary: string
  dimensions: Record<string, any>
  created_at?: string
} | null>(null)

// 查看简历详情
const viewResumeDetail = (resume: ResumeData) => {
  const content = resume.resume_content
  if (content) {
    selectedResumeContent.value = content
    showResumeDialog.value = true
  } else {
    ElMessage.warning('暂无简历内容')
  }
}

// 查看初筛报告
const viewScreeningReport = (resume: ResumeData) => {
  if (resume.screening_score || resume.screening_summary) {
    selectedScreeningResume.value = resume
    showScreeningDialog.value = true
  } else {
    ElMessage.warning('暂无初筛报告')
  }
}

// 查看面试记录
const viewInterviewRecords = (resume: ResumeData) => {
  if (!resume.id) return
  const session = interviewSessions.value[resume.id]
  if (session) {
    selectedInterviewSession.value = session
    showInterviewDialog.value = true
  } else {
    ElMessage.warning('暂无面试记录')
  }
}

// 查看面试报告
const viewInterviewReport = (resume: ResumeData) => {
  if (!resume.id) return
  const session = interviewSessions.value[resume.id]
  if (session?.final_report) {
    selectedInterviewReport.value = session.final_report
    showInterviewReportDialog.value = true
  } else {
    ElMessage.warning('暂无面试报告')
  }
}

// 查看最终报告（综合分析详情）
const viewFinalReport = (resume: ResumeData) => {
  if (!resume.id) return
  const recommendation = finalRecommendations.value[resume.id]
  const dimensions = dimensionScoresMap.value[resume.id]
  
  if (recommendation) {
    selectedComprehensiveAnalysis.value = {
      score: recommendation.score,
      recommendation: recommendation.recommendation,
      summary: recommendation.summary,
      dimensions: dimensions || {}
    }
    showComprehensiveDialog.value = true
  } else {
    ElMessage.warning('暂无综合分析结果')
  }
}

// 获取报告分数样式
const getReportScoreClass = (report: InterviewSession['final_report']) => {
  const score = report?.overall_assessment?.recommendation_score || 0
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

// 综合分析详情相关函数
const getComprehensiveScoreClass = (score: number) => {
  if (score >= 85) return 'score-strong'
  if (score >= 70) return 'score-good'
  if (score >= 55) return 'score-cautious'
  return 'score-not'
}

const getDimensionScoreClass = (score: number) => {
  if (score >= 4) return 'dim-excellent'
  if (score >= 3) return 'dim-good'
  return 'dim-weak'
}

const getDimensionColor = (score: number) => {
  if (score >= 4) return '#10b981'
  if (score >= 3) return '#3b82f6'
  if (score >= 2) return '#f59e0b'
  return '#ef4444'
}

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatReportContent = (content: string) => {
  if (!content) return ''
  // 简单的 markdown 转 HTML
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

// ========== 生命周期 ==========
onMounted(() => {
  loadPositionsList()
})
</script>

<style scoped lang="scss">
.recommend-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .el-icon {
        font-size: 28px;
      }
    }
    
    .header-text {
      .page-title {
        margin: 0 0 4px;
        font-size: 24px;
        font-weight: 700;
      }
      
      .page-desc {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }
  
  .header-stats {
    display: flex;
    gap: 32px;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 28px;
        font-weight: 700;
      }
      
      .stat-label {
        font-size: 13px;
        opacity: 0.8;
      }
      
      &.highlight {
        .stat-value {
          color: #fbbf24;
        }
      }
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

// 左侧面板
.left-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }
  }
  
  .position-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .position-item {
    padding: 14px 16px;
    background: #f9fafb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
    
    &:hover {
      background: #f3f4f6;
    }
    
    &.active {
      background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
      border-color: #667eea;
    }
    
    .position-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .position-name {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
      
      .position-count {
        font-size: 12px;
        color: #6b7280;
        background: #e5e7eb;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }
    
    .position-progress {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      
      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        border-radius: 2px;
        transition: width 0.3s;
      }
    }
  }
  
  .empty-positions {
    padding: 20px 0;
  }
}

// 右侧面板
.right-panel {
  min-height: 500px;
  
  .empty-state {
    background: white;
    border-radius: 16px;
    padding: 60px 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  
  .candidates-container {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1a1a2e;
      }
      
      .candidate-count {
        font-size: 14px;
        color: #6b7280;
      }
    }
    
    .candidates-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }
}

// 对话框样式
.resume-content-view {
  max-height: 500px;
  overflow-y: auto;
  
  .resume-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #374151;
    background: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    margin: 0;
  }
}

.screening-report-dialog {
  .report-section {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      border-left: 3px solid #667eea;
      padding-left: 10px;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    
    .info-item {
      .label {
        color: #909399;
        margin-right: 8px;
      }
      .value {
        color: #303133;
        font-weight: 500;
      }
    }
  }
  
  .scores-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    
    .score-item {
      text-align: center;
      padding: 16px 12px;
      background: #f5f7fa;
      border-radius: 12px;
      
      &.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        
        .score-label {
          color: rgba(255, 255, 255, 0.9);
        }
        .score-value {
          color: white;
          font-size: 28px;
        }
      }
      
      .score-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 8px;
      }
      
      .score-value {
        display: block;
        font-size: 22px;
        font-weight: 600;
        color: #10b981;
      }
    }
  }
  
  .summary-content {
    padding: 16px;
    background: #f9fafb;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.8;
    color: #374151;
    white-space: pre-wrap;
  }
}

.interview-records {
  max-height: 500px;
  overflow-y: auto;
  
  .qa-item {
    padding: 16px;
    background: #f9fafb;
    border-radius: 12px;
    margin-bottom: 12px;
    
    .qa-question {
      margin-bottom: 12px;
      font-weight: 500;
      color: #374151;
      
      .qa-label {
        color: #667eea;
        font-weight: 600;
        margin-right: 8px;
      }
    }
    
    .qa-answer {
      color: #6b7280;
      line-height: 1.6;
      
      .qa-label {
        color: #10b981;
        font-weight: 600;
        margin-right: 8px;
      }
    }
  }
}

.interview-report {
  .report-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    
    .report-score {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      &.score-high {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      &.score-medium {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      &.score-low {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }
      
      .score-value {
        font-size: 24px;
        font-weight: 700;
      }
      
      .score-label {
        font-size: 12px;
        opacity: 0.9;
      }
    }
    
    .report-recommendation {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
    }
  }
  
  .report-summary {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #6b7280;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.6;
    }
  }
  
  .report-section {
    margin-bottom: 16px;
    
    h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #10b981;
    }
    
    &.warning h4 {
      color: #f59e0b;
    }
    
    ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        font-size: 13px;
        color: #374151;
        margin-bottom: 4px;
      }
    }
  }
}

// 综合分析详情对话框样式
.comprehensive-analysis {
  .analysis-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border-radius: 16px;
    
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      &.score-strong {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      &.score-good {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      &.score-cautious {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      &.score-not {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }
      
      .score-value {
        font-size: 32px;
        font-weight: 700;
      }
      
      .score-label {
        font-size: 14px;
        opacity: 0.9;
      }
    }
    
    .header-info {
      .recommendation-label {
        margin: 0 0 8px;
        font-size: 24px;
        font-weight: 700;
        color: #1a1a2e;
      }
      
      .analysis-time {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }
    }
  }
  
  .dimension-scores {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .dimension-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .dimension-item {
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      
      .dimension-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .dimension-name {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        
        .dimension-score {
          font-size: 14px;
          font-weight: 600;
          
          &.dim-excellent {
            color: #10b981;
          }
          &.dim-good {
            color: #3b82f6;
          }
          &.dim-weak {
            color: #f59e0b;
          }
        }
      }
      
      .dimension-details {
        margin-top: 12px;
        
        .detail-section {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          
          .detail-label {
            color: #10b981;
            font-weight: 500;
          }
          
          &.weakness .detail-label {
            color: #f59e0b;
          }
        }
      }
    }
  }
  
  .comprehensive-report-text {
    h4 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    
    .report-content {
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      font-size: 14px;
      color: #374151;
      line-height: 1.8;
      
      p {
        margin: 0 0 12px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      strong {
        color: #1a1a2e;
      }
    }
  }
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    
    .header-content {
      flex-direction: column;
    }
  }
  
  .comprehensive-analysis .dimension-scores .dimension-grid {
    grid-template-columns: 1fr;
  }
}
</style>
