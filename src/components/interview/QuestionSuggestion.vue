<template>
  <div class="question-suggestion" :class="{ 'visible': visible }">
    <!-- 头部 -->
    <div class="suggestion-header">
      <div class="header-title">
        <el-icon class="title-icon"><Promotion /></el-icon>
        <span>智能推荐问题</span>
      </div>
      <div class="header-actions">
        <el-button
          text
          size="small"
          :icon="RefreshRight"
          @click="$emit('refresh')"
          v-if="suggestions.length"
        >
          刷新
        </el-button>
        <el-button
          text
          size="small"
          :icon="Close"
          @click="$emit('dismiss')"
        />
      </div>
    </div>
    
    <!-- 加载动画 -->
    <transition name="fade" mode="out-in">
      <div v-if="!visible && countdown > 0" class="loading-state">
        <div class="countdown-ring">
          <svg viewBox="0 0 100 100">
            <circle
              class="ring-bg"
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              class="ring-progress"
              cx="50"
              cy="50"
              r="45"
              :style="{ strokeDashoffset: dashOffset }"
            />
          </svg>
          <span class="countdown-text">{{ countdown }}s</span>
        </div>
        <p class="loading-text">正在分析回答，生成推荐问题...</p>
      </div>
      
      <!-- 问题列表 -->
      <div v-else-if="suggestions.length" class="suggestions-content">
        <!-- 追问 -->
        <div class="suggestion-group" v-if="followupQuestions.length">
          <div class="group-header">
            <div class="group-badge followup">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="group-info">
              <h4>追问建议</h4>
              <p>深入挖掘候选人的回答细节</p>
            </div>
          </div>
          <transition-group name="list" tag="div" class="question-list">
            <div
              v-for="(q, index) in followupQuestions"
              :key="q.id"
              class="question-card"
              :style="{ '--delay': index * 0.1 + 's' }"
              @click="handleUse(q)"
            >
              <div class="card-number">{{ index + 1 }}</div>
              <div class="card-content">
                <p class="question-text">{{ q.question }}</p>
              </div>
              <div class="card-action">
                <el-icon><Right /></el-icon>
              </div>
            </div>
          </transition-group>
        </div>
        
        <!-- 候选问题 -->
        <div class="suggestion-group" v-if="alternativeQuestions.length">
          <div class="group-header">
            <div class="group-badge alternative">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="group-info">
              <h4>候选问题</h4>
              <p>不同角度的备选问题</p>
            </div>
          </div>
          <transition-group name="list" tag="div" class="question-list alternative">
            <div
              v-for="(q, index) in alternativeQuestions"
              :key="q.id"
              class="question-card alt"
              :style="{ '--delay': (followupQuestions.length + index) * 0.1 + 's' }"
              @click="handleUse(q)"
            >
              <div class="card-angle">
                <el-tag size="small" type="info">{{ q.angle }}</el-tag>
              </div>
              <div class="card-content">
                <p class="question-text">{{ q.question }}</p>
              </div>
              <div class="card-action">
                <el-icon><Right /></el-icon>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <el-icon><Document /></el-icon>
        </div>
        <h4>等待回答</h4>
        <p>候选人回答后，系统将自动推荐追问和候选问题</p>
      </div>
    </transition>
    
    <!-- 配置提示 -->
    <div class="config-hint" v-if="visible">
      <el-icon><InfoFilled /></el-icon>
      <span>当前配置：{{ followupCount }} 个追问，{{ alternativeCount }} 个候选问题</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Promotion, RefreshRight, Close, ChatDotRound, Grid,
  Right, Document, InfoFilled
} from '@element-plus/icons-vue'
import type { SuggestedQuestion } from '@/composables/useInterviewAssist'

const props = defineProps<{
  suggestions: SuggestedQuestion[]
  visible: boolean
  countdown: number
  followupCount: number
  alternativeCount: number
}>()

const emit = defineEmits<{
  use: [suggestion: SuggestedQuestion]
  dismiss: []
  refresh: []
}>()

// 计算属性
const followupQuestions = computed(() =>
  props.suggestions.filter(s => s.type === 'followup')
)

const alternativeQuestions = computed(() =>
  props.suggestions.filter(s => s.type === 'alternative')
)

const dashOffset = computed(() => {
  const circumference = 2 * Math.PI * 45
  const progress = props.countdown / 10 // 假设最大10秒
  return circumference * (1 - progress)
})

// 方法
const handleUse = (suggestion: SuggestedQuestion) => {
  emit('use', suggestion)
}
</script>

<style scoped lang="scss">
.question-suggestion {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fafbfc 0%, #f3f4f6 100%);
  
  &.visible {
    .suggestions-content {
      opacity: 1;
    }
  }
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e5e7eb;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #1a1a2e;
    
    .title-icon {
      font-size: 20px;
      color: #667eea;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 4px;
  }
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .countdown-ring {
    position: relative;
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
    
    svg {
      transform: rotate(-90deg);
      
      circle {
        fill: none;
        stroke-width: 6;
        stroke-linecap: round;
      }
      
      .ring-bg {
        stroke: #e5e7eb;
      }
      
      .ring-progress {
        stroke: url(#gradient);
        stroke: #667eea;
        stroke-dasharray: 283;
        transition: stroke-dashoffset 1s ease;
      }
    }
    
    .countdown-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }
  }
  
  .loading-text {
    font-size: 14px;
    color: #6b7280;
    text-align: center;
    animation: pulse 2s infinite;
  }
}

.suggestions-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.suggestion-group {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .group-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .group-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.followup {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.alternative {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      
      .el-icon {
        font-size: 20px;
        color: white;
      }
    }
    
    .group-info {
      h4 {
        font-size: 15px;
        font-weight: 600;
        color: #1a1a2e;
        margin: 0 0 2px;
      }
      
      p {
        font-size: 12px;
        color: #9ca3af;
        margin: 0;
      }
    }
  }
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  animation: slideInRight 0.4s ease backwards;
  animation-delay: var(--delay, 0s);
  
  &:hover {
    border-color: #667eea;
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
    
    .card-action {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &.alt {
    &:hover {
      border-color: #10b981;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
    }
  }
  
  .card-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .card-angle {
    flex-shrink: 0;
  }
  
  .card-content {
    flex: 1;
    min-width: 0;
    
    .question-text {
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  
  .card-action {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.25s ease;
    
    .el-icon {
      font-size: 14px;
      color: #667eea;
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    
    .el-icon {
      font-size: 40px;
      color: #9ca3af;
    }
  }
  
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px;
  }
  
  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
    text-align: center;
    max-width: 240px;
  }
}

.config-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  background: #f3f4f6;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
  
  .el-icon {
    font-size: 14px;
  }
}

// 动画
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.list-enter-active {
  transition: all 0.3s ease;
}

.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
