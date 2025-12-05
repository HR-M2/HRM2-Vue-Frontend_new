<template>
  <div class="screening-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">简历初筛系统</h1>
        <p class="page-desc">上传候选人简历，系统将自动进行初步筛选和匹配度分析</p>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <PositionList
          :positions="positionsList"
          :selected-position-id="selectedPositionId"
          @select="selectPosition"
          @assign="showAssignDialog"
          @show-resume-detail="showResumeDetail"
          @remove-resume="removeResumeFromPosition"
        />
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 文件上传区域 -->
        <ResumeUpload
          ref="resumeUploadRef"
          :is-submitting="isSubmitting"
          :position-name="positionData.position"
          @submit="submitFiles"
          @preview="previewFile"
          @files-changed="handleFilesChanged"
        />

        <!-- 处理队列 -->
        <ProcessingQueue
          :queue="processingQueue"
          @show-detail="showQueueItemDetail"
          @download-report="downloadReport"
          @add-to-group="showAddToGroupDialog"
        />

        <!-- 历史任务 -->
        <TaskHistory
          :tasks="historyTasks"
          :total="historyTotal"
          :loading="historyLoading"
          :current-status="historyParams.status"
          v-model:current-page="historyParams.page"
          v-model:page-size="historyParams.page_size"
          @refresh="loadHistoryTasks"
          @filter-by-status="filterByStatus"
          @show-detail="showHistoryTaskDetail"
          @download-report="downloadReport"
          @add-to-group="showAddToGroupDialogFromHistory"
          @delete="deleteHistoryTask"
          @page-change="loadHistoryTasks"
        />
      </div>
    </div>

    <!-- 添加简历到岗位对话框 -->
    <AssignResumeDialog
      v-model="createGroupDialogVisible"
      :selected-position-id="selectedPositionId"
      :position-name="positionData.position"
      :available-resumes="availableResumes"
      :assigned-resume-ids="assignedResumeIds"
      :loading="resumesLoading"
      :submitting="creatingGroup"
      @assign="assignResumesToPosition"
      @close="handleCreateDialogClose"
    />

    <!-- 添加到岗位对话框 -->
    <AddToGroupDialog
      v-model="addToGroupDialogVisible"
      :positions="positionsList"
      @confirm="addToGroup"
    />

    <!-- 简历预览对话框 -->
    <PreviewDialog
      v-model="previewDialogVisible"
      :file="previewFileData"
    />

    <!-- 简历详情对话框 -->
    <ResumeDetailDialog
      v-model="resumeDetailVisible"
      :resume="selectedResumeDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 组件导入
import { PositionList } from '@/components/common'
import {
  ResumeUpload,
  ProcessingQueue,
  TaskHistory,
  AssignResumeDialog,
  AddToGroupDialog,
  PreviewDialog,
  ResumeDetailDialog
} from '@/components/screening'

// Composables 导入
import { usePositionManagement } from '@/composables/usePositionManagement'
import { useTaskPolling } from '@/composables/useTaskPolling'
import { useHistoryTasks } from '@/composables/useHistoryTasks'
import { useResumeUpload } from '@/composables/useResumeUpload'
import { useResumeAssignment } from '@/composables/useResumeAssignment'
import { useResumeDetail } from '@/composables/useResumeDetail'

// 类型导入
import type { PositionData } from '@/types'

// ==================== Composables 初始化 ====================

// 岗位管理
const {
  positionData,
  positionsList,
  selectedPositionId,
  loadPositionsList,
  selectPosition,
  removeResumeFromPosition
} = usePositionManagement()

// 历史任务（需要先初始化，供其他 composable 引用）
const {
  historyTasks,
  historyParams,
  historyTotal,
  historyLoading,
  loadHistoryTasks,
  filterByStatus,
  deleteHistoryTask
} = useHistoryTasks()

// 任务轮询（完成时刷新历史任务）
const {
  processingQueue,
  addToQueue
} = useTaskPolling(loadHistoryTasks)

// 简历上传组件引用
const resumeUploadRef = ref<InstanceType<typeof ResumeUpload>>()

// 简历上传（提交成功时添加到队列）
const {
  isSubmitting,
  handleFilesChanged,
  submitFiles: doSubmitFiles
} = useResumeUpload(positionData, addToQueue)

// 包装 submitFiles 以便传入清除回调
const submitFiles = () => doSubmitFiles(() => resumeUploadRef.value?.clearAll())

// 简历详情和预览
const {
  previewDialogVisible,
  resumeDetailVisible,
  previewFileData,
  selectedResumeDetail,
  previewFile,
  showResumeDetail,
  showQueueItemDetail,
  showHistoryTaskDetail,
  downloadReport
} = useResumeDetail()

// 简历添加（添加成功时刷新岗位列表）
const {
  createGroupDialogVisible,
  addToGroupDialogVisible,
  availableResumes,
  assignedResumeIds,
  resumesLoading,
  creatingGroup,
  showCreateGroupDialog,
  handleCreateDialogClose,
  assignResumesToPosition,
  showAddToGroupDialog,
  showAddToGroupDialogFromHistory,
  addToGroup
} = useResumeAssignment(selectedPositionId, positionsList, loadPositionsList)

// ==================== 事件处理 ====================

// 显示添加对话框（从岗位列表触发）
const showAssignDialog = (pos: PositionData) => {
  selectPosition(pos)  // 同时更新 selectedPositionId 和 positionData
  showCreateGroupDialog()
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadPositionsList()
  loadHistoryTasks()
})
</script>

<style scoped lang="scss">
.screening-view {
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

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .left-panel {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .left-panel {
    grid-template-columns: 1fr;
  }
}
</style>
