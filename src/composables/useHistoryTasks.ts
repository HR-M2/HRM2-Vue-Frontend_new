/**
 * 历史任务 composable
 * 处理历史任务的加载、筛选、删除等操作
 */
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { screeningApi } from '@/api'
import type { ResumeScreeningTask } from '@/types'

export function useHistoryTasks() {
  const historyTasks = ref<ResumeScreeningTask[]>([])
  const historyParams = reactive({ status: 'completed', page: 1, page_size: 10 })
  const historyTotal = ref(0)
  const historyLoading = ref(false)

  // 加载历史任务
  const loadHistoryTasks = async () => {
    historyLoading.value = true
    try {
      const result = await screeningApi.getTaskHistory(historyParams)
      historyTasks.value = result.tasks || []
      historyTotal.value = result.total || 0
    } catch (err) {
      console.error('加载历史任务失败:', err)
    } finally {
      historyLoading.value = false
    }
  }

  // 按状态筛选
  const filterByStatus = (status: string) => {
    historyParams.status = status
    historyParams.page = 1
    loadHistoryTasks()
  }

  // 删除历史任务
  const deleteHistoryTask = async (taskId: string) => {
    try {
      await ElMessageBox.confirm('确定要删除这条初筛记录吗？删除后无法恢复。', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      await screeningApi.deleteTask(taskId)
      ElMessage.success('删除成功')
      loadHistoryTasks()
    } catch (err: any) {
      if (err !== 'cancel') {
        console.error('删除失败:', err)
        ElMessage.error('删除失败')
      }
    }
  }

  return {
    historyTasks,
    historyParams,
    historyTotal,
    historyLoading,
    loadHistoryTasks,
    filterByStatus,
    deleteHistoryTask
  }
}
