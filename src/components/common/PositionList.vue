<template>
  <el-card class="groups-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <span class="card-title">招聘岗位</span>
          <el-button 
            type="info" 
            size="small" 
            link 
            @click="toggleExpand"
          >
            {{ isExpanded ? '收起详情' : '展开详情' }}
          </el-button>
        </div>
        <router-link to="/positions">
          <el-button type="primary" size="small">管理岗位</el-button>
        </router-link>
      </div>
    </template>
    
    <div v-if="positions.length === 0" class="empty-groups">
      <el-empty description="暂无岗位，请先创建岗位" :image-size="60">
        <router-link to="/positions">
          <el-button type="primary" size="small">创建岗位</el-button>
        </router-link>
      </el-empty>
    </div>
    
    <div v-else class="groups-list">
      <div 
        v-for="pos in positions" 
        :key="pos.id" 
        class="group-item-card"
        :class="{ active: selectedPositionId === pos.id }"
        @click="$emit('select', pos)"
      >
        <div class="group-header">
          <div class="group-title">
            <span class="group-name">{{ pos.position }}</span>
          </div>
          <div class="group-actions">
            <span class="group-meta">{{ pos.resume_count || 0 }} 份</span>
            <el-button 
              v-if="isExpanded"
              type="primary" 
              size="small" 
              link 
              @click.stop="$emit('assign', pos)"
            >+添加</el-button>
          </div>
        </div>
        
        <!-- 岗位中的简历列表 - 展开时才显示 -->
        <div v-if="isExpanded && pos.resumes && pos.resumes.length > 0" class="resumes-preview">
          <div class="resumes-list">
            <div 
              v-for="resume in getPagedResumes(pos)" 
              :key="resume.id" 
              class="resume-item clickable"
              @click.stop="$emit('showResumeDetail', resume)"
            >
              <div class="resume-info">
                <span class="resume-name">{{ resume.candidate_name || '未知候选人' }}</span>
              </div>
              <div class="resume-actions">
                <el-tag v-if="resume.screening_score" size="small" type="success">
                  {{ resume.screening_score.comprehensive_score }}
                </el-tag>
                <el-icon 
                  class="remove-btn" 
                  @click.stop="$emit('removeResume', pos, resume)"
                ><Close /></el-icon>
              </div>
            </div>
          </div>
          
          <!-- 简洁翻页 -->
          <div v-if="pos.resumes.length > pageSize" class="resumes-pagination">
            <el-button 
              size="small" 
              link 
              :disabled="(pos as any).currentPage <= 1"
              @click.stop="prevPage(pos)"
            >上一页</el-button>
            <span class="page-info">{{ (pos as any).currentPage || 1 }}/{{ Math.ceil(pos.resumes.length / pageSize) }}</span>
            <el-button 
              size="small" 
              link 
              :disabled="((pos as any).currentPage || 1) >= Math.ceil(pos.resumes.length / pageSize)"
              @click.stop="nextPage(pos)"
            >下一页</el-button>
          </div>
        </div>
        <div v-else-if="isExpanded" class="no-resumes">暂无简历</div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
import type { PositionData, ResumeData } from '@/types'

const props = defineProps<{
  positions: PositionData[]
  selectedPositionId: string | null
}>()

// 展开/收起状态
const isExpanded = ref(true)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

defineEmits<{
  select: [pos: PositionData]
  assign: [pos: PositionData]
  showResumeDetail: [resume: ResumeData]
  removeResume: [pos: PositionData, resume: ResumeData]
}>()

const pageSize = 8

// 获取分页后的简历列表
const getPagedResumes = (pos: PositionData) => {
  if (!pos.resumes) return []
  const page = (pos as any).currentPage || 1
  const start = (page - 1) * pageSize
  return pos.resumes.slice(start, start + pageSize)
}

// 上一页
const prevPage = (pos: PositionData) => {
  const current = (pos as any).currentPage || 1
  if (current > 1) {
    (pos as any).currentPage = current - 1
  }
}

// 下一页
const nextPage = (pos: PositionData) => {
  const current = (pos as any).currentPage || 1
  const total = Math.ceil((pos.resumes?.length || 0) / pageSize)
  if (current < total) {
    (pos as any).currentPage = current + 1
  }
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-item-card {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f2f5;
  }

  &.active {
    background: #ecf5ff;
    border-color: #409eff;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;

    .group-title {
      display: flex;
      align-items: center;
      gap: 8px;

      .group-name {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .group-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .group-meta {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .resumes-preview {
    .resumes-list {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .resume-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #ebeef5;

        &.clickable {
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            background: #f5f7fa;
            border-color: #409eff;
          }
        }

        .resume-info {
          display: flex;
          flex-direction: column;

          .resume-name {
            font-size: 13px;
            font-weight: 500;
            color: #303133;
          }
        }

        .resume-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .remove-btn {
            color: #c0c4cc;
            cursor: pointer;
            font-size: 14px;
            
            &:hover {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }

  .resumes-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
    margin-top: 8px;
    
    .page-info {
      font-size: 12px;
      color: #909399;
    }
  }
}

.no-resumes {
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
  padding: 8px;
}

.empty-groups {
  padding: 20px 0;
}
</style>
