/**
 * 简历分配 composable
 * 处理简历添加到岗位的相关操作
 */
import { ref, computed, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { positionApi, screeningApi } from '@/api'
import type { ResumeData, ProcessingTask, ResumeScreeningTask, PositionData } from '@/types'
import { useScreeningUtils } from './useScreeningUtils'

export function useResumeAssignment(
  selectedPositionId: Ref<string | null>,
  positionsList: Ref<PositionData[]>,
  onAssignSuccess?: () => void
) {
  const { getHistoryTaskName } = useScreeningUtils()

  // 对话框状态
  const createGroupDialogVisible = ref(false)
  const addToGroupDialogVisible = ref(false)

  // 数据状态
  const availableResumes = ref<ResumeData[]>([])
  const resumesLoading = ref(false)
  const creatingGroup = ref(false)
  const currentTaskForGroup = ref<ProcessingTask | null>(null)

  // 计算所有已分配到任何岗位的简历ID
  const assignedResumeIds = computed(() => {
    const ids: string[] = []
    for (const pos of positionsList.value) {
      if (pos.resumes) {
        for (const resume of pos.resumes) {
          if (resume.id && !ids.includes(resume.id)) {
            ids.push(resume.id)
          }
        }
      }
    }
    return ids
  })

  // 加载可用简历
  const loadAvailableResumes = async () => {
    resumesLoading.value = true
    try {
      availableResumes.value = await screeningApi.getAvailableResumes()
    } catch (err) {
      console.error('加载可用简历失败:', err)
      ElMessage.error('加载简历列表失败')
    } finally {
      resumesLoading.value = false
    }
  }

  // 显示添加对话框
  const showCreateGroupDialog = async () => {
    createGroupDialogVisible.value = true
    await loadAvailableResumes()
  }

  // 关闭对话框时清理
  const handleCreateDialogClose = () => {
    availableResumes.value = []
  }

  // 添加简历到岗位
  const assignResumesToPosition = async (resumeIds: string[]) => {
    if (resumeIds.length === 0 || !selectedPositionId.value) return
    
    creatingGroup.value = true
    try {
      const result = await positionApi.assignResumes(selectedPositionId.value, resumeIds)
      ElMessage.success(`成功添加 ${result.assigned_count} 份简历到岗位`)
      createGroupDialogVisible.value = false
      onAssignSuccess?.()
    } catch (err) {
      console.error('添加简历失败:', err)
      ElMessage.error('添加简历失败')
    } finally {
      creatingGroup.value = false
    }
  }

  // 显示添加到组对话框（从处理队列）
  const showAddToGroupDialog = (task: ProcessingTask) => {
    currentTaskForGroup.value = task
    addToGroupDialogVisible.value = true
  }

  // 显示添加到组对话框（从历史任务）
  const showAddToGroupDialogFromHistory = (task: ResumeScreeningTask) => {
    const resumeDataId = (task.resume_data?.[0] as any)?.id || task.reports?.[0]?.report_id
    if (resumeDataId) {
      currentTaskForGroup.value = {
        name: getHistoryTaskName(task),
        task_id: task.task_id,
        status: task.status,
        progress: task.progress,
        created_at: task.created_at,
        report_id: resumeDataId,
        reports: task.reports,
        resume_data: task.resume_data
      }
      addToGroupDialogVisible.value = true
    } else {
      ElMessage.warning('无法获取简历数据ID')
    }
  }

  // 添加到组
  const addToGroup = async (groupId: string) => {
    if (!currentTaskForGroup.value?.report_id) return
    try {
      await positionApi.assignResumes(groupId, [currentTaskForGroup.value.report_id])
      ElMessage.success('添加成功')
      addToGroupDialogVisible.value = false
      onAssignSuccess?.()
    } catch (err) {
      ElMessage.error('添加失败')
    }
  }

  return {
    createGroupDialogVisible,
    addToGroupDialogVisible,
    availableResumes,
    assignedResumeIds,
    resumesLoading,
    creatingGroup,
    currentTaskForGroup,
    showCreateGroupDialog,
    handleCreateDialogClose,
    assignResumesToPosition,
    showAddToGroupDialog,
    showAddToGroupDialogFromHistory,
    addToGroup
  }
}
