/**
 * 简历详情 composable
 * 处理简历详情查看和报告下载
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { screeningApi } from '@/api'
import type { ResumeData, ResumeFile, ProcessingTask, ResumeScreeningTask } from '@/types'
import { useScreeningUtils } from './useScreeningUtils'

export function useResumeDetail() {
  const { getHistoryTaskName } = useScreeningUtils()

  // 对话框状态
  const previewDialogVisible = ref(false)
  const resumeDetailVisible = ref(false)

  // 数据
  const previewFileData = ref<ResumeFile | null>(null)
  const selectedResumeDetail = ref<ResumeData | null>(null)

  // 预览文件
  const previewFile = (file: ResumeFile) => {
    previewFileData.value = file
    previewDialogVisible.value = true
  }

  // 显示简历详情
  const showResumeDetail = (resume: ResumeData) => {
    selectedResumeDetail.value = resume
    resumeDetailVisible.value = true
  }

  // 显示处理队列项详情
  const showQueueItemDetail = async (item: ProcessingTask) => {
    const resumeDataItem = item.resume_data?.[0]
    
    const resumeData: ResumeData = {
      id: resumeDataItem?.id || item.report_id || item.task_id || '',
      candidate_name: resumeDataItem?.candidate_name || item.name,
      position_title: resumeDataItem?.position_title || item.applied_position || '',
      screening_score: resumeDataItem?.scores,
      screening_summary: resumeDataItem?.summary,
      resume_content: resumeDataItem?.resume_content || item.reports?.[0]?.resume_content,
      created_at: item.created_at
    }
    
    const detailId = resumeDataItem?.id || item.report_id
    if (detailId && item.status === 'completed' && !resumeData.screening_summary) {
      try {
        const detail = await screeningApi.getResumeDetail(detailId)
        if (detail) {
          resumeData.resume_content = detail.resume_content || resumeData.resume_content
          resumeData.screening_summary = detail.screening_summary || resumeData.screening_summary
          resumeData.screening_score = detail.screening_score || resumeData.screening_score
          resumeData.candidate_name = detail.candidate_name || resumeData.candidate_name
        }
      } catch (err) {
        console.warn('获取简历详情失败:', err)
      }
    }
    
    selectedResumeDetail.value = resumeData
    resumeDetailVisible.value = true
  }

  // 显示历史任务详情
  const showHistoryTaskDetail = async (task: ResumeScreeningTask) => {
    const taskResumeData = (task.resume_data as any)?.[0]
    
    if (taskResumeData) {
      const resumeData: ResumeData = {
        id: taskResumeData.id || task.task_id,
        candidate_name: taskResumeData.candidate_name || getHistoryTaskName(task),
        position_title: taskResumeData.position_title || '',
        screening_score: taskResumeData.scores,
        screening_summary: taskResumeData.summary,
        resume_content: taskResumeData.resume_content,
        created_at: task.created_at
      }
      selectedResumeDetail.value = resumeData
      resumeDetailVisible.value = true
      return
    }
    
    const report = task.reports?.[0]
    const resumeData: ResumeData = {
      id: report?.report_id || task.task_id,
      candidate_name: getHistoryTaskName(task),
      position_title: '',
      resume_content: report?.resume_content,
      created_at: task.created_at
    }
    
    selectedResumeDetail.value = resumeData
    resumeDetailVisible.value = true
  }

  // 下载报告
  const downloadReport = async (reportId: string) => {
    try {
      const blob = await screeningApi.downloadReport(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${reportId}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      ElMessage.error('下载报告失败')
    }
  }

  return {
    previewDialogVisible,
    resumeDetailVisible,
    previewFileData,
    selectedResumeDetail,
    previewFile,
    showResumeDetail,
    showQueueItemDetail,
    showHistoryTaskDetail,
    downloadReport
  }
}
