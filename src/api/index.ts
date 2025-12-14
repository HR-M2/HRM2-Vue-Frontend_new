/**
 * API 模块统一导出
 * 
 * 使用统一的 axios 实例和端点常量，响应格式为 {code, message, data}
 * 后端基础路径: /api/
 */
import type {
  PositionData,
  ResumeScreeningTask,
  ResumeData,
  VideoAnalysis,
  Resume,
  ResumeStatus
} from '@/types'
import { apiClient, rawApiClient, getApiBase, updateApiBase as configUpdateApiBase } from './config'
import { ENDPOINTS } from './endpoints'

// 重新导出配置模块的函数
export { getApiBase }
export const updateApiBase = configUpdateApiBase

// ==================== 岗位管理 API ====================
/**
 * 岗位设置 API
 * 后端路径: /api/positions/
 */
export const positionApi = {
  /**
   * 获取岗位列表（也用于获取默认岗位设置，向后兼容）
   */
  getCriteria: async (): Promise<PositionData> => {
    const data = await apiClient.get<{ positions: PositionData[], total: number }>(ENDPOINTS.POSITIONS)
    // 返回第一个岗位作为默认岗位（向后兼容）
    const result = data as unknown as { positions: PositionData[], total: number }
    return result.positions?.[0] || {} as PositionData
  },

  /**
   * 保存岗位设置（创建新岗位，向后兼容）
   */
  saveCriteria: async (data: PositionData): Promise<void> => {
    await apiClient.post(ENDPOINTS.POSITIONS, data)
  },

  /**
   * 获取所有岗位列表
   */
  getPositions: async (params?: { include_resumes?: boolean }): Promise<{ positions: PositionData[], total: number }> => {
    const searchParams = new URLSearchParams()
    if (params?.include_resumes) searchParams.append('include_resumes', 'true')
    const url = `${ENDPOINTS.POSITIONS}${searchParams.toString() ? '?' + searchParams : ''}`
    return await apiClient.get(url) as unknown as { positions: PositionData[], total: number }
  },

  /**
   * 创建新岗位
   */
  createPosition: async (data: Partial<PositionData>): Promise<PositionData> => {
    return await apiClient.post(ENDPOINTS.POSITIONS, data) as unknown as PositionData
  },

  /**
   * 获取单个岗位详情
   */
  getPosition: async (positionId: string, includeResumes = true): Promise<PositionData> => {
    const url = `${ENDPOINTS.POSITION_DETAIL(positionId)}?include_resumes=${includeResumes}`
    return await apiClient.get(url) as unknown as PositionData
  },

  /**
   * 更新岗位
   */
  updatePosition: async (positionId: string, data: Partial<PositionData>): Promise<PositionData> => {
    return await apiClient.put(ENDPOINTS.POSITION_DETAIL(positionId), data) as unknown as PositionData
  },

  /**
   * 删除岗位
   */
  deletePosition: async (positionId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.POSITION_DETAIL(positionId))
  },

  /**
   * 分配简历到岗位
   */
  assignResumes: async (positionId: string, resumeDataIds: string[]): Promise<{ assigned_count: number, total_resumes: number }> => {
    return await apiClient.post(ENDPOINTS.POSITION_RESUMES(positionId), { resume_data_ids: resumeDataIds }) as unknown as { assigned_count: number, total_resumes: number }
  },

  /**
   * 从岗位移除简历
   */
  removeResume: async (positionId: string, resumeId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.POSITION_REMOVE_RESUME(positionId, resumeId))
  },

  /**
   * AI生成岗位要求
   */
  aiGenerate: async (data: {
    description: string
    documents?: Array<{ name: string; content: string }>
  }): Promise<PositionData> => {
    return await apiClient.post(ENDPOINTS.POSITION_AI_GENERATE, data) as unknown as PositionData
  }
}

// ==================== 简历筛选 API ====================
/**
 * 简历筛选 API
 * 后端路径: /api/screening/
 * 
 * 注意：简历库相关API已迁移到 libraryApi（/api/library/）
 */
