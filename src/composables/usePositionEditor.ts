/**
 * 岗位编辑器 composable
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { positionApi } from '@/api'
import type { PositionData } from '@/types'

// 默认岗位数据
const defaultPositionData: PositionData = {
  position: '',
  description: '',
  required_skills: [],
  optional_skills: [],
  min_experience: 0,
  education: [],
  certifications: [],
  salary_range: [0, 0],
  project_requirements: {
    min_projects: 0,
    team_lead_experience: false
  },
  resumes: []
}

export function usePositionEditor() {
  // 状态
  const loading = ref(false)
  const saving = ref(false)
  const positions = ref<PositionData[]>([])
  const selectedPositionId = ref<string | null>(null)
  const originalData = ref<PositionData | null>(null)

  // 当前编辑的表单数据
  const formData = reactive<PositionData>({ ...defaultPositionData })

  // 计算是否有未保存的更改
  const hasChanges = computed(() => {
    if (!originalData.value) return false
    return JSON.stringify(formData) !== JSON.stringify(originalData.value)
  })

  // 加载岗位列表
  const loadPositions = async () => {
    loading.value = true
    try {
      const result = await positionApi.getPositions({ include_resumes: true })
      positions.value = result.positions || []
    } catch (err) {
      console.error('加载岗位列表失败:', err)
      ElMessage.error('加载岗位列表失败')
    } finally {
      loading.value = false
    }
  }

  // 选择岗位
  const selectPosition = async (pos: PositionData) => {
    if (hasChanges.value) {
      try {
        await ElMessageBox.confirm('当前有未保存的更改，是否放弃？', '提示', {
          confirmButtonText: '放弃',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return false
      }
    }

    selectedPositionId.value = pos.id || null

    // 加载岗位详情
    if (pos.id) {
      try {
        const detail = await positionApi.getPosition(pos.id)
        Object.assign(formData, {
          ...defaultPositionData,
          ...detail,
          salary_range: detail.salary_range || [0, 0],
          project_requirements: detail.project_requirements || { min_projects: 0, team_lead_experience: false }
        })
        originalData.value = JSON.parse(JSON.stringify(formData))
      } catch (err) {
        console.error('加载岗位详情失败:', err)
        ElMessage.error('加载岗位详情失败')
        return false
      }
    }
    return true
  }

  // 创建岗位
  const createPosition = async (name: string, description: string) => {
    if (!name.trim()) {
      ElMessage.warning('请输入岗位名称')
      return null
    }

    try {
      const newPos = await positionApi.createPosition({
        position: name,
        description,
        required_skills: [],
        optional_skills: [],
        min_experience: 0,
        education: [],
        certifications: []
      })

      ElMessage.success('岗位创建成功')
      await loadPositions()

      // 自动选中新创建的岗位
      if (newPos.id) {
        await selectPosition(newPos)
      }

      return newPos
    } catch (err: unknown) {
      console.error('创建岗位失败:', err)
      const errorMessage = err instanceof Error ? err.message : '创建岗位失败'
      ElMessage.error(errorMessage)
      return null
    }
  }

  // 删除岗位
  const deletePosition = async (pos: PositionData) => {
    if (!pos.id) return false

    try {
      await ElMessageBox.confirm(`确定要删除岗位"${pos.position}"吗？`, '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await positionApi.deletePosition(pos.id)
      ElMessage.success('岗位已删除')

      // 如果删除的是当前选中的岗位，清空选择
      if (selectedPositionId.value === pos.id) {
        selectedPositionId.value = null
        originalData.value = null
        Object.assign(formData, defaultPositionData)
      }

      await loadPositions()
      return true
    } catch (err) {
      if (err !== 'cancel') {
        console.error('删除岗位失败:', err)
        ElMessage.error('删除岗位失败')
      }
      return false
    }
  }

  // 保存岗位
  const savePosition = async () => {
    if (!selectedPositionId.value || !hasChanges.value) return false

    saving.value = true
    try {
      await positionApi.updatePosition(selectedPositionId.value, formData)
      originalData.value = JSON.parse(JSON.stringify(formData))
      ElMessage.success('保存成功')
      await loadPositions()
      return true
    } catch (err) {
      console.error('保存失败:', err)
      ElMessage.error('保存失败')
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    // 状态
    loading,
    saving,
    positions,
    selectedPositionId,
    formData,
    hasChanges,
    // 方法
    loadPositions,
    selectPosition,
    createPosition,
    deletePosition,
    savePosition
  }
}
