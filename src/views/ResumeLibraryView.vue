<template>
  <div class="resume-library-view">
    <!-- 页面标题和操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">简历库</h2>
        <span class="resume-count">共 {{ total }} 份简历</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="uploadDialogVisible = true">
          <el-icon><Upload /></el-icon>
          上传简历
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索文件名或候选人姓名"
          clearable
          style="width: 300px"
          @keyup.enter="search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="filters.isScreened"
          placeholder="筛选状态"
          clearable
          style="width: 140px"
        >
          <el-option label="已筛选" :value="true" />
          <el-option label="未筛选" :value="false" />
        </el-select>
        
        <el-select
          v-model="filters.isAssigned"
          placeholder="分配状态"
          clearable
          style="width: 140px"
        >
          <el-option label="已分配" :value="true" />
          <el-option label="未分配" :value="false" />
        </el-select>
        
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
        
        <div class="filter-spacer"></div>
        
        <el-button
          type="danger"
          :disabled="!hasSelection"
          @click="batchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </el-card>

    <!-- 简历列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        :data="resumes"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        
        <el-table-column prop="filename" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="filename-cell">
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="filename">{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="candidate_name" label="候选人" width="120">
          <template #default="{ row }">
            <span v-if="row.candidate_name">{{ row.candidate_name }}</span>
            <span v-else class="text-muted">未识别</span>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="180">
          <template #default="{ row }">
            <div class="status-tags">
              <el-tag
                :type="row.is_screened ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ row.is_screened ? '已筛选' : '未筛选' }}
              </el-tag>
              <el-tag
                :type="row.is_assigned ? 'primary' : 'info'"
                size="small"
                effect="light"
              >
                {{ row.is_assigned ? '已分配' : '未分配' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="标识" width="100">
          <template #default="{ row }">
            <span class="hash-value">{{ row.file_hash_short }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="file_size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" link @click="downloadResume(row)">
              下载
            </el-button>
            <el-button size="small" type="primary" link @click="openDetail(row, 'view')">
              查看
            </el-button>
            <el-button size="small" type="primary" link @click="openDetail(row, 'edit')">
              编辑
            </el-button>
            <el-button size="small" type="danger" link @click="deleteResume(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <ResumeUploadDialog
      v-model="uploadDialogVisible"
      :uploading="uploading"
      @upload="handleUpload"
    />

    <!-- 查看/编辑对话框 -->
    <ResumeDetailDialog
      v-model="detailDialogVisible"
      :resume="currentResume"
      :saving="saving"
      :mode="detailMode"
      @save="handleSaveEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Upload, Search, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useResumeLibrary } from '@/composables/useResumeLibrary'
import { libraryApi, type LibraryResume } from '@/api'
import { ResumeUploadDialog, ResumeDetailDialog } from '@/components/library'

const {
  loading,
  uploading,
  resumes,
  total,
  currentPage,
  pageSize,
  keyword,
  selectedIds,
  filters,
  hasSelection,
  loadResumes,
  uploadResumes,
  deleteResume,
  batchDelete,
  updateResume,
  search,
  resetFilters,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange
} = useResumeLibrary()

// 上传对话框
const uploadDialogVisible = ref(false)

// 详情对话框
const detailDialogVisible = ref(false)
const currentResume = ref<LibraryResume | null>(null)
const detailMode = ref<'view' | 'edit'>('view')
const saving = ref(false)

// 处理上传
const handleUpload = async (files: Array<{ name: string; content: string; metadata?: { size?: number; type?: string } }>) => {
  try {
    await uploadResumes(files)
    uploadDialogVisible.value = false
  } catch (error) {
    // 错误已在 composable 中处理
  }
}

// 打开详情对话框
const openDetail = async (resume: LibraryResume, mode: 'view' | 'edit') => {
  try {
    const detail = await libraryApi.getDetail(resume.id)
    currentResume.value = detail
    detailMode.value = mode
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取简历详情失败')
  }
}

// 保存编辑
const handleSaveEdit = async (data: { candidate_name?: string; notes?: string }) => {
  if (!currentResume.value) return
  
  saving.value = true
  try {
    await updateResume(currentResume.value.id, data)
    detailDialogVisible.value = false
  } catch (error) {
    // 错误已在 composable 中处理
  } finally {
    saving.value = false
  }
}

// 下载简历
const downloadResume = (resume: LibraryResume) => {
  if (!resume.content && !resume.content_preview) {
    ElMessage.warning('简历内容为空，无法下载')
    return
  }
  
  const content = resume.content || resume.content_preview || ''
  const ext = resume.filename.split('.').pop()?.toLowerCase() || 'txt'
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const downloadName = (ext === 'txt' || ext === 'md') 
    ? resume.filename 
    : resume.filename.replace(/\.[^.]+$/, '.txt')
  link.download = downloadName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('下载成功')
}

// 格式化函数
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadResumes()
})
</script>

<style scoped lang="scss">
.resume-library-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
  
  .resume-count {
    font-size: 14px;
    color: #909399;
  }
}

.filter-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  
  .filter-spacer {
    flex: 1;
  }
}

.list-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.filename-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .file-icon {
    color: #409eff;
    font-size: 16px;
  }
  
  .filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.status-tags {
  display: flex;
  gap: 6px;
}

.hash-value {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
}
</style>