export const screeningApi = {
  /**
   * 提交筛选任务
   * 期望数据格式: { position: {...}, resumes: [{ name, content, metadata }] }
   */
  submitScreening: async (data: {
    position: Record<string, unknown>
    resumes: Array<{ name: string; content: string; metadata?: { size: number; type: string } }>
  }): Promise<ResumeScreeningTask> => {
    return await apiClient.post(ENDPOINTS.SCREENING, data) as unknown as ResumeScreeningTask
  },

  /**
   * 查询任务状态
   */
  getTaskStatus: async (taskId: string): Promise<ResumeScreeningTask> => {
    return await apiClient.get(ENDPOINTS.SCREENING_TASK_STATUS(taskId)) as unknown as ResumeScreeningTask
  },

  /**
   * 获取任务历史
   */
  getTaskHistory: async (params?: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<{ tasks: ResumeScreeningTask[]; total: number }> => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString())
    const url = `${ENDPOINTS.SCREENING_TASKS}?${searchParams}`
    const result = await apiClient.get(url) as unknown as { tasks: ResumeScreeningTask[]; total: number }
    return { tasks: result.tasks || [], total: result.total || 0 }
  },

  /**
   * 删除任务
   */
  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.SCREENING_TASK_DETAIL(taskId))
  },

  /**
   * 获取简历详情（报告）
   * 后端返回格式: { report: { id, candidate_name, position_title, screening_score, screening_summary, ... } }
   */
  getResumeDetail: async (resumeId: string): Promise<ResumeData | null> => {
    try {
      const result = await apiClient.get(ENDPOINTS.SCREENING_REPORT(resumeId)) as unknown as { report: ResumeData }
      return result.report || null
    } catch {
      return null
    }
  },

  /**
   * 获取可用于创建组的简历数据（从已完成任务中获取）
   */
  getAvailableResumes: async (): Promise<ResumeData[]> => {
    const result = await apiClient.get(`${ENDPOINTS.SCREENING_TASKS}?status=completed&page_size=100`) as unknown as { tasks: Array<Record<string, unknown>> }
    const tasks = result.tasks || []
    const resumes: ResumeData[] = []
    for (const task of tasks) {
      const resumeDataList = task.resume_data as Array<Record<string, unknown>> | undefined
      if (resumeDataList && Array.isArray(resumeDataList)) {
        for (const rd of resumeDataList) {
          const reports = task.reports as Array<{ position_info?: { position?: string } }> | undefined
          resumes.push({
            id: rd.id as string,
            position_title: (rd.position_title || reports?.[0]?.position_info?.position || '未知岗位') as string,
            candidate_name: (rd.candidate_name || '未知候选人') as string,
            screening_score: rd.screening_score as ResumeData['screening_score'],
            created_at: (rd.created_at || task.created_at) as string,
            task_id: task.task_id as string
          })
        }
      }
    }
    return resumes
  },

  /**
   * 下载报告（包含文件名）
   */
  downloadReportWithFilename: async (reportId: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await rawApiClient.get(ENDPOINTS.SCREENING_REPORT_DOWNLOAD(reportId), {
      responseType: 'blob'
    })
    
    // 从响应头获取文件名
    const contentDisposition = response.headers['content-disposition']
    let filename = `report_${reportId}.md`
    
    if (contentDisposition) {
      // 解析 filename*=UTF-8''xxx 格式
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
      if (utf8Match && utf8Match[1]) {
        filename = decodeURIComponent(utf8Match[1])
      } else {
        // 解析普通 filename="xxx" 格式
        const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
        if (normalMatch && normalMatch[1]) {
          filename = normalMatch[1]
        }
      }
    }
    
    return { blob: response.data, filename }
  },

  /**
   * 关联简历与视频
   * 将简历数据与视频分析记录建立关联
   */
  linkVideo: async (resumeDataId: string, videoAnalysisId: string): Promise<{
    resume_data_id: string
    video_analysis_id: string
    candidate_name: string
    video_name: string
  }> => {
    return await apiClient.post(ENDPOINTS.SCREENING_VIDEO_LINK, {
      resume_data_id: resumeDataId,
      video_analysis_id: videoAnalysisId
    }) as unknown as {
      resume_data_id: string
      video_analysis_id: string
      candidate_name: string
      video_name: string
    }
  },

  /**
   * 解除简历与视频关联
   */
  unlinkVideo: async (resumeDataId: string): Promise<{
    resume_data_id: string
    disconnected_video_id: string
    candidate_name: string
    video_name: string
  }> => {
    return await apiClient.post(ENDPOINTS.SCREENING_VIDEO_UNLINK, {
      resume_data_id: resumeDataId
    }) as unknown as {
      resume_data_id: string
      disconnected_video_id: string
      candidate_name: string
      video_name: string
    }
  }
}

