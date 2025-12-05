<template>
  <el-dialog 
    :model-value="modelValue" 
    title="上传视频进行分析" 
    width="500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="upload-dialog-content">
      <p class="upload-hint">
        为候选人 <strong>{{ candidateName }}</strong> 上传面试视频
      </p>
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        accept="video/*"
        :on-change="handleChange"
        :on-remove="handleRemove"
      >
        <el-icon :size="48" color="#c0c4cc"><VideoCamera /></el-icon>
        <div class="el-upload__text">拖拽视频到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持常见视频格式（MP4、AVI、MOV等），建议大小不超过500MB</div>
        </template>
      </el-upload>
    </div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button 
        type="primary" 
        :loading="loading" 
        :disabled="!hasFile"
        @click="$emit('submit')"
      >
        开始分析
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VideoCamera } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
  candidateName: string
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'file-change': [file: any]
  'submit': []
}>()

const hasFile = ref(false)

const handleChange = (file: any) => {
  hasFile.value = true
  emit('file-change', file)
}

const handleRemove = () => {
  hasFile.value = false
}
</script>

<style scoped lang="scss">
.upload-dialog-content {
  .upload-hint {
    margin: 0 0 16px 0;
    color: #606266;
    
    strong {
      color: #409eff;
    }
  }
}
</style>
