# HRM2 招聘管理系统前端（Vue 版）

本项目是 HRM2 招聘管理系统的前端界面，基于 **Vue 3 + Vite + TypeScript + Element Plus** 实现，主要用于配合后端（Django）完成招聘流程的可视化管理与操作。

## 项目结构

```text
HRM2-Vue-Frontend_new/
  ├─ package.json            # 前端项目依赖与脚本
  ├─ vite.config.ts          # Vite 构建配置
  ├─ tsconfig*.json          # TypeScript 配置
  ├─ index.html              # 应用入口 HTML
  ├─ public/                 # 不经打包的静态资源
  └─ src/                    # 主要源代码目录
      ├─ main.ts             # Vue 应用入口，挂载 App.vue，注册路由、Pinia、Element Plus
      ├─ App.vue             # 根组件，承载主布局
      ├─ router/             # 前端路由配置（如仪表盘、岗位设置、简历库等）
      │   └─ index.ts
      ├─ api/                # 与后端交互的 API 封装（axios 请求）
      │   └─ index.ts
      ├─ stores/             # Pinia 状态管理（全局状态、配置等）
      ├─ types/              # TypeScript 类型定义（岗位、简历、任务等业务类型）
      ├─ utils/              # 通用工具函数（预留/复用逻辑）
      ├─ assets/             # 全局样式与静态资源（如 main.css）
      ├─ components/         # 复用组件，按业务模块拆分
      │   ├─ layout/         # 布局相关组件（侧边栏、顶部栏、主布局）
      │   ├─ common/         # 通用组件（岗位列表等在多页复用的组件）
      │   ├─ positions/      # 岗位设置页相关组件
      │   ├─ library/        # 简历库相关组件（上传、详情对话框等）
      │   ├─ screening/      # 简历筛选流程组件（上传区、任务队列、历史任务等）
      │   ├─ video/          # 视频分析相关组件（候选人列表、上传对话框等）
      │   ├─ interview/      # 面试辅助相关组件（问题列表、候选人选择等）
      │   ├─ recommend/      # 最终推荐结果展示与控制组件
      │   └─ dev-tools/      # 开发测试工具组件（如随机简历生成器）
      ├─ composables/        # 组合式函数（业务逻辑拆分）
      │   ├─ usePositionEditor.ts      # 岗位信息编辑与保存逻辑
      │   ├─ usePositionManagement.ts  # 岗位及岗位-简历关系管理
      │   ├─ useResumeLibrary.ts       # 简历库查询、分页、上传、删除等
      │   ├─ useResumeUpload.ts        # 筛选页上传文件与任务提交
      │   ├─ useHistoryTasks.ts        # 筛选任务历史查询与分页
      │   ├─ useTaskPolling.ts         # 筛选任务轮询与队列管理
      │   ├─ useVideoUpload.ts         # 视频文件上传逻辑
      │   ├─ useInterviewQuestions.ts  # 面试题生成、评分与报告导出
      │   ├─ useRecommendAnalysis.ts   # 最终推荐分析任务管理与进度
      │   ├─ useResumeDetail.ts        # 简历详情预览、报告下载等
      │   ├─ useResumeAssignment.ts    # 简历与岗位分配/移除逻辑
      │   ├─ useScreeningUtils.ts      # 筛选流程相关通用工具
      │   ├─ useFileParser.ts          # 本地文件解析（如简历文本解析）
      │   └─ useLibraryFileParser.ts   # 简历库中简历内容解析
      └─ views/             # 页面级组件，对应路由
          ├─ DashboardView.vue        # 仪表盘
          ├─ PositionsView.vue        # 岗位设置
          ├─ ResumeLibraryView.vue    # 简历库
          ├─ ScreeningView.vue        # 简历初筛系统
          ├─ VideoView.vue            # 视频分析页面
          ├─ InterviewView.vue        # 面试辅助页面
          ├─ RecommendView.vue        # 最终录用推荐页面
          ├─ DevToolsView.vue         # 开发测试工具页面
          ├─ SettingsView.vue         # 系统设置页面
          └─ HomeView.vue             # 预留/通用首页
```

## 功能概览

- **仪表盘**：
  - 展示整体招聘数据概况、最近筛选任务、岗位及候选人相关统计
  - 提供常用操作的快捷入口

- **岗位设置**：
  - 管理招聘岗位列表
  - 配置岗位的基础信息与筛选标准

- **简历库**：
  - 上传、管理候选人简历
  - 支持按关键字、筛选状态、分配状态等维度查询

- **简历筛选**：
  - 通过上传简历触发后端 AI 初筛任务
  - 查看任务处理队列与历史任务
  - 支持将简历分配到不同岗位

- **视频分析（功能待补全）**：
  - 规划用于上传候选人视频并进行 AI 分析
  - 当前页面结构和交互已搭建，部分后端分析逻辑仍在完善中

- **面试辅助系统（功能待补全）**：
  - 规划用于基于岗位和候选人简历自动生成面试问题
  - 记录候选人回答和评分，生成面试总结报告
  - 部分 AI 相关逻辑仍在完善中

- **最终录用推荐系统（功能待补全）**：
  - 规划根据多维度评分结果（初筛、视频分析、面试等）综合给出录用建议
  - 当前已有基础页面与任务管理逻辑，实际推荐策略仍在迭代

- **开发测试工具**：
  - 提供开发环境下的测试数据生成工具（如随机简历生成）
  - 仅建议在开发环境启用

- **系统设置**：
  - 配置后端 API 地址、超时时间等
  - 设置自动刷新、通知、语言等系统偏好
  - 提供数据导入导出、本地缓存清理等能力

## 界面截图

> 注：以下截图均位于当前项目的 `info_images` 目录下，可根据需要在文档或其他地方复用。

- **仪表盘**

  ![仪表盘](./info_images/%E4%BB%AA%E8%A1%A8%E7%9B%98.png)

- **岗位设置**

  ![岗位设置](./info_images/%E5%B2%97%E4%BD%8D%E8%AE%BE%E7%BD%AE.png)

- **简历库**

  ![简历库](./info_images/%E7%AE%80%E5%8E%86%E5%BA%93.png)

- **简历筛选**

  ![简历筛选](./info_images/%E7%AE%80%E5%8E%86%E7%AD%9B%E9%80%89.png)

- **视频分析（功能待补全）**

  ![视频分析（功能待补全）](./info_images/%E8%A7%86%E9%A2%91%E5%88%86%E6%9E%90%EF%BC%88%E5%8A%9F%E8%83%BD%E5%BE%85%E8%A1%A5%E5%85%A8%EF%BC%89.png)

- **面试辅助系统（功能待补全）**

  ![面试辅助系统（功能待补全）](./info_images/%E9%9D%A2%E8%AF%95%E8%BE%85%E5%8A%A9%E7%B3%BB%E7%BB%9F%EF%BC%88%E5%8A%9F%E8%83%BD%E5%BE%85%E8%A1%A5%E5%85%A8%EF%BC%89.png)

- **最终录用推荐系统（功能待补全）**

  ![最终录用推荐系统（功能待补全）](./info_images/%E6%9C%80%E7%BB%88%E5%BD%95%E7%94%A8%E6%8E%A8%E8%8D%90%E7%B3%BB%E7%BB%9F%EF%BC%88%E5%8A%9F%E8%83%BD%E5%BE%85%E8%A1%A5%E5%85%A8%EF%BC%89.png)

- **开发测试工具**

  ![开发测试工具](./info_images/%E5%BC%80%E5%8F%91%E6%B5%8B%E8%AF%95%E5%B7%A5%E5%85%B7.png)
