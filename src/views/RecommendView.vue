<template>
  <div class="recommend-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">录用推荐系统</h1>
        <p class="page-desc">基于综合评估结果，提供候选人录用建议（！重要：这一块实际逻辑还没有完善）</p>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- 招聘岗位选择 -->
        <PositionList
          :positions="positionsList"
          :selected-position-id="selectedPositionId"
          @select="selectPosition"
          @assign="goToScreening"
          @show-resume-detail="viewResumeDetail"
          @remove-resume="removeResumeFromPosition"
        />
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <RecommendResultList
          :position-id="selectedPositionId"
          :resumes="currentResumes"
          :analysis-task="analysisTask"
          :is-loading="isLoading"
          :is-running="isRunning"
          :progress="progress"
          :progress-status="getProgressStatus()"
          @start-analysis="handleStartAnalysis"
          @stop-analysis="handleStopAnalysis"
          @download-report="handleDownloadReport"
          @view-report="viewReport"
          @view-video="goToVideoAnalysis"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 组件导入
import { PositionList } from '@/components/common'
import { RecommendResultList } from '@/components/recommend'

// Composables
import { useRecommendAnalysis } from '@/composables/useRecommendAnalysis'

// API 和类型
import { positionApi } from '@/api'
import type { PositionData, ResumeData } from '@/types'

const router = useRouter()

// ========== 岗位管理 ==========
const positionsList = ref<PositionData[]>([])
const selectedPositionId = ref<string | null>(null)

// 当前选中岗位的简历
const currentResumes = computed(() => {
  if (!selectedPositionId.value) return []
  const pos = positionsList.value.find(p => p.id === selectedPositionId.value)
  return pos?.resumes || []
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
      // 检查现有分析任务
      if (firstPosition.id) {
        checkExistingTask(firstPosition.id)
      }
    }
  } catch (err) {
    console.error('加载岗位列表失败:', err)
  }
}

// 选择岗位
const selectPosition = (pos: PositionData) => {
  selectedPositionId.value = pos.id || null
  reset()
  if (pos.id) {
    checkExistingTask(pos.id)
  }
}

// 从岗位移除简历
const removeResumeFromPosition = async (pos: PositionData, resume: ResumeData) => {
  if (!pos.id || !resume.id) return
  
  try {
    await ElMessageBox.confirm(
      `确定要将 "${resume.candidate_name || '该简历'}" 从岗位中移除吗？`,
      '确认移除',
      { type: 'warning' }
    )
    
    await positionApi.removeResume(pos.id, resume.id)
    ElMessage.success('移除成功')
    loadPositionsList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('移除简历失败:', err)
      ElMessage.error('移除失败')
    }
  }
}

// 跳转到简历初筛
const goToScreening = () => {
  router.push('/screening')
}

// ========== 分析任务管理 ==========
const {
  analysisTask,
  isLoading,
  isRunning,
  progress,
  checkExistingTask,
  startAnalysis,
  stopAnalysis,
  downloadReport,
  reset,
  getProgressStatus
} = useRecommendAnalysis()

// 开始分析
const handleStartAnalysis = () => {
  if (selectedPositionId.value) {
    startAnalysis(selectedPositionId.value, () => {
      loadPositionsList()
    })
  }
}

// 停止分析
const handleStopAnalysis = () => {
  stopAnalysis()
}

// 下载报告
const handleDownloadReport = (filePath: string) => {
  downloadReport(filePath)
}

// ========== 简历操作 ==========
// 查看简历详情
const viewResumeDetail = (resume: ResumeData) => {
  // 可以打开详情对话框或跳转
  console.log('查看简历详情:', resume)
}

// 查看初筛报告
const viewReport = (resume: ResumeData) => {
  const url = resume.report_md_url
  if (url) {
    window.open(url, '_blank')
  } else {
    ElMessage.warning('暂无初筛报告')
  }
}

// 跳转视频分析
const goToVideoAnalysis = (resume: ResumeData) => {
  router.push(`/video?resume=${resume.id}`)
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
  .page-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }

  .page-desc {
    margin: 0;
    font-size: 14px;
    color: #909399;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  align-items: start;
}

// 左侧面板
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 右侧面板
.right-panel {
  min-height: 400px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
