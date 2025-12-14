> ⚠️ 本文档描述前端**实际调用**的 API 形态，后端应以此为契约标准进行对齐。

**更新日期**: 2024-12-14（数据库简化重构后）

# 前端 API 契约（现状）

本文档基于前端工程 `src/api/endpoints.ts`、`src/api/index.ts`、`src/api/config.ts` 汇总，描述“前端实际调用/期望”的 API 形态，用于后续与后端现状（OpenAPI/代码）对比。

## 1. 全局约定

### 1.1 Base URL

- **来源**
  - 优先读取：`localStorage.apiSettings.baseUrl`
  - 否则读取：`import.meta.env.VITE_API_BASE`
  - 默认值：`http://localhost:8000/api`
- **说明**
  - `ENDPOINTS` 中的路径均以 `/` 开头（如 `/positions/`）。
  - axios 会将 `baseURL` 与该路径合并，最终请求形如：`{baseURL}/positions/`。

### 1.2 响应封装

- **业务响应格式（apiClient）**：`{ code, message, data }`
  - `code` 允许值：`200 | 201 | 202` 视为成功；否则抛出 `ApiError`。
  - `apiClient` **最终返回 `data` 字段本身**（即业务数据），调用处拿到的是解包后的 `data`。
- **原始响应（rawApiClient）**
  - 用于文件下载等场景（例如 `blob`），不做 `{code,message,data}` 解包。

### 1.3 超时

- 默认 `timeout=60000ms`。
- 个别接口在 `index.ts` 中单独设置更长超时（见对应接口条目）。

### 1.4 鉴权/认证

- 当前前端 `apiClient` 未见统一注入 `Authorization` 等认证头逻辑。

## 2. 一致性检查（endpoints.ts vs index.ts）

- **路径一致性**
  - `src/api/index.ts` 中调用 API **统一引用** `ENDPOINTS.*`，未发现硬编码 `"/xxx"` 或 `'/xxx'` 的 API 路径。
  - `endpoints.ts` 覆盖了 `index.ts` 中所有使用到的路径。
- **方法一致性**
  - `ENDPOINTS` 仅定义路径，不包含 HTTP method。
  - `index.ts` 中 `videoApi.updateVideo` 使用 `POST /videos/{id}/`，而 `endpoints.ts` 的注释描述为 PUT；因此**以前端 `index.ts` 的实际调用（POST）为准**。

## 3. API 清单（按模块）

### 3.0 接口统计

- 岗位管理：8 个
- 简历管理：11 个（原简历库，已扩展）
- 简历筛选：9 个
- 视频分析：4 个
- 最终推荐：3 个
- 面试辅助：7 个

**合计：42 个接口。**

### 3.1 岗位管理（`/positions/`）

#### GET `/positions/`
- **用途**
  - `positionApi.getCriteria()`：取列表后返回第一条（向后兼容）
  - `positionApi.getPositions()`：获取岗位列表
- **Query**
  - `include_resumes?: boolean`（仅 `getPositions` 里会拼接）
- **响应 data（前端期望）**
  - `{ positions: PositionData[]; total: number }`

#### POST `/positions/`
- **用途**
  - `positionApi.saveCriteria(data)`（忽略响应）
  - `positionApi.createPosition(data)`（按 `PositionData` 解析响应）
- **请求 body**
  - `PositionData` 或 `Partial<PositionData>`（视调用点）
- **响应 data（前端期望）**
  - `PositionData`（`createPosition`）或不关心

#### GET `/positions/{position_id}/`
- **Query**
  - `include_resumes: boolean`（`getPosition` 中固定拼接，默认 `true`）
- **响应 data**
  - `PositionData`

#### PUT `/positions/{position_id}/`
- **请求 body**
  - `Partial<PositionData>`
- **响应 data**
  - `PositionData`

#### DELETE `/positions/{position_id}/`
- **响应**
  - 前端不使用响应体

#### POST `/positions/{position_id}/resumes/`
- **请求 body**
  - `{ resume_data_ids: string[] }`
- **响应 data（前端期望）**
  - `{ assigned_count: number; total_resumes: number }`

#### DELETE `/positions/{position_id}/resumes/{resume_id}/`
- **响应**
  - 前端不使用响应体

#### POST `/positions/ai/generate/`
- **请求 body**
  - `{ description: string; documents?: Array<{ name: string; content: string }> }`
- **响应 data（前端期望）**
  - `PositionData`

---

### 3.2 简历管理（`/resumes/`）

> ⚠️ 数据库简化重构后，原 `/library/` 路径已迁移到 `/resumes/`。前端 `resumeApi` 为主要接口，`libraryApi` 作为兼容别名保留。

