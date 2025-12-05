/**
 * 视频上传 composable
 * 处理视频上传、提交和状态管理
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { videoApi } from '@/api'
import type { ResumeData, PositionData } from '@/types'

export function useVideoUpload(
  positionData: { value: PositionData | null },
  onUploadSuccess?: () => void
) {
  // 状态
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

  // 关闭上传对话框
  const closeUploadDialog = () => {
    uploadDialogVisible.value = false
    currentResume.value = null
    selectedVideoFile.value = null
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
        currentResume.value.position_title || positionData.value?.position || ''
      )
      formData.append('resume_data_id', currentResume.value.id)

      await videoApi.uploadVideo(formData)

      ElMessage.success('视频已提交分析')
      closeUploadDialog()
      
      // 回调刷新数据
      onUploadSuccess?.()
    } catch (err) {
      console.error('提交视频失败:', err)
      ElMessage.error('提交视频失败')
    } finally {
      uploading.value = false
    }
  }

  return {
    uploadDialogVisible,
    currentResume,
    selectedVideoFile,
    uploading,
    openUploadDialog,
    closeUploadDialog,
    handleVideoChange,
    submitVideo
  }
}
