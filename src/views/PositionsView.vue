<template>
  <div class="positions-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">招聘岗位管理</h1>
        <p class="page-desc">配置多个招聘岗位的基本要求和筛选标准</p>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-grid">
      <!-- 左侧：岗位列表 -->
      <PositionListPanel
        :positions="positions"
        :selected-position-id="selectedPositionId"
        :loading="loading"
        @select="handleSelectPosition"
        @delete="handleDeletePosition"
        @create="showCreateDialog"
      />

      <!-- 右侧：岗位详情编辑 -->
      <PositionEditForm
        ref="editFormRef"
        :form-data="formData"
        :selected-position-id="selectedPositionId"
        :has-changes="hasChanges"
        :saving="saving"
        @save="handleSave"
      />
    </div>

    <!-- 创建岗位对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建岗位" width="500px">
      <el-form :model="newPositionForm" label-width="80px">
        <el-form-item label="岗位名称" required>
          <el-input v-model="newPositionForm.position" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="岗位描述">
          <el-input v-model="newPositionForm.description" type="textarea" :rows="3" placeholder="请输入岗位描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreatePosition">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

// 组件导入
import { PositionListPanel, PositionEditForm } from '@/components/positions'

// Composables
import { usePositionEditor } from '@/composables/usePositionEditor'

// 类型
import type { PositionData } from '@/types'

// ========== 岗位编辑逻辑 ==========
const {
  loading,
  saving,
  positions,
  selectedPositionId,
  formData,
  hasChanges,
  loadPositions,
  selectPosition,
  createPosition,
  deletePosition,
  savePosition
} = usePositionEditor()

const editFormRef = ref<InstanceType<typeof PositionEditForm>>()

// ========== 创建岗位对话框 ==========
const createDialogVisible = ref(false)
const creating = ref(false)
const newPositionForm = reactive({
  position: '',
  description: ''
})

const showCreateDialog = () => {
  newPositionForm.position = ''
  newPositionForm.description = ''
  createDialogVisible.value = true
}

const handleCreatePosition = async () => {
  creating.value = true
  try {
    const result = await createPosition(newPositionForm.position, newPositionForm.description)
    if (result) {
      createDialogVisible.value = false
    }
  } finally {
    creating.value = false
  }
}

// ========== 事件处理 ==========
const handleSelectPosition = (pos: PositionData) => {
  selectPosition(pos)
}

const handleDeletePosition = (pos: PositionData) => {
  deletePosition(pos)
}

const handleSave = async () => {
  // 先验证表单
  if (editFormRef.value) {
    try {
      await editFormRef.value.validate()
    } catch {
      return
    }
  }
  savePosition()
}

// ========== 生命周期 ==========
onMounted(() => {
  loadPositions()
})
</script>

<style scoped lang="scss">
.positions-view {
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

@media (max-width: 1000px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
