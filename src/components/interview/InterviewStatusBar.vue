<template>
  <div class="status-bar">
    <div class="status-left">
      <el-tag type="danger" effect="dark" class="live-tag">
        <span class="live-dot"></span>
        LIVE
      </el-tag>
      <span class="status-text">实时面试进行中</span>
    </div>
    <div class="status-right">
      <div class="stat-item">
        <el-icon><QuestionFilled /></el-icon>
        <span>{{ totalQuestions }} 问题</span>
      </div>
      <div class="stat-item">
        <el-icon><ChatLineRound /></el-icon>
        <span>{{ totalFollowups }} 追问</span>
      </div>
      <div class="stat-item">
        <el-icon><Timer /></el-icon>
        <span>{{ formatDuration }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionFilled, ChatLineRound, Timer } from '@element-plus/icons-vue'

const props = defineProps<{
  totalQuestions: number
  totalFollowups: number
  startTime: Date | null
}>()

const formatDuration = computed(() => {
  if (!props.startTime) return '00:00'
  const seconds = Math.floor((Date.now() - props.startTime.getTime()) / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})
</script>

<style scoped lang="scss">
@use './styles/interview-common' as common;

.status-bar {
  @include common.status-bar;
  
  .status-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .live-tag {
      .live-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        margin-right: 6px;
        animation: pulse 1s infinite;
      }
    }
    
    .status-text {
      font-weight: 500;
      color: common.$text-secondary;
    }
  }
  
  .status-right {
    display: flex;
    gap: 24px;
    
    .stat-item {
      @include common.stat-item;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