// ==================== 视频分析 API ====================
/**
 * 视频分析 API
 * 后端路径: /api/videos/
 */
export const videoApi = {
  /**
   * 上传视频
   */
  uploadVideo: async (formData: FormData): Promise<VideoAnalysis> => {
    return await apiClient.post(ENDPOINTS.VIDEOS_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }) as unknown as VideoAnalysis
  },

  /**
   * 获取视频分析状态
   */
  getVideoStatus: async (videoId: string): Promise<VideoAnalysis> => {
    return await apiClient.get(ENDPOINTS.VIDEO_STATUS(videoId)) as unknown as VideoAnalysis
  },

  /**
   * 获取视频列表
   */
  getVideoList: async (): Promise<VideoAnalysis[]> => {
    const result = await apiClient.get(ENDPOINTS.VIDEOS) as unknown as { videos: VideoAnalysis[] }
    return result.videos || []
  },

  /**
   * 更新视频分析结果
   * 用于更新人格特征分数、欺诈检测分数等
   */
  updateVideo: async (videoId: string, data: {
    fraud_score?: number
    neuroticism_score?: number
    extraversion_score?: number
    openness_score?: number
    agreeableness_score?: number
    conscientiousness_score?: number
    summary?: string
    confidence_score?: number
    status?: string
  }): Promise<{
    id: string
    status: string
    analysis_result: Record<string, unknown>
    resume_data_id?: string
  }> => {
    return await apiClient.post(ENDPOINTS.VIDEO_DETAIL(videoId), data) as unknown as {
      id: string
      status: string
      analysis_result: Record<string, unknown>
      resume_data_id?: string
    }
  }
}

// ==================== 最终推荐 API ====================
/**
 * 最终推荐 API
 * 后端路径: /api/recommend/
 * 
 * 注意: 批量评估功能已废弃，以下方法已移除:
 * - createEvaluation
 * - getEvaluationStatus
 * - getEvaluationByGroup
 * - stopEvaluation
 * - downloadReport (批量评估报告)
 * 
 * 请使用 analyzeCandidate 和 getCandidateAnalysis 进行单人综合分析。
 */
export const recommendApi = {
  /**
   * 获取推荐统计数据
   */
  getStats: async (): Promise<{ analyzed_count: number }> => {
    return await apiClient.get(ENDPOINTS.RECOMMEND_STATS) as unknown as { analyzed_count: number }
  },

  /**
   * 单人综合分析
   * 注意：AI分析耗时较长，使用120秒超时
   */
  analyzeCandidate: async (resumeId: string): Promise<ComprehensiveAnalysisResult> => {
    return await apiClient.post(ENDPOINTS.RECOMMEND_ANALYSIS(resumeId), null, {
      timeout: 120000  // AI分析需要更长时间
    }) as unknown as ComprehensiveAnalysisResult
  },

  /**
   * 获取候选人的综合分析历史
   */
  getCandidateAnalysis: async (resumeId: string): Promise<ComprehensiveAnalysisResult | null> => {
    const result = await apiClient.get(ENDPOINTS.RECOMMEND_ANALYSIS(resumeId)) as unknown as ComprehensiveAnalysisResult | null
    return result || null
  }
}

// 综合分析结果类型
export interface ComprehensiveAnalysisResult {
  id?: string
  resume_id: string
  candidate_name: string
  final_score: number
  recommendation: {
    level: string
    label: string
    action: string
    score: number
  }
  dimension_scores: Record<string, {
    dimension_score: number
    dimension_name: string
    weight: number
    strengths: string[]
    weaknesses: string[]
    analysis: string
    sub_scores: Record<string, number>
  }>
  comprehensive_report: string
  created_at?: string
}

