# Agent 体系说明

本目录包含智能数仓建设平台的 8 个 AI Agent 定义。

## 双真源策略

| 真源 | 位置 | 用途 |
|------|------|------|
| AI 执行真源 | `.claude/agents/*.md` | 被 AgentRunner 加载 |
| UI 展示真源 | `platform/src/data/agents.js` | 前端面板展示 |

## Agent 依赖图

```
Agent 0 (规范制定)
  → Agent 1 (场景分析)
    → Agent 2 (ODS搭建)
      → Agent 3 (DWD开发)
        → Agent 4 (DWS开发)
        → Agent 5 (DIM设计)
          → Agent 6 (ADS开发)
            → Agent 7 (OB迁移验证)
```

## 文件格式

每个 .md 文件: YAML frontmatter（元数据/合同/约束）+ Markdown body（系统提示词）

## 独立调用

```bash
dbt-platform agent list
dbt-platform agent show agent-03
dbt-platform agent run agent-03 --domain fi
dbt-platform agent pipeline --dry-run
```
