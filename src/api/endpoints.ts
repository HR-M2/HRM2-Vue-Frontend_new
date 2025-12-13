/**
 * API 端点常量模块
 * 
 * 定义所有 API 路径，与后端 URL 配置保持同步。
 * 后端基础路径: /api/
 */

export const ENDPOINTS = {
  // ==================== 岗位管理 ====================
  // 后端路由: apps/position_settings/urls.py
  // 基础路径: /api/positions/
  
  /** 岗位列表 - GET列表, POST创建 */
  POSITIONS: '/positions/',
  
  /** 岗位详情 - GET/PUT/DELETE */
  POSITION_DETAIL: (id: string) => `/positions/${id}/`,
  
  /** 简历分配 - POST分配简历到岗位 */
  POSITION_RESUMES: (id: string) => `/positions/${id}/resumes/`,
  
  /** 移除简历 - DELETE从岗位移除指定简历 */
  POSITION_REMOVE_RESUME: (positionId: string, resumeId: string) => 
    `/positions/${positionId}/resumes/${resumeId}/`,
  
  /** AI生成岗位要求 - POST */
  POSITION_AI_GENERATE: '/positions/ai/generate/',

  // ==================== 简历库 ====================
  // 后端路由: apps/resume_library/urls.py
  // 基础路径: /api/library/
  
  /** 简历库列表 - GET列表, POST上传 */
  LIBRARY: '/library/',
  
  /** 简历详情 - GET/PUT/DELETE */
  LIBRARY_DETAIL: (id: string) => `/library/${id}/`,
  
  /** 批量删除简历 - POST */
  LIBRARY_BATCH_DELETE: '/library/batch-delete/',
  
  /** 检查文件哈希值 - POST */
  LIBRARY_CHECK_HASH: '/library/check-hash/',

  // ==================== 简历筛选 ====================
  // 后端路由: apps/resume_screening/urls.py
  // 基础路径: /api/screening/
  
  /** 提交筛选任务 - POST */
  SCREENING: '/screening/',
  
  /** 任务列表 - GET */
  SCREENING_TASKS: '/screening/tasks/',
  
  /** 任务详情 - GET/DELETE */
  SCREENING_TASK_DETAIL: (id: string) => `/screening/tasks/${id}/`,
  
  /** 任务状态 - GET */
  SCREENING_TASK_STATUS: (id: string) => `/screening/tasks/${id}/status/`,
  
  /** 报告详情 - GET */
  SCREENING_REPORT: (id: string) => `/screening/reports/${id}/`,
  
  /** 报告下载 - GET */
  SCREENING_REPORT_DOWNLOAD: (id: string) => `/screening/reports/${id}/download/`,
  
  /** 筛选后的简历数据 - GET */
  SCREENING_DATA: '/screening/data/',
  
  /** 视频关联 - POST */
  SCREENING_VIDEO_LINK: '/screening/videos/link/',
  
  /** 取消视频关联 - POST */
  SCREENING_VIDEO_UNLINK: '/screening/videos/unlink/',
  
  /** 开发工具：生成随机简历 - POST */
  SCREENING_DEV_GENERATE: '/screening/dev/generate-resumes/',
  
  /** 开发工具：强制错误 - POST */
  SCREENING_DEV_FORCE_ERROR: '/screening/dev/force-error/',
  
  /** 开发工具：重置状态 - POST */
  SCREENING_DEV_RESET_STATE: '/screening/dev/reset-state/',

  // ==================== 视频分析 ====================
  // 后端路由: apps/video_analysis/urls.py
  // 基础路径: /api/videos/
  
  /** 视频列表 - GET */
  VIDEOS: '/videos/',
  
  /** 上传视频 - POST */
  VIDEOS_UPLOAD: '/videos/upload/',
  
  /** 视频分析状态 - GET */
  VIDEO_STATUS: (id: string) => `/videos/${id}/status/`,
  
  /** 视频详情 - PUT更新 */
  VIDEO_DETAIL: (id: string) => `/videos/${id}/`,

  // ==================== 最终推荐 ====================
  // 后端路由: apps/final_recommend/urls.py
  // 基础路径: /api/recommend/
  
  /** 推荐统计 - GET */
  RECOMMEND_STATS: '/recommend/stats/',
  
  /** 综合分析 - GET获取, POST创建 */
  RECOMMEND_ANALYSIS: (resumeId: string) => `/recommend/analysis/${resumeId}/`,

  // ==================== 面试辅助 ====================
  // 后端路由: apps/interview_assist/urls.py
  // 基础路径: /api/interviews/
  
  /** 会话列表和创建 - GET列表, POST创建 */
  INTERVIEW_SESSIONS: '/interviews/sessions/',
  
  /** 会话详情 - GET/PUT/DELETE */
  INTERVIEW_SESSION_DETAIL: (id: string) => `/interviews/sessions/${id}/`,
  
  /** 生成面试问题 - POST */
  INTERVIEW_QUESTIONS: (sessionId: string) => `/interviews/sessions/${sessionId}/questions/`,
  
  /** 记录问答 - POST */
  INTERVIEW_QA: (sessionId: string) => `/interviews/sessions/${sessionId}/qa/`,
  
  /** 生成报告 - POST */
  INTERVIEW_REPORT: (sessionId: string) => `/interviews/sessions/${sessionId}/report/`,
} as const

/**
 * 端点类型（用于类型检查）
 */
export type EndpointKey = keyof typeof ENDPOINTS
