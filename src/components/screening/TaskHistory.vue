<template>
  <el-card class="history-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">初筛任务历史</span>
        <el-button type="primary" size="small" :loading="loading" @click="$emit('refresh')">
          刷新
        </el-button>
      </div>
    </template>

    <!-- 状态筛选 -->
    <div class="status-filter">
      <el-button
        v-for="status in statusFilters"
        :key="status.value"
        :type="currentStatus === status.value ? status.btnType : 'default'"
        size="small"
        @click="$emit('filterByStatus', status.value)"
      >
        {{ status.label }}
      </el-button>
    </div>

    <div v-if="tasks.length === 0" class="empty-history">
      <el-empty description="暂无历史记录" :image-size="60" />
    </div>
    <div v-else class="history-list">
      <div
        v-for="task in tasks"
        :key="task.task_id"
        class="history-item clickable"
        :class="`status-${task.status}`"
        @click="$emit('showDetail', task)"
      >
        <div class="history-info">
          <div class="history-name">
            {{ getHistoryTaskName(task) }}
          </div>
          <div class="history-meta">
            <el-tag :type="getStatusType(task.status)" size="small">
              {{ getStatusText(task.status) }}
            </el-tag>
            <span v-if="task.status === 'running'">进度: {{ task.progress }}%</span>
            <span class="history-time">{{ formatDate(task.created_at) }}</span>
          </div>
          <!-- 评分显示 -->
          <div v-if="task.status === 'completed' && getHistoryTaskScore(task)" class="history-scores">
            <el-tag type="success" size="small" effect="plain">
              综合: {{ getHistoryTaskScore(task)?.comprehensive_score }}
            </el-tag>
            <el-tag type="info" size="small" effect="plain">
              HR: {{ getHistoryTaskScore(task)?.hr_score }}
            </el-tag>
            <el-tag type="warning" size="small" effect="plain">
              技术: {{ getHistoryTaskScore(task)?.technical_score }}
            </el-tag>
          </div>
        </div>
        <div class="history-actions">
          <el-button
            v-if="task.status === 'completed' && task.reports?.length"
            size="small"
            type="success"
            @click.stop="$emit('downloadReport', task.reports![0]!.report_id)"
          >
            下载
          </el-button>
          <el-button
            v-if="task.status === 'completed'"
            size="small"
            type="primary"
            @click.stop="$emit('addToGroup', task)"
          >
            加入组
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @update:current-page="(val: number) => emit('update:currentPage', val)"
        @update:page-size="(val: number) => emit('update:pageSize', val)"
        @current-change="handlePageChange"
        @size-change="handlePageChange"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useScreeningUtils } from '@/composables/useScreeningUtils'
import type { ResumeScreeningTask } from '@/types'

const props = defineProps<{
  tasks: ResumeScreeningTask[]
  total: number
  loading: boolean
  currentStatus: string
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  refresh: []
  filterByStatus: [status: string]
  showDetail: [task: ResumeScreeningTask]
  downloadReport: [reportId: string]
  addToGroup: [task: ResumeScreeningTask]
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  pageChange: []
}>()

const { 
  formatDate, 
  getStatusType, 
  getStatusText, 
  getHistoryTaskName, 
  getHistoryTaskScore 
} = useScreeningUtils()

// 状态筛选选项
const statusFilters = [
  { value: 'completed', label: '已完成', btnType: 'success' as const },
  { value: 'running', label: '处理中', btnType: 'warning' as const },
  { value: 'failed', label: '失败', btnType: 'danger' as const },
  { value: 'pending', label: '队列中', btnType: 'info' as const }
]

// 分页变化
const handlePageChange = () => {
  emit('pageChange')
}
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

.status-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.empty-history {
  padding: 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid transparent;
  transition: all 0.2s;

  &.clickable {
    cursor: pointer;
    
    &:hover {
      background: #f0f5ff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }
  }

  &.status-pending { border-left-color: #e6a23c; }
  &.status-running { border-left-color: #409eff; }
  &.status-completed { border-left-color: #67c23a; }
  &.status-failed { border-left-color: #f56c6c; }
}

.history-info {
  .history-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 6px;
  }

  .history-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #909399;
  }

  .history-scores {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .history-time {
    font-size: 12px;
    color: #c0c4cc;
  }
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