// ==================== 简历管理 API ====================
/**
 * 简历管理 API
 * 后端路径: /api/resumes/
 * 合并原 /api/library/ 功能
 */
export const resumeApi = {
  /**
   * 获取简历列表
   */
  getList: async (params?: {
    page?: number
    page_size?: number
    keyword?: string
    status?: ResumeStatus
    position_id?: string
    // 兼容旧参数
    is_screened?: boolean
    is_assigned?: boolean
  }): Promise<{
    resumes: Resume[]
    total: number
    page: number
    page_size: number
  }> => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString())
    if (params?.keyword) searchParams.append('keyword', params.keyword)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.position_id) searchParams.append('position_id', params.position_id)
    // 兼容旧参数
    if (params?.is_screened !== undefined) searchParams.append('is_screened', params.is_screened.toString())
    if (params?.is_assigned !== undefined) searchParams.append('is_assigned', params.is_assigned.toString())
    
    const url = `${ENDPOINTS.RESUMES}${searchParams.toString() ? '?' + searchParams : ''}`
    const result = await apiClient.get(url) as unknown as {
      resumes: Resume[]
      total: number
      page: number
      page_size: number
    }
    return {
      resumes: result?.resumes || [],
      total: result?.total || 0,
      page: result?.page || 1,
      page_size: result?.page_size || 20
    }
  },

  /**
   * 上传简历
   */
  upload: async (resumes: Array<{
    name: string
    content: string
    metadata?: { size?: number; type?: string }
  }>): Promise<{
    uploaded: Array<{ id: string; filename: string; candidate_name: string }>
    skipped: Array<{ filename: string; reason: string }>
    uploaded_count: number
    skipped_count: number
  }> => {
    return await apiClient.post(ENDPOINTS.RESUMES, { resumes }) as unknown as {
      uploaded: Array<{ id: string; filename: string; candidate_name: string }>
      skipped: Array<{ filename: string; reason: string }>
      uploaded_count: number
      skipped_count: number
    }
  },

  /**
   * 获取简历详情
   */
  getDetail: async (resumeId: string): Promise<Resume> => {
    return await apiClient.get(ENDPOINTS.RESUME_DETAIL(resumeId)) as unknown as Resume
  },

  /**
   * 更新简历信息
   */
  update: async (resumeId: string, data: {
    candidate_name?: string
    notes?: string
    status?: ResumeStatus
  }): Promise<Resume> => {
    return await apiClient.put(ENDPOINTS.RESUME_DETAIL(resumeId), data) as unknown as Resume
  },

  /**
   * 删除简历
   */
  delete: async (resumeId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.RESUME_DETAIL(resumeId))
  },

  /**
   * 批量删除简历
   */
  batchDelete: async (resumeIds: string[]): Promise<{ deleted_count: number }> => {
    return await apiClient.post(ENDPOINTS.RESUME_BATCH_DELETE, { resume_ids: resumeIds }) as unknown as { deleted_count: number }
  },

  /**
   * 检查哈希值是否已存在
   */
  checkHashes: async (hashes: string[]): Promise<{ exists: Record<string, boolean>; existing_count: number }> => {
    return await apiClient.post(ENDPOINTS.RESUME_CHECK_HASH, { hashes }) as unknown as { exists: Record<string, boolean>; existing_count: number }
  },

  /**
   * 分配简历到岗位
   */
  assign: async (resumeIds: string[], positionId: string | null): Promise<{ updated_count: number }> => {
    return await apiClient.post(ENDPOINTS.RESUME_ASSIGN, { 
      resume_ids: resumeIds,
      position_id: positionId 
    }) as unknown as { updated_count: number }
  },

  /**
   * 获取简历统计
   */
  getStats: async (): Promise<{
    total_count: number
    pending_count: number
    screened_count: number
    interviewing_count: number
    analyzed_count: number
    assigned_count: number
    unassigned_count: number
    interview_total: number
    interview_completed: number
  }> => {
    return await apiClient.get(ENDPOINTS.RESUME_STATS) as unknown as {
      total_count: number
      pending_count: number
      screened_count: number
      interviewing_count: number
      analyzed_count: number
      assigned_count: number
      unassigned_count: number
      interview_total: number
      interview_completed: number
    }
  },

  /**
   * 获取筛选结果
   */
  getScreeningResult: async (resumeId: string): Promise<{
    screening_result: Resume['screening_result']
    screening_report: string | null
  }> => {
    return await apiClient.get(ENDPOINTS.RESUME_SCREENING(resumeId)) as unknown as {
      screening_result: Resume['screening_result']
      screening_report: string | null
    }
  },

  /**
   * 更新筛选结果
   */
  updateScreeningResult: async (resumeId: string, data: {
    screening_result?: Resume['screening_result']
    screening_report?: string
    status?: ResumeStatus
  }): Promise<Resume> => {
    return await apiClient.put(ENDPOINTS.RESUME_SCREENING(resumeId), data) as unknown as Resume
  }
}