#### GET `/resumes/`
- **Query（可选）**
  - `page?: number`
  - `page_size?: number`
  - `candidate_name?: string`（原 keyword）
  - `status?: string`（新增：pending/screened/interviewing/analyzed）
  - `position_id?: string`（新增：按岗位过滤）
  - `is_assigned?: boolean`
- **响应 data（前端读取字段）**
  - `{ items: Resume[]; total: number; page: number; page_size: number }`
- **前端映射**
  - `resumeApi.getList()` 返回 `{ resumes: items, total, page, page_size }`

#### POST `/resumes/`
- **请求 body**
  - `{ resumes: Array<{ name: string; content: string; metadata?: { size?: number; type?: string } }> }`
- **响应 data（前端期望）**
  - `{ uploaded: Array<{ id: string; filename: string; candidate_name: string }>; skipped: Array<{ filename: string; reason: string }>; uploaded_count: number; skipped_count: number }`

#### GET `/resumes/{id}/`
- **响应 data**
  - `Resume`（包含 status, screening_result, position_id 等新字段）

#### PUT `/resumes/{id}/`
- **请求 body**
  - `{ candidate_name?: string; notes?: string; status?: string; position_id?: string }`
- **响应 data**
  - `Resume`

#### DELETE `/resumes/{id}/`
- **响应**
  - 前端不使用响应体

#### POST `/resumes/batch-delete/`
- **请求 body**
  - `{ resume_ids: string[] }`
- **响应 data**
  - `{ deleted_count: number }`

#### POST `/resumes/check-hash/`
- **请求 body**
  - `{ hashes: string[] }`
- **响应 data（前端期望）**
  - `{ existing_hashes: string[] }`

#### POST `/resumes/assign/`（新增）
- **用途**
  - 批量分配简历到岗位或取消分配
- **请求 body**
  - `{ resume_ids: string[]; position_id: string | null }`
- **响应 data**
  - `{ assigned_count: number; message: string }`

#### GET `/resumes/stats/`（新增）
- **用途**
  - 获取简历统计数据
- **响应 data**
  - `{ total: number; pending: number; screened: number; interviewing: number; analyzed: number; assigned: number; unassigned: number }`

#### GET `/resumes/{id}/screening/`（新增）
- **用途**
  - 获取简历的筛选结果
- **响应 data**
  - `{ screening_result: object | null; screening_report: string | null }`

#### PUT `/resumes/{id}/screening/`（新增）
- **用途**
  - 更新简历的筛选结果（通常由筛选任务调用）
- **请求 body**
  - `{ screening_result?: object; screening_report?: string }`
- **响应 data**
  - `{ id: string; status: string; screening_result: object }`

---

### 3.3 简历筛选（`/screening/`）

#### POST `/screening/`
- **请求 body**
  - `{ position: Record<string, unknown>; resumes: Array<{ name: string; content: string; metadata?: { size: number; type: string } }> }`
- **响应 data（前端期望）**
  - `ResumeScreeningTask`

#### GET `/screening/tasks/`
- **Query（可选）**
  - `status?: string`
  - `page?: number`
  - `page_size?: number`
- **响应 data（前端期望）**
  - `{ tasks: ResumeScreeningTask[]; total: number }`

#### DELETE `/screening/tasks/{task_id}/`
- **响应**
  - 前端不使用响应体

#### GET `/screening/tasks/{task_id}/status/`
- **响应 data**
  - `ResumeScreeningTask`

#### GET `/screening/reports/{report_id}/`
- **响应 data（前端读取字段）**
  - `{ report: ResumeData }`
- **前端行为**
  - `screeningApi.getResumeDetail()` 返回 `report` 字段（取不到则 `null`）

#### GET `/screening/reports/{report_id}/download/`
- **响应**
  - `blob`
- **备注**
  - 前端从 `Content-Disposition` 解析文件名，默认 `report_{id}.md`。

#### POST `/screening/videos/link/`
- **请求 body**
  - `{ resume_data_id: string; video_analysis_id: string }`
- **响应 data（前端期望）**
  - `{ resume_data_id: string; video_analysis_id: string; candidate_name: string; video_name: string }`

#### POST `/screening/videos/unlink/`
- **请求 body**
  - `{ resume_data_id: string }`
- **响应 data（前端期望）**
  - `{ resume_data_id: string; disconnected_video_id: string; candidate_name: string; video_name: string }`

#### POST `/screening/dev/generate-resumes/`
- **请求 body**
  - `{ position: { position: string; description?: string; required_skills?: string[]; optional_skills?: string[]; min_experience?: number; education?: string[] }; count: number }`
