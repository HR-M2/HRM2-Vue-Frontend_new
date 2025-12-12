/**
 * API 配置模块
 * 
 * 配置 axios 实例和统一的响应拦截器，处理 {code, message, data} 格式的响应。
 */
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

/**
 * 获取 API 基础路径
 * 优先从 localStorage 读取用户设置，否则使用环境变量
 */
export const getApiBase = (): string => {
  try {
    const savedSettings = localStorage.getItem('apiSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      if (settings.baseUrl) return settings.baseUrl
    }
  } catch {
    // 忽略解析错误
  }
  return import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api'
}

let API_BASE = getApiBase()

/**
 * 更新 API 基础路径
 * 供设置页面调用
 */
export const updateApiBase = (): void => {
  API_BASE = getApiBase()
  apiClient.defaults.baseURL = API_BASE
}

// 监听 storage 变化，动态更新 API_BASE
if (typeof window !== 'undefined') {
  window.addEventListener('storage', updateApiBase)
}

/**
 * 统一 API 响应格式
 */
export interface ApiResponseFormat<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * 分页响应数据格式
 */
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 创建 axios 实例
 */
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 * 确保每次请求使用最新的 baseURL
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 动态更新 baseURL，以支持用户在运行时修改 API 地址
    config.baseURL = getApiBase()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 统一处理 {code, message, data} 格式的响应
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponseFormat>) => {
    const { code, message, data } = response.data
    
    // 业务错误（code 不在成功范围内）
    // 200: OK, 201: Created, 202: Accepted
    if (![200, 201, 202].includes(code)) {
      console.error('API Business Error:', { code, message, data })
      return Promise.reject(new ApiError(code, message, data))
    }
    
    // 成功响应，直接返回 data 部分
    return data as unknown as AxiosResponse
  },
  (error) => {
    // 网络错误或服务器错误
    const code = error.response?.status || 500
    const message = error.response?.data?.message || error.message || '网络请求失败'
    console.error('API Network Error:', { code, message, error })
    return Promise.reject(new ApiError(code, message))
  }
)

/**
 * 用于不需要响应拦截处理的原始请求（如文件下载）
 */
export const rawApiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000
})

rawApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBase()
    return config
  }
)