// 兼容别名 - libraryApi 已迁移到 resumeApi
export const libraryApi = resumeApi

// 兼容类型 - LibraryResume 已迁移到 Resume
export type LibraryResume = Resume

// ==================== 开发测试工具 API ====================
/**
 * 开发测试工具 API
 * 后端路径: /api/screening/dev/
 */
export const devToolsApi = {
  /**
   * 生成随机简历
   * 注意：LLM 串行生成简历较慢，需要更长超时时间
   */
  generateResumes: async (params: {
    position: {
      position: string
      description?: string
      required_skills?: string[]
      optional_skills?: string[]
      min_experience?: number
      education?: string[]
    }
    count: number
  }): Promise<{
    added: Array<{ id: string; filename: string; candidate_name: string }>
    skipped: Array<{ filename: string; reason: string }>
    added_count: number
    skipped_count: number
    requested_count: number
  }> => {
    // 每份简历约需 10-15 秒，设置超时 = 数量 * 20秒 + 30秒缓冲，最少120秒
    const timeout = Math.max(120000, params.count * 20000 + 30000)
    return await apiClient.post(ENDPOINTS.SCREENING_DEV_GENERATE, params, { timeout }) as unknown as {
      added: Array<{ id: string; filename: string; candidate_name: string }>
      skipped: Array<{ filename: string; reason: string }>
      added_count: number
      skipped_count: number
      requested_count: number
    }
  }
}

// ==================== 面试辅助 API ====================
/**
 * 面试辅助 API
 * 后端路径: /api/interviews/
 */
