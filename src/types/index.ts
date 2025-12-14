/**
 * 通用类型定义
 */

// API 响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应（匹配后端 ApiResponse.paginated 格式）
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/**
 * 岗位设置模块
 */
export interface ProjectRequirements {
  min_projects: number
  team_lead_experience: boolean
}

export interface PositionData {
  id?: string
  position: string
  department?: string
  description?: string
  required_skills: string[]
  optional_skills: string[]
  min_experience: number
  education: string[]
  certifications: string[]
  salary_range?: [number, number]
  project_requirements?: ProjectRequirements
  is_active?: boolean
  resume_count?: number
  resumes?: ResumeData[]  // 分配到该岗位的简历
  created_at?: string
  updated_at?: string
}

/**
 * 简历筛选模块
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ScreeningScore {
  hr_score?: number
  technical_score?: number
  manager_score?: number
  comprehensive_score: number
}

export interface ResumeScreeningTask {
  task_id: string
  status: TaskStatus
  progress: number
  current_step?: number
  total_steps?: number
  error_message?: string
  current_speaker?: string
  created_at: string
  updated_at?: string
  reports?: ReportInfo[]
  resume_data?: ResumeDataScore[]
}

export interface ReportInfo {
  report_id: string
  report_filename: string
  download_url: string
  resume_content?: string
  position_info?: PositionData
}

export interface ResumeDataScore {
  id?: string
  candidate_name?: string
  position_title?: string
  screening_score?: ScreeningScore
  screening_summary?: string
  json_content?: string
  resume_content?: string
  report_md_url?: string
  report_json_url?: string
}

export interface ResumeData {
  id: string
  position_title: string
  candidate_name: string
  resume_content?: string
  screening_score?: ScreeningScore
  screening_summary?: string
  report_md_url?: string
  report_json_url?: string
  video_analysis_status?: string
  video_analysis_result?: VideoAnalysisResult
  video_analysis?: VideoAnalysis  // 关联的视频分析对象
  created_at: string
  task_id?: string  // 关联的任务ID
}

/**
 * 视频分析模块
 */
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface VideoAnalysisResult {
  fraud_score: number
  neuroticism_score: number
  extraversion_score: number
  openness_score: number
  agreeableness_score: number
  conscientiousness_score: number
}

export interface VideoAnalysis {
  id: string
  video_name: string
  video_file: string
  file_size?: number
  candidate_name: string
  position_applied: string
  status: VideoStatus
  error_message?: string
  fraud_score?: number
  neuroticism_score?: number
  extraversion_score?: number
  openness_score?: number
  agreeableness_score?: number
  conscientiousness_score?: number
  confidence_score?: number
  summary?: string
  created_at: string
  updated_at?: string
}

/**
 * 最终推荐模块
 * 
 * 注意: InterviewEvaluationTask 类型已废弃并移除（批量评估功能已废弃）
 * 请使用 ComprehensiveAnalysisResult (定义在 api/index.ts) 进行单人综合分析
 */

/**
 * 简历管理模块 - 统一简历模型
 * 合并原 ResumeLibrary 和 ResumeData
 */
export type ResumeStatus = 'pending' | 'screened' | 'interviewing' | 'analyzed'

export interface Resume {
  id: string
  // 文件信息
  filename: string
  file_hash: string
  file_size: number
  file_type: string
  // 候选人信息
  candidate_name: string
  content?: string
  content_preview?: string
  // 岗位关联
  position_id?: string | null
  position_title?: string | null
  // 状态管理
  status: ResumeStatus
  // 筛选结果
  screening_result?: {
    score?: number
    dimensions?: Record<string, unknown>
    summary?: string
  } | null
  screening_report?: string | null
  // 关联数据
  video_analysis?: VideoAnalysis | null
  // 备注
  notes?: string | null
  // 时间戳
  created_at: string
  updated_at?: string
  // 兼容字段（计算属性）
  is_screened?: boolean
  is_assigned?: boolean
}

/**
 * 简历文件类型
 */
export interface ResumeFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  content: string
  status: 'pending' | 'parsing' | 'parsed' | 'error'
  error?: string
}

/**
 * 处理队列项类型
 */
export interface ProcessingTask {
  name: string
  task_id: string | null
  status: TaskStatus
  progress: number
  created_at: string
  applied_position?: string
  error_message?: string
  current_speaker?: string
  report_id?: string
  reports?: ReportInfo[]
  resume_data?: ResumeDataScore[]
}

/**
 * 导航项类型
 */
export interface NavItem {
  key: string
  label: string
  icon?: string
  path: string
}
