<template>
  <el-card class="upload-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">简历上传与初筛</span>
        <el-tag :type="uploadStatus.type" effect="plain">{{ uploadStatus.text }}</el-tag>
      </div>
    </template>

    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @drop="handleDrop"
      @dragover="handleDragover"
      @dragleave="handleDragleave"
    >
      <div class="upload-content">
        <el-icon :size="48" color="#c0c4cc"><Upload /></el-icon>
        <div class="upload-text">
          <p>将简历文件拖拽到此处，或</p>
          <el-button type="primary" @click="triggerFileInput">点击选择文件</el-button>
        </div>
        <p class="upload-hint">支持 PDF、DOC、DOCX、TXT 格式，单个文件不超过10MB</p>
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        style="display: none"
        @change="handleFileSelect"
      />
    </div>

    <!-- 文件列表 -->
    <div v-if="selectedFiles.length > 0" class="file-list">
      <div class="file-list-header">
        <h4>已选文件 ({{ selectedFiles.length }})</h4>
      </div>
      <div class="file-items">
        <div v-for="(file, index) in selectedFiles" :key="file.id" class="file-item">
          <div class="file-info">
            <el-icon :size="20" color="#409eff"><Document /></el-icon>
            <div class="file-details">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <el-button v-if="file.status === 'parsing'" size="small" :loading="true" type="info">
              解析中
            </el-button>
            <el-button v-else-if="file.status === 'parsed'" size="small" type="success" @click="$emit('preview', file)">
              预览
            </el-button>
            <el-button v-else size="small" type="danger" @click="removeFile(index)">
              移除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          :loading="isSubmitting"
          :disabled="!hasParsedFiles"
          @click="$emit('submit')"
        >
          {{ isSubmitting ? '提交中...' : `提交 ${parsedFilesCount} 份简历进行初筛` }}
        </el-button>
        <el-button @click="clearAll">清空列表</el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Upload, Document } from '@element-plus/icons-vue'
import { useFileParser } from '@/composables/useFileParser'
import { useScreeningUtils } from '@/composables/useScreeningUtils'

const props = defineProps<{
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  submit: []
  preview: [file: any]
  filesChanged: [files: any[]]
}>()

const { formatFileSize } = useScreeningUtils()
const { 
  selectedFiles, 
  isDragOver, 
  hasParsedFiles, 
  parsedFilesCount,
  processFiles,
  removeFile,
  clearAll,
  handleDragover,
  handleDragleave,
  handleDrop
} = useFileParser()

// 文件输入引用
const fileInput = ref<HTMLInputElement>()

// 上传状态
const uploadStatus = reactive({ type: 'info' as 'info' | 'success' | 'warning' | 'danger', text: '等待上传' })

// 监听文件变化
watch(selectedFiles, (files) => {
  emit('filesChanged', files)
  updateUploadStatus()
}, { deep: true })

// 更新上传状态
const updateUploadStatus = () => {
  const total = selectedFiles.value.length
  const parsed = parsedFilesCount.value
  if (total === 0) {
    uploadStatus.type = 'info'
    uploadStatus.text = '等待上传'
  } else if (parsed === total) {
    uploadStatus.type = 'success'
    uploadStatus.text = `${parsed} 份已就绪`
  } else {
    uploadStatus.type = 'warning'
    uploadStatus.text = `${parsed}/${total} 已解析`
  }
}

// 触发文件选择
const triggerFileInput = () => fileInput.value?.click()

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
    target.value = ''
  }
}

// 暴露方法给父组件
defineExpose({
  selectedFiles,
  hasParsedFiles,
  parsedFilesCount,
  clearAll
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.2s;

  &:hover,
  &.drag-over {
    border-color: #409eff;
    background: #ecf5ff;
  }
}

.upload-content {
  .upload-text {
    margin: 16px 0;

    p {
      margin: 0 0 8px 0;
      color: #606266;
    }
  }

  .upload-hint {
    margin: 0;
    font-size: 12px;
    color: #909399;
  }
}

.file-list {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.file-list-header h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 6px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-details {
  .file-name {
    display: block;
    font-size: 13px;
    color: #303133;
  }

  .file-size {
    display: block;
    font-size: 12px;
    color: #909399;
  }
}

.action-buttons {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
</style>
