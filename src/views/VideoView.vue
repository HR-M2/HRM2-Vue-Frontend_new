<template>
  <div class="video-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">视频面试分析系统</h1>
        <p class="page-desc">通过AI技术分析视频面试内容，提供候选人综合素质评估</p>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧面板 - 复用招聘岗位组件 -->
      <div class="left-panel">
        <PositionList
          :positions="positionsList"
          :selected-position-id="selectedPositionId"
          @select="selectPosition"
          @assign="goToScreening"
          @show-resume-detail="showResumeDetail"
          @remove-resume="removeResumeFromPosition"
        />
      </div>

      <!-- 右侧面板 - 视频分析候选人列表 -->
      <div class="right-panel">
        <VideoResumeList
          :selected-position="selectedPosition"
          @go-to-screening="goToScreening"
          @view-detail="showResumeDetail"
          @upload-video="openUploadDialog"
          @view-video-result="viewVideoResult"
        />
      </div>
    </div>

    <!-- 视频上传对话框 -->
    <VideoUploadDialog
      v-model="uploadDialogVisible"
      :candidate-name="currentResume?.candidate_name || ''"
      :loading="uploading"
      @file-change="handleVideoChange"
      @submit="submitVideo"
    />

    <!-- 简历详情对话框 -->
    <ResumeDetailDialog
      v-model="resumeDetailVisible"
      :resume="selectedResumeDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 组件导入
import { PositionList } from '@/components/common'
import { ResumeDetailDialog } from '@/components/screening'
import { VideoResumeList, VideoUploadDialog } from '@/components/video'

// API 和类型
import { positionApi, videoApi } from '@/api'
import type { PositionData, ResumeData } from '@/types'

const router = useRouter()

// ========== 岗位管理 ==========
const positionsList = ref<PositionData[]>([])
const selectedPositionId = ref<string | null>(null)

// 计算当前选中的岗位
const selectedPosition = computed(() => {
  if (!selectedPositionId.value) return null
  return positionsList.value.find(p => p.id === selectedPositionId.value) || null
})

// 加载岗位列表（包含简历）
const loadPositionsList = async () => {
  try {
    const result = await positionApi.getPositions({ include_resumes: true })
    positionsList.value = (result.positions || []).map(p => ({ ...p, showAll: false }))
    
    // 默认选中第一个
    const firstPosition = positionsList.value[0]
    if (firstPosition && !selectedPositionId.value) {
      selectedPositionId.value = firstPosition.id ?? null
    }
  } catch (err) {
    console.error('加载岗位列表失败:', err)
  }
}

// 选择岗位
const selectPosition = (pos: PositionData) => {
  selectedPositionId.value = pos.id || null
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

// ========== 视频上传 ==========
const uploadDialogVisible = ref(false)
const currentResume = ref<ResumeData | null>(null)
const selectedVideoFile = ref<File | null>(null)
const uploading = ref(false)

// 打开上传对话框
const openUploadDialog = (resume: ResumeData) => {
  currentResume.value = resume
  selectedVideoFile.value = null
  uploadDialogVisible.value = true
}

// 处理视频文件选择
const handleVideoChange = (file: any) => {
  selectedVideoFile.value = file.raw
}

// 提交视频
const submitVideo = async () => {
  if (!selectedVideoFile.value || !currentResume.value) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('video_file', selectedVideoFile.value)
    formData.append('candidate_name', currentResume.value.candidate_name || '未知')
    formData.append(
      'position_applied', 
      currentResume.value.position_title || selectedPosition.value?.position || ''
    )
    formData.append('resume_data_id', currentResume.value.id)

    await videoApi.uploadVideo(formData)

    ElMessage.success('视频已提交分析')
    uploadDialogVisible.value = false

    // 刷新数据
    loadPositionsList()
  } catch (err) {
    console.error('提交视频失败:', err)
    ElMessage.error('提交视频失败')
  } finally {
    uploading.value = false
  }
}

// 查看视频分析结果
const viewVideoResult = (resume: ResumeData) => {
  if (resume.video_analysis?.id) {
    router.push(`/video/${resume.video_analysis.id}`)
  }
}

// ========== 简历详情 ==========
const resumeDetailVisible = ref(false)
const selectedResumeDetail = ref<ResumeData | null>(null)

const showResumeDetail = (resume: ResumeData) => {
  selectedResumeDetail.value = resume
  resumeDetailVisible.value = true
}

// ========== 生命周期 ==========
onMounted(() => {
  loadPositionsList()
})
</script>

<style scoped lang="scss">
.video-view {
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