export const interviewAssistApi = {
  /**
   * 创建面试会话
   */
  createSession: async (data: {
    resume_data_id: string
    job_config?: Record<string, unknown>
  }): Promise<InterviewSession> => {
    return await apiClient.post(ENDPOINTS.INTERVIEW_SESSIONS, data) as unknown as InterviewSession
  },

  /**
   * 获取会话详情
   */
  getSession: async (sessionId: string): Promise<InterviewSession> => {
    return await apiClient.get(ENDPOINTS.INTERVIEW_SESSION_DETAIL(sessionId)) as unknown as InterviewSession
  },

  /**
   * 结束会话
   */
  endSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.INTERVIEW_SESSION_DETAIL(sessionId))
  },

  /**
   * 生成面试问题
   * 注意：此 API 后端需要多次 LLM 调用，超时设置为 90 秒
   */
  generateQuestions: async (sessionId: string, params?: {
    categories?: string[]
    candidate_level?: string
    count_per_category?: number
    focus_on_resume?: boolean
    interest_point_count?: number  // 兴趣点数量 1-3
  }): Promise<{
    question_pool: InterviewQuestion[]
    resume_highlights: string[]
    interest_points?: Array<{ content: string; question: string; reason?: string }>
  }> => {
    // 后端需要串行调用多次 LLM（简历问题 + 各类别技能问题），需要更长超时
    return await apiClient.post(ENDPOINTS.INTERVIEW_QUESTIONS(sessionId), params || {}, {
      timeout: 90000  // 90 秒超时
    }) as unknown as {
      question_pool: InterviewQuestion[]
      resume_highlights: string[]
      interest_points?: Array<{ content: string; question: string; reason?: string }>
    }
  },

  /**
   * 记录问答并生成候选提问
   */
  recordQA: async (sessionId: string, data: {
    question: {
      content: string
      expected_skills?: string[]
      difficulty?: number
    }
    answer: {
      content: string
    }
    skip_evaluation?: boolean  // 默认 true，跳过评估
    followup_count?: number  // 追问问题数量
    alternative_count?: number  // 候选问题数量
  }): Promise<{
    round_number: number
    evaluation: AnswerEvaluation | null  // 可能为 null
    candidate_questions: CandidateQuestion[]  // LLM生成的候选问题
    hr_action_hints: string[]
  }> => {
    // 后端调用 LLM 生成候选问题，需要更长超时
    return await apiClient.post(ENDPOINTS.INTERVIEW_QA(sessionId), data, {
      timeout: 60000  // 60 秒超时
    }) as unknown as {
      round_number: number
      evaluation: AnswerEvaluation | null
      candidate_questions: CandidateQuestion[]
      hr_action_hints: string[]
    }
  },

  /**
   * 生成最终报告
   * 注意：此 API 后端需要 LLM 调用，超时设置为 60 秒
   */
  generateReport: async (sessionId: string, params?: {
    include_conversation_log?: boolean
    hr_notes?: string
  }): Promise<{
    report: InterviewReport
    report_file_url: string | null
  }> => {
    // 后端调用 LLM 生成报告，需要更长超时
    return await apiClient.post(ENDPOINTS.INTERVIEW_REPORT(sessionId), params || {}, {
      timeout: 60000  // 60 秒超时
    }) as unknown as {
      report: InterviewReport
      report_file_url: string | null
    }
  },

  /**
   * 根据简历ID获取面试会话列表
   */
  getSessionsByResumeId: async (resumeId: string): Promise<Array<{
    id: string
    resume_data_id: string
    qa_records: Array<{ question: string; answer: string }>
    final_report?: {
      overall_assessment?: {
        recommendation_score: number
        recommendation: string
        summary: string
      }
      highlights?: string[]
      red_flags?: string[]
    }
    created_at: string
  }>> => {
    const url = `${ENDPOINTS.INTERVIEW_SESSIONS}?resume_id=${resumeId}`
    const result = await apiClient.get(url) as unknown as Array<{
      id: string
      resume_data_id: string
      qa_records: Array<{ question: string; answer: string }>
      final_report?: {
        overall_assessment?: {
          recommendation_score: number
          recommendation: string
          summary: string
        }
        highlights?: string[]
        red_flags?: string[]
      }
      created_at: string
    }>
    return result || []
  }
}

// 面试辅助类型定义（精简版）
export interface InterviewSession {
  session_id: string
  candidate_name: string
  position_title: string
  current_round: number
  qa_count?: number
  is_completed: boolean
  created_at: string
  updated_at?: string
  resume_summary?: {
    candidate_name: string
    position_title: string
    screening_score?: number
    screening_summary?: string
  }
  has_final_report?: boolean
  final_report_summary?: string
}

export interface InterviewQuestion {
  question: string
  category: string
  difficulty: number
  expected_skills: string[]
  source: 'resume_based' | 'skill_based' | 'hr_custom'
  related_point?: string
}

export interface AnswerEvaluation {
  normalized_score: number
  dimension_scores: {
    technical_depth: number
    practical_experience: number
    answer_specificity: number
    logical_clarity: number
    honesty: number
    communication: number
  }
  confidence_level: 'genuine' | 'uncertain' | 'overconfident'
  should_followup: boolean
  followup_reason?: string
  feedback: string
}

export interface FollowupSuggestion {
  question: string
  purpose: string
  difficulty: number
}

// 新增：LLM生成的候选问题
export interface CandidateQuestion {
  question: string
  purpose: string
  expected_skills: string[]
  source: 'followup' | 'resume' | 'job'
}

export interface InterviewReport {
  overall_assessment: {
    recommendation_score: number
    recommendation: string
    summary: string
  }
  dimension_analysis: Record<string, { score: number; comment: string }>
  skill_assessment: Array<{ skill: string; level: string; evidence: string }>
  highlights: string[]
  red_flags: string[]
  overconfidence_detected: boolean
  suggested_next_steps: string[]
}

export { apiClient }
