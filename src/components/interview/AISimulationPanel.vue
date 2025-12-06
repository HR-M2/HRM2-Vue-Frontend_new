<template>
  <div class="ai-simulation-panel">
    <!-- 候选人选择区域 -->
    <div class="candidate-selection" v-if="!isActive">
      <div class="selection-header">
        <div class="icon-wrapper">
          <el-icon class="pulse-icon"><Monitor /></el-icon>
        </div>
        <h3>AI 模拟面试演示</h3>
        <p class="desc">选择一个虚拟候选人类型，体验面试辅助系统的功能</p>
      </div>
      
      <div class="candidate-grid">
        <div
          v-for="(profile, key) in candidatePresets"
          :key="key"
          class="candidate-card"
          :class="{ 'selected': selectedType === key }"
          @click="selectedType = key"
        >
          <div class="card-avatar" :class="`avatar-${key}`">
            <span>{{ getAvatarEmoji(key) }}</span>
          </div>
          <div class="card-content">
            <h4>{{ profile.name }}</h4>
            <div class="skill-tags">
              <span 
                v-for="skillName in Object.keys(profile.skills).slice(0, 3)" 
                :key="skillName"
                class="skill-tag"
              >
                {{ skillName }}
              </span>
            </div>
            <div class="personality-bar">
              <span class="bar-label">综合能力</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: getAvgSkill(profile) + '%' }"></div>
              </div>
              <span class="bar-value">{{ getAvgSkill(profile) }}%</span>
            </div>
          </div>
          <div class="card-check" v-if="selectedType === key">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </div>
      
      <div class="action-area">
        <el-button
          type="primary"
          size="large"
          :disabled="!selectedType"
          @click="handleStart"
          class="start-btn"
        >
          <el-icon class="mr-2"><VideoPlay /></el-icon>
          开始模拟面试
        </el-button>
      </div>
    </div>
    
    <!-- 面试进行中 -->
    <div class="interview-active" v-else>
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="status-left">
          <div class="candidate-badge">
            <span class="avatar">{{ getAvatarEmoji(selectedCandidate?.type || 'ideal') }}</span>
            <span class="name">{{ selectedCandidate?.name }}</span>
          </div>
          <el-tag type="success" effect="light" class="status-tag">
            <span class="status-dot"></span>
            面试进行中
          </el-tag>
        </div>
        <div class="status-right">
          <div class="stat-item">
            <el-icon><QuestionFilled /></el-icon>
            <span>{{ stats.totalQuestions }} 问题</span>
          </div>
          <div class="stat-item">
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ stats.totalFollowups }} 追问</span>
          </div>
          <div class="stat-item">
            <el-icon><Timer /></el-icon>
            <span>{{ formatDuration }}</span>
          </div>
        </div>
      </div>
      
      <!-- 对话区域 -->
      <div class="chat-container" ref="chatContainerRef">
        <transition-group name="message" tag="div" class="messages-list">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="[`message-${message.role}`, { 'typing': message.isTyping }]"
          >
            <div class="message-avatar">
              <span v-if="message.role === 'interviewer'">👔</span>
              <span v-else-if="message.role === 'candidate'">{{ getAvatarEmoji(selectedCandidate?.type || 'ideal') }}</span>
              <span v-else>🔔</span>
            </div>
            <div class="message-body">
              <div class="message-header">
                <span class="role-name">
                  {{ message.role === 'interviewer' ? '面试官' : message.role === 'candidate' ? selectedCandidate?.name : '系统' }}
                </span>
                <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content">
                {{ message.content }}
                <span v-if="message.isTyping" class="typing-cursor">|</span>
              </div>
              <!-- 评估结果 -->
              <transition name="fade">
                <div v-if="message.evaluation" class="evaluation-badge">
                  <div class="eval-score" :class="getScoreClass(message.evaluation.score)">
                    <span class="score-value">{{ Math.round(message.evaluation.score) }}</span>
                    <span class="score-label">分</span>
                  </div>
                  <div class="eval-info">
                    <span class="recommendation">{{ getRecommendationText(message.evaluation.recommendation) }}</span>
                    <span class="feedback">{{ message.evaluation.feedback }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </transition-group>
        
        <!-- AI 正在输入指示器 -->
        <transition name="fade">
          <div v-if="isAITyping" class="typing-indicator">
            <div class="typing-avatar">{{ getAvatarEmoji(selectedCandidate?.type || 'ideal') }}</div>
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="typing-text">{{ selectedCandidate?.name }} 正在回答...</span>
          </div>
        </transition>
      </div>
      
      <!-- 问题输入区域 -->
      <div class="input-area">
        <div class="quick-questions" v-if="quickQuestions.length">
          <span class="quick-label">快捷问题：</span>
          <div class="quick-tags">
            <el-tag
              v-for="(q, index) in quickQuestions"
              :key="index"
              class="quick-tag"
              @click="handleQuickQuestion(q)"
            >
              {{ q.slice(0, 15) }}...
            </el-tag>
          </div>
        </div>
        
        <div class="input-row">
          <el-input
            v-model="questionInput"
            type="textarea"
            :rows="2"
            placeholder="输入面试问题，然后按 Enter 发送或点击发送按钮..."
            :disabled="isAITyping || isPaused"
            @keydown.enter.ctrl="sendQuestion"
            class="question-input"
          />
          <div class="input-actions">
            <el-button
              type="primary"
              :icon="Promotion"
              :disabled="!questionInput.trim() || isAITyping"
              @click="sendQuestion"
              class="send-btn"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="control-bar">
        <el-button v-if="!isPaused" @click="$emit('pause')" :icon="VideoPause">暂停</el-button>
        <el-button v-else type="primary" @click="$emit('resume')" :icon="VideoPlay">继续</el-button>
        <el-button type="danger" @click="$emit('end')" :icon="Close">结束面试</el-button>
        <el-button @click="$emit('export')" :icon="Download">导出记录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  Monitor, Check, VideoPlay, VideoPause, Close, Download,
  QuestionFilled, ChatLineRound, Timer, Promotion
} from '@element-plus/icons-vue'
import type { CandidateProfile, Message } from '@/composables/useInterviewAssist'

