# 智能数仓建设平台 — dbt Agent Platform

> 多 Agent 集群驱动的 dbt 数据仓库智能建设工具  
> Electron + React 桌面应用 · Apple Design System

## 产品介绍

智能数仓建设平台是将《多 Agent 集群智能数仓建设方案》落地为可运行的桌面产品。通过将数仓建设全流程分解为 **8 个智能 Agent**，每个 Agent 聚焦特定层级的开发任务，Agent 间通过明确的输入/输出契约形成依赖 DAG，由 **LLM（Claude Code CLI）+ MCP 工具调用 + dbt 标准化宏体系** 联合驱动。

## 核心功能

- **项目总览** — KPI 仪表盘、5 层架构图、Agent 管道状态、数据库连接监控
- **智能对话** — 直接启动 Claude Code CLI 进行 AI 辅助数仓开发，自动注入项目上下文
- **Agent 集群** — 8 Agent DAG 可视化、详情面板（LLM 能力/MCP 工具/产出物）
- **模型浏览** — 71 个 DWD 模型按 6 个业务域浏览，SQL 源码查看，schema 文档
- **数据源 & 宏** — 74 张 ODS 源表清单、8 个标准宏函数库、数据库连接管理
- **流水线执行** — dbt parse/run/test/docs 一键执行，Agent 管道自动编排
- **运行监控** — 实时日志、Agent 状态跟踪、系统资源监控

## 技术栈

| 组件 | 技术 |
|------|------|
| 桌面框架 | Electron 35 |
| 前端 | React 18 + Vite 6 |
| 数据图表 | Recharts |
| AI 引擎 | Claude Code CLI (spawn 子进程通信) |
| 数仓引擎 | dbt-core 1.11.9 (DuckDB / Hive / OceanBase) |
| 设计语言 | Apple Design System (SF Pro / 毛玻璃 / 圆角卡片) |

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动应用
npm run dev

# 或者双击 start.bat
```

Electron 窗口将自动打开，Vite 开发服务器运行在 `localhost:5173`。

## 页面导航

| 页面 | 图标 | 功能 |
|------|------|------|
| 项目总览 | ◈ | KPI 仪表盘、架构图、管道状态 |
| 智能对话 | ▶ | Claude Code CLI 对话（需安装 Claude Code） |
| Agent 集群 | ⬡ | 8 Agent DAG 可视化、详情面板 |
| 模型浏览 | ▣ | DWD 模型查看、SQL 源码、schema 文档 |
| 数据源 & 宏 | ◇ | ODS 源表清单、宏函数库、连接管理 |
| 流水线执行 | ◆ | dbt 命令 + Agent 管道执行 |
| 运行监控 | ▤ | 实时日志、状态跟踪 |

## Agent 架构

```
Agent 0 (规范制定) → 全局规范
     ↓
Agent 1 (场景分析) → 5 个子 Agent 并行设计
     ↓
Agent 2 (ODS 搭建) → sources.yml 配置
     ↓
Agent 3 (DWD 开发) → 71 个清洗模型
     ↓
┌────────┴────────┐
↓                 ↓
Agent 4 (DWS)  Agent 5 (DIM)
     ↓                 ↓
└────────┬────────┘
         ↓
    Agent 6 (ADS) → BI 视图
         ↓
    Agent 7 (迁移验证) → OceanBase
```

## 项目目录

```
platform/
├── electron/main.js        # Electron 主进程（Claude CLI spawn, dbt exec, IPC）
├── electron/preload.js     # IPC 桥接
├── src/
│   ├── App.jsx             # 根组件（路由 + 状态）
│   ├── App.css             # Apple Design System 样式
│   ├── data/agents.js      # 8 Agent 定义 + 域/连接/快捷指令数据
│   ├── services/           # 项目扫描器 + 管道引擎
│   └── components/         # 7 个页面组件 + Sidebar
├── package.json
├── vite.config.js
├── start.bat               # 一键启动
└── README.md               # 本文档
```

## 系统要求

- Windows 10/11
- Node.js 18+
- Claude Code CLI（可选，用于智能对话功能）
- dbt 项目（已配置在 `C:\Users\诗写\Desktop\dbt_warehouse`）

## 版本

v1.0.0 — 2026-05-27
