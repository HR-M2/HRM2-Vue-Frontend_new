/**
 * 岗位管理 composable
 * 处理岗位列表加载、选择、简历移除等操作
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { positionApi } from '@/api'
import type { PositionData, ResumeData } from '@/types'

export function usePositionManagement() {
  // 状态
  const positionData = ref<PositionData>({
    title: '前端开发工程师',
    required_skills: ['HTML', 'JavaScript', 'CSS'],
    optional_skills: [],
    min_experience: 2,
    education: ['本科', '硕士'],
    certifications: [],
    salary_range: [8000, 20000],
    project_requirements: { min_projects: 2, team_lead_experience: false }
  })
  const positionsList = ref<PositionData[]>([])
  const selectedPositionId = ref<string | null>(null)

  // 加载岗位列表
  const loadPositionsList = async () => {
    try {
      const result = await positionApi.getPositions({ include_resumes: true })
      positionsList.value = (result.positions || []).map(p => ({ ...p, showAll: false }))
      
      const firstPosition = positionsList.value[0]
      if (firstPosition && !selectedPositionId.value) {
        selectedPositionId.value = firstPosition.id ?? null
        positionData.value = firstPosition
      }
    } catch (err) {
      console.error('加载岗位列表失败:', err)
    }
  }

  // 选择岗位
  const selectPosition = (pos: PositionData) => {
    selectedPositionId.value = pos.id || null
    positionData.value = pos
  }

  // 从岗位移除简历
  const removeResumeFromPosition = async (pos: PositionData, resume: ResumeData) => {
    if (!pos.id || !resume.id) return
    
    try {
      await ElMessageBox.confirm(
        `确定要将 "${resume.candidate_name || '该简历'}" 从岗位中移除吗？`,
        '确认移除',
        { type: 'warning' }
      )
      
      await positionApi.removeResume(pos.id, resume.id)
      ElMessage.success('移除成功')
      loadPositionsList()
    } catch (err) {
      if (err !== 'cancel') {
        console.error('移除简历失败:', err)
        ElMessage.error('移除失败')
      }
    }
  }

  return {
    positionData,
    positionsList,
    selectedPositionId,
    loadPositionsList,
    selectPosition,
    removeResumeFromPosition
  }
}
