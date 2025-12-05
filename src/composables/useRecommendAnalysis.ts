/**
 * 录用推荐分析任务 composable
 */
import { ref, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { recommendApi } from '@/api'
import type { InterviewEvaluationTask } from '@/types'

export function useRecommendAnalysis() {
  const analysisTask = ref<InterviewEvaluationTask | null>(null)
  const isLoading = ref(false)
  const pollingTimer = ref<number | null>(null)

  // 计算属性
  const isRunning = computed(() => {
    return analysisTask.value?.status === 'pending' || analysisTask.value?.status === 'processing'
  })

  const progress = computed(() => {
    return analysisTask.value?.progress || 0
  })

  // 检查现有任务
  const checkExistingTask = async (positionId: string) => {
    try {
      const existingTask = await recommendApi.getEvaluationByGroup(positionId)
      if (existingTask) {
        analysisTask.value = existingTask
        if (isRunning.value) {
          startPolling()
        }
      }
    } catch (err) {
      console.error('检查任务失败:', err)
    }
  }

  // 开始分析
  const startAnalysis = async (positionId: string, onComplete?: () => void) => {
    if (!positionId) return

    isLoading.value = true
    try {
      const task = await recommendApi.createEvaluation(positionId)
      analysisTask.value = task
      startPolling(onComplete)
      ElMessage.success('分析任务已启动')
    } catch (err) {
      console.error('启动分析失败:', err)
      ElMessage.error('启动分析失败')
    } finally {
      isLoading.value = false
    }
  }

  // 停止分析
  const stopAnalysis = async () => {
    if (!analysisTask.value?.task_id) return

    try {
      await recommendApi.stopEvaluation(analysisTask.value.task_id)
      stopPolling()
      analysisTask.value = null
      ElMessage.success('分析已停止')
    } catch (err) {
      ElMessage.error('停止分析失败')
    }
  }

  // 轮询任务状态
  const startPolling = (onComplete?: () => void) => {
    if (pollingTimer.value) return
    
    const poll = async () => {
      if (!analysisTask.value?.task_id) {
        stopPolling()
        return
      }

      try {
        const status = await recommendApi.getEvaluationStatus(analysisTask.value.task_id)
        analysisTask.value = status

        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling()
          if (status.status === 'completed') {
            ElMessage.success('综合分析已完成')
            onComplete?.()
          }
        }
      } catch (err) {
        console.error('获取任务状态失败:', err)
      }
    }

    pollingTimer.value = window.setInterval(poll, 3000)
  }

  const stopPolling = () => {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
    }
  }

  // 下载报告
  const downloadReport = async (filePath: string) => {
    try {
      const blob = await recommendApi.downloadReport(filePath)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'evaluation_report.md'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      ElMessage.error('下载报告失败')
    }
  }

  // 重置
  const reset = () => {
    stopPolling()
    analysisTask.value = null
  }

  // 获取进度条状态
  const getProgressStatus = () => {
    if (!analysisTask.value) return ''
    if (analysisTask.value.status === 'completed') return 'success'
    if (analysisTask.value.status === 'failed') return 'exception'
    return ''
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '等待中',
      processing: '分析中',
      completed: '已完成',
      failed: '失败'
    }
    return texts[status] || status
  }

  // 清理
  onUnmounted(() => {
    stopPolling()
  })

  return {
    analysisTask,
    isLoading,
    isRunning,
    progress,
    checkExistingTask,
    startAnalysis,
    stopAnalysis,
    downloadReport,
    reset,
    getProgressStatus,
    getStatusText
  }
}