const props = defineProps<{
  isActive: boolean
  isPaused: boolean
  messages: Message[]
  isAITyping: boolean
  selectedCandidate: CandidateProfile | null
  candidatePresets: Record<string, CandidateProfile>
  stats: {
    totalQuestions: number
    totalFollowups: number
    startTime: Date | null
  }
}>()

const emit = defineEmits<{
  start: [type: string]
  pause: []
  resume: []
  end: []
  export: []
  ask: [question: string]
}>()

const selectedType = ref<string>('')
const questionInput = ref('')
const chatContainerRef = ref<HTMLElement | null>(null)

// 快捷问题
const quickQuestions = [
  '请介绍一下您对 React 的理解和实际应用经验？',
  '请描述一个您最引以为傲的项目？',
  '在工作中遇到最大的技术挑战是什么？',
  '您如何与团队成员进行有效沟通？'
]

// 计算属性
const formatDuration = computed(() => {
  if (!props.stats.startTime) return '00:00'
  const seconds = Math.floor((Date.now() - props.stats.startTime.getTime()) / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

// 方法
const getAvatarEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    ideal: '⭐',
    junior: '👶',
    nervous: '😰',
    overconfident: '😎',
    random: '🎲'
  }
  return emojis[type] || '👤'
}

const getAvgSkill = (profile: CandidateProfile) => {
  const skills = Object.values(profile.skills)
  return Math.round(skills.reduce((a, b) => a + b, 0) / skills.length * 10)
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const getScoreClass = (score: number) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-average'
  return 'score-poor'
}

const getRecommendationText = (rec: string) => {
  const texts: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    average: '一般',
    needsImprovement: '需改进'
  }
  return texts[rec] || rec
}

const handleStart = () => {
  if (selectedType.value) {
    emit('start', selectedType.value)
  }
}

const sendQuestion = () => {
  if (questionInput.value.trim() && !props.isAITyping) {
    emit('ask', questionInput.value.trim())
    questionInput.value = ''
  }
}

const handleQuickQuestion = (question: string) => {
  if (!props.isAITyping) {
    emit('ask', question)
  }
}

// 自动滚动到底部
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
})
</script>

<style scoped lang="scss">
.ai-simulation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 候选人选择区域
.candidate-selection {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .selection-header {
    text-align: center;
    margin-bottom: 40px;
    
    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      
      .pulse-icon {
        font-size: 40px;
        color: white;
        animation: pulse 2s infinite;
      }
    }
    
    h3 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 12px;
    }
    
    .desc {
      font-size: 16px;
      color: #6b7280;
      margin: 0;
    }
  }
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1100px;
  margin-bottom: 40px;
}