- **超时（前端）**
  - `max(120s, count * 20s + 30s)`
- **响应 data（前端期望）**
  - `{ added: Array<{ id: string; filename: string; candidate_name: string }>; skipped: Array<{ filename: string; reason: string }>; added_count: number; skipped_count: number; requested_count: number }`

---

### 3.4 视频分析（`/videos/`）

#### GET `/videos/`
- **响应 data（前端期望）**
  - `{ videos: VideoAnalysis[] }`
- **备注**
  - 前端仅使用 `videos` 字段，若响应中包含其他字段会被忽略。

#### POST `/videos/upload/`
- **Content-Type**
  - `multipart/form-data`
- **请求体（前端实际提交字段）**
  - `video_file: File`（必填）
  - `candidate_name: string`（必填）
  - `position_applied: string`（必填）
  - `resume_data_id: string`（必填）
- **响应 data（前端期望）**
  - `VideoAnalysis`

#### GET `/videos/{video_id}/status/`
- **响应 data（前端期望）**
  - `VideoAnalysis`

#### POST `/videos/{video_id}/`
- **用途**
  - `videoApi.updateVideo(videoId, data)`
- **请求 body（可选字段）**
  - `{ fraud_score?: number; neuroticism_score?: number; extraversion_score?: number; openness_score?: number; agreeableness_score?: number; conscientiousness_score?: number; summary?: string; confidence_score?: number; status?: string }`
- **响应 data（前端期望）**
  - `{ id: string; status: string; analysis_result: Record<string, unknown>; resume_data_id?: string }`
- **备注**
  - 该接口前端注释曾写为 PUT，但 `src/api/index.ts` 实际调用为 POST。

---

### 3.5 最终推荐（`/recommend/`）

#### GET `/recommend/stats/`
- **响应 data（前端期望）**
  - `{ analyzed_count: number }`

#### POST `/recommend/analysis/{resume_id}/`
- **用途**
  - `recommendApi.analyzeCandidate(resumeId)`：触发综合分析
- **请求 body**
  - `null`
- **超时（前端）**
  - `120s`
- **响应 data（前端期望）**
  - `ComprehensiveAnalysisResult`（类型定义在 `src/api/index.ts`）

#### GET `/recommend/analysis/{resume_id}/`
- **用途**
  - `recommendApi.getCandidateAnalysis(resumeId)`：获取综合分析历史
- **响应 data（前端期望）**
  - `ComprehensiveAnalysisResult | null`

---

### 3.6 面试辅助（`/interviews/`）

#### GET `/interviews/sessions/`
- **用途**
  - `interviewAssistApi.getSessionsByResumeId(resumeId)`
- **Query**
  - `resume_id: string`
- **响应 data（前端期望）**
  - `Array<{ id: string; resume_data_id: string; qa_records: Array<{ question: string; answer: string }>; final_report?: {...}; created_at: string }>`

#### POST `/interviews/sessions/`
- **请求 body**
  - `{ resume_data_id: string; job_config?: Record<string, unknown> }`
- **响应 data（前端期望）**
  - `InterviewSession`

#### GET `/interviews/sessions/{session_id}/`
- **响应 data（前端期望）**
  - `InterviewSession`

#### DELETE `/interviews/sessions/{session_id}/`
- **响应**
  - 前端不使用响应体

#### POST `/interviews/sessions/{session_id}/questions/`
- **超时（前端）**
  - `90s`
- **请求 body（可选）**
  - `{ categories?: string[]; candidate_level?: string; count_per_category?: number; focus_on_resume?: boolean; interest_point_count?: number }`
- **响应 data（前端期望）**
  - `{ question_pool: InterviewQuestion[]; resume_highlights: string[]; interest_points?: Array<{ content: string; question: string; reason?: string }> }`

#### POST `/interviews/sessions/{session_id}/qa/`
- **超时（前端）**
  - `60s`
- **请求 body**
  - `{ question: { content: string; expected_skills?: string[]; difficulty?: number }; answer: { content: string }; skip_evaluation?: boolean; followup_count?: number; alternative_count?: number }`
- **响应 data（前端期望）**
  - `{ round_number: number; evaluation: AnswerEvaluation | null; candidate_questions: CandidateQuestion[]; hr_action_hints: string[] }`

#### POST `/interviews/sessions/{session_id}/report/`
- **超时（前端）**
  - `60s`
- **请求 body（可选）**
  - `{ include_conversation_log?: boolean; hr_notes?: string }`
- **响应 data（前端期望）**
  - `{ report: InterviewReport; report_file_url: string | null }`
