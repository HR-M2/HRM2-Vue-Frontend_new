<template>
  <el-dialog v-model="visible" title="简历详情" width="70%">
    <div v-if="resume" class="resume-detail-dialog">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h4>候选人信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">姓名:</span>
            <span class="value">{{ resume.candidate_name || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">岗位:</span>
            <span class="value">{{ resume.position_title || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 初筛评分 -->
      <div v-if="resume.screening_score" class="detail-section">
        <h4>初筛评分</h4>
        <div class="scores-grid">
          <div class="score-item">
            <span class="score-label">综合评分</span>
            <span class="score-value primary">{{ resume.screening_score.comprehensive_score }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">HR评分</span>
            <span class="score-value">{{ resume.screening_score.hr_score || '-' }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">技术评分</span>
            <span class="score-value">{{ resume.screening_score.technical_score || '-' }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">管理评分</span>
            <span class="score-value">{{ resume.screening_score.manager_score || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 初筛评价 -->
      <div v-if="resume.screening_summary" class="detail-section">
        <h4>初筛评价</h4>
        <div class="markdown-content" v-html="renderMarkdown(resume.screening_summary)"></div>
      </div>

      <!-- 简历原文 -->
      <div class="detail-section">
        <h4>简历内容</h4>
        <div 
          v-if="resume.resume_content" 
          class="markdown-content resume-content" 
          v-html="renderMarkdown(resume.resume_content, true)"
        ></div>
        <div v-else class="no-content">暂无简历内容</div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useScreeningUtils } from '@/composables/useScreeningUtils'
import type { ResumeData } from '@/types'

const props = defineProps<{
  modelValue: boolean
  resume: ResumeData | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { renderMarkdown } = useScreeningUtils()

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})
</script>

<style scoped lang="scss">
.resume-detail-dialog {
  .detail-section {
    margin-bottom: 24px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      border-left: 3px solid #409eff;
      padding-left: 10px;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    
    .info-item {
      .label {
        color: #909399;
        margin-right: 8px;
      }
      .value {
        color: #303133;
        font-weight: 500;
      }
    }
  }
  
  .scores-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    
    .score-item {
      text-align: center;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 8px;
      
      .score-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }
      
      .score-value {
        display: block;
        font-size: 20px;
        font-weight: 600;
        color: #67c23a;
        
        &.primary {
          font-size: 24px;
          color: #409eff;
        }
      }
    }
  }
  
  .markdown-content {
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.8;
    color: #303133;
    
    :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
      margin: 12px 0 8px 0;
      font-weight: 600;
      color: #303133;
    }
    
    :deep(h1) { font-size: 18px; }
    :deep(h2) { font-size: 16px; }
    :deep(h3) { font-size: 15px; }
    :deep(h4) { font-size: 14px; }
    
    :deep(p) {
      margin: 8px 0;
    }
    
    :deep(ul), :deep(ol) {
      padding-left: 20px;
      margin: 8px 0;
    }
    
    :deep(li) {
      margin: 4px 0;
    }
    
    :deep(strong) {
      font-weight: 600;
      color: #303133;
    }
    
    :deep(code) {
      background: #e8e8e8;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    
    :deep(pre) {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }
    
    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      
      th, td {
        border: 1px solid #e4e7ed;
        padding: 8px 12px;
        text-align: left;
      }
      
      th {
        background: #f5f7fa;
        font-weight: 600;
      }
    }
    
    &.resume-content {
      max-height: 400px;
      overflow-y: auto;
    }
  }
  
  .no-content {
    padding: 20px;
    text-align: center;
    color: #909399;
    background: #fafafa;
    border-radius: 6px;
  }
}
</style>