.candidate-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15);
    
    &::before {
      opacity: 1;
    }
  }
  
  &.selected {
    border-color: #667eea;
    
    &::before {
      opacity: 1;
    }
  }
  
  .card-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin-bottom: 16px;
    
    &.avatar-ideal { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
    &.avatar-junior { background: linear-gradient(135deg, #6ee7b7, #10b981); }
    &.avatar-nervous { background: linear-gradient(135deg, #fca5a5, #ef4444); }
    &.avatar-overconfident { background: linear-gradient(135deg, #93c5fd, #3b82f6); }
  }
  
  .card-content {
    h4 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 12px;
    }
    
    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
      
      .skill-tag {
        background: #f3f4f6;
        color: #4b5563;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
      }
    }
    
    .personality-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .bar-label {
        font-size: 12px;
        color: #9ca3af;
        white-space: nowrap;
      }
      
      .bar-track {
        flex: 1;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
          transition: width 0.5s ease;
        }
      }
      
      .bar-value {
        font-size: 12px;
        font-weight: 600;
        color: #667eea;
        min-width: 36px;
      }
    }
  }
  
  .card-check {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #667eea;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.3s ease;
  }
}

.action-area {
  .start-btn {
    padding: 16px 48px;
    font-size: 18px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    
    &:hover:not(:disabled) {
      transform: scale(1.05);
    }
  }
}

// 面试进行中
.interview-active {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  
  .status-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .candidate-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .avatar {
        font-size: 24px;
      }
      
      .name {
        font-weight: 600;
        color: #1a1a2e;
      }
    }
    
    .status-tag {
      .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        margin-right: 6px;
        animation: pulse 1.5s infinite;
      }
    }
  }
  
  .status-right {
    display: flex;
    gap: 24px;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 14px;
      
      .el-icon {
        color: #9ca3af;
      }
    }
  }
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.message-item {
  display: flex;
  gap: 14px;
  animation: slideIn 0.3s ease;
  
  &.message-system {
    justify-content: center;
    
    .message-avatar { display: none; }
    
    .message-body {
      background: #fef3c7;
      border-radius: 8px;
      padding: 10px 16px;
      
      .message-header { display: none; }
      
      .message-content {
        color: #92400e;
        font-size: 14px;
        text-align: center;
      }
    }
  }
  
  &.message-interviewer {
    .message-body {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
    }
  }
  
  &.message-candidate {
    .message-body {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
    }
  }
  
  .message-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }
  
  .message-body {
    flex: 1;
    padding: 16px;
    border-radius: 12px;
    max-width: 85%;
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .role-name {
        font-weight: 600;
        color: #374151;
        font-size: 14px;
      }
      
      .timestamp {
        font-size: 12px;
        color: #9ca3af;
      }
    }
    
    .message-content {
      color: #4b5563;
      line-height: 1.6;
      
      .typing-cursor {
        animation: blink 0.8s infinite;
      }
    }
  }
}

.evaluation-badge {
  margin-top: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  
  .eval-score {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    &.score-excellent { background: linear-gradient(135deg, #10b981, #059669); }
    &.score-good { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    &.score-average { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &.score-poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
    
    .score-value {
      font-size: 18px;
      font-weight: 700;
      color: white;
    }
    
    .score-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  .eval-info {
    flex: 1;
    
    .recommendation {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #e5e7eb;
      color: #374151;
      margin-bottom: 6px;
    }
    
    .feedback {
      display: block;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-top: 16px;
  
  .typing-avatar {
    font-size: 20px;
  }
  
  .typing-dots {
    display: flex;
    gap: 4px;
    
    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #667eea;
      animation: bounce 1.4s infinite ease-in-out;
      
      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
  
  .typing-text {
    font-size: 13px;
    color: #9ca3af;
  }
}

.input-area {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e5e7eb;
  
  .quick-questions {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    
    .quick-label {
      font-size: 12px;
      color: #9ca3af;
      white-space: nowrap;
    }
    
    .quick-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .quick-tag {
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
      }
    }
  }
  
  .input-row {
    display: flex;
    gap: 12px;
    
    .question-input {
      flex: 1;
      
      :deep(.el-textarea__inner) {
        border-radius: 12px;
        resize: none;
      }
    }
    
    .input-actions {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      
      .send-btn {
        height: 100%;
        min-width: 100px;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
      }
    }
  }
}

.control-bar {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  gap: 12px;
}

// 动画
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mr-2 {
  margin-right: 8px;
}
</style>
