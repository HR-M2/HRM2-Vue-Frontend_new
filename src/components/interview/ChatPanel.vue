<template>
  <div class="chat-section">
    <!-- 消息列表 -->
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
            <span v-else-if="message.role === 'candidate'">👤</span>
            <span v-else>🔔</span>
          </div>
          <div class="message-body">
            <div class="message-header">
              <span class="role-name">
                {{ message.role === 'interviewer' ? '面试官' : message.role === 'candidate' ? '候选人' : '系统' }}
              </span>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
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
    </div>
    
    <!-- 输入区域 -->
    <div class="input-section">
      <!-- 面试官问题输入 -->
      <div class="interviewer-input">
        <div class="input-label">
          <el-icon><Edit /></el-icon>
          面试官提问
        </div>
        <div class="input-row">
          <el-input
            v-model="questionInput"
            type="textarea"
            :rows="2"
            placeholder="输入您要问候选人的问题..."
            :disabled="isPaused"
            @keydown.enter.ctrl="sendQuestion"
          />
          <el-button
            type="primary"
            :icon="Promotion"
            :disabled="!questionInput.trim()"
            @click="sendQuestion"
          >
            提问
          </el-button>
        </div>
      </div>
      
      <!-- 候选人回答输入 -->
      <div class="candidate-input">
        <div class="input-label">
          <el-icon><Microphone /></el-icon>
          候选人回答
          <el-tag v-if="isSpeechListening" type="danger" size="small" effect="plain" class="recording-tag">
            <span class="rec-dot"></span>
            录音中
          </el-tag>
          <el-tag v-if="!speechSupported" type="warning" size="small">
            浏览器不支持语音
          </el-tag>
        </div>
        <div class="input-row">
          <el-input
            v-model="answerInput"
            type="textarea"
            :rows="3"
            :placeholder="isSpeechListening ? '正在录音，请对着麦克风说话...' : '输入候选人的回答内容，或点击麦克风使用语音输入...'"
            :disabled="isPaused"
            :class="{ 'recording-active': isSpeechListening }"
          />
          <div class="input-actions">
            <el-tooltip :content="speechSupported ? (isSpeechListening ? '停止录音' : '开始语音输入') : '您的浏览器不支持语音识别'" placement="top">
              <el-button
                :type="isSpeechListening ? 'danger' : 'default'"
                circle
                size="large"
                :icon="isSpeechListening ? VideoPause : Microphone"
                @click="toggleRecording"
                class="mic-btn"
                :class="{ 'recording': isSpeechListening }"
                :disabled="!speechSupported"
              />
            </el-tooltip>
            <el-button
              type="success"
              :icon="Check"
              :disabled="!answerInput.trim()"
              @click="submitAnswer"
            >
              提交回答
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Microphone, VideoPause, Check, Edit, Promotion } from '@element-plus/icons-vue'
import type { Message } from '@/composables/useInterviewAssist'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'

const props = defineProps<{
  messages: Message[]
  isPaused: boolean
}>()

const emit = defineEmits<{
  ask: [question: string]
  submit: [answer: string]
  toggleRecording: [isRecording: boolean]
}>()

// 输入状态
const questionInput = ref('')
const answerInput = ref('')
const chatContainerRef = ref<HTMLElement | null>(null)

// 语音识别相关
const recognizedTextBeforeStart = ref('')

// 初始化语音识别
const {
  isSupported: speechSupported,
  isListening: isSpeechListening,
  finalTranscript: speechFinal,
  interimTranscript: speechInterim,
  start: startSpeech,
  stop: stopSpeech,
  reset: resetSpeech
} = useSpeechRecognition({
  lang: 'zh-CN',
  continuous: true,
  interimResults: true
})

// 监听语音识别结果
watch([speechFinal, speechInterim], ([final, interim]) => {
  if (isSpeechListening.value) {
    answerInput.value = recognizedTextBeforeStart.value + final + interim
  }
})

// 方法
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

const sendQuestion = () => {
  if (questionInput.value.trim()) {
    emit('ask', questionInput.value.trim())
    questionInput.value = ''
  }
}

const submitAnswer = () => {
  if (answerInput.value.trim()) {
    if (isSpeechListening.value) {
      stopSpeech()
    }
    emit('submit', answerInput.value.trim())
    answerInput.value = ''
    resetSpeech()
    recognizedTextBeforeStart.value = ''
  }
}

const toggleRecording = async () => {
  if (isSpeechListening.value) {
    stopSpeech()
    emit('toggleRecording', false)
  } else {
    recognizedTextBeforeStart.value = answerInput.value
    resetSpeech()
    const success = await startSpeech()
    if (success) {
      emit('toggleRecording', true)
    }
  }
}

// 自动滚动
watch(() => props.messages.length, () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
})
</script>

<style scoped lang="scss">
@use './styles/interview-common' as common;

.chat-section {
  display: flex;
  flex-direction: column;
  border-right: 1px solid common.$border-color;
}

.chat-container {
  @include common.chat-container;
}

.message-item {
  @include common.message-item;
}

.evaluation-badge {
  @include common.evaluation-badge;
}

.input-section {
  @include common.input-section;
  
  .interviewer-input,
  .candidate-input {
    margin-bottom: 16px;
    
    &:last-child { margin-bottom: 0; }
    
    .input-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    :deep(.recording-active) {
      .el-textarea__inner {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
        animation: border-pulse 2s infinite;
      }
    }
  }
}

@include common.recording-styles;

@keyframes border-pulse {
  0%, 100% { 
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  }
  50% { 
    border-color: #f87171;
    box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.1);
  }
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
</style>
