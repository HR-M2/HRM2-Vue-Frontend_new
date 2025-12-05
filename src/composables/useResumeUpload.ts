/**
 * 简历上传 composable
 * 处理简历文件上传和提交
 */
import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { screeningApi } from '@/api'
import type { PositionData, ResumeFile, ProcessingTask } from '@/types'

export function useResumeUpload(
  positionData: Ref<PositionData>,
  onSubmitSuccess?: (task: ProcessingTask) => void
) {
  const isSubmitting = ref(false)
  const currentFiles = ref<ResumeFile[]>([])

  // 文件变化处理
  const handleFilesChanged = (files: ResumeFile[]) => {
    currentFiles.value = files
  }

  // 提交文件
  const submitFiles = async (clearCallback?: () => void) => {
    const parsedFiles = currentFiles.value.filter(f => f.status === 'parsed')
    if (parsedFiles.length === 0) {
      ElMessage.warning('没有已解析的文件可提交')
      return
    }

    isSubmitting.value = true
    let successCount = 0
    
    try {
      for (const file of parsedFiles) {
        try {
          const uploadData = {
            position: positionData.value,
            resumes: [{
              name: file.name,
              content: file.content || '',
              metadata: {
                size: file.file.size,
                type: file.file.type || 'text/plain'
              }
            }]
          }

          const result = await screeningApi.submitScreening(uploadData as any)
          
          const task: ProcessingTask = {
            name: file.name,
            task_id: result.task_id,
            status: 'pending',
            progress: 0,
            created_at: new Date().toISOString(),
            applied_position: positionData.value.position
          }
          
          onSubmitSuccess?.(task)
          successCount++
        } catch (err) {
          console.error(`提交 ${file.name} 失败:`, err)
          ElMessage.error(`${file.name} 提交失败`)
        }
      }

      if (successCount > 0) {
        clearCallback?.()
        ElMessage.success(`成功提交 ${successCount} 份简历进行初筛`)
      }
    } catch (err) {
      console.error('提交失败:', err)
      ElMessage.error('提交失败')
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    currentFiles,
    handleFilesChanged,
    submitFiles
  }
}
