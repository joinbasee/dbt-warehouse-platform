# 智能数仓建设平台

用 Claude Code 对话来建数据仓库。

---

## 快速开始

### 1. 安装

```bash
pip install -e .
```

### 2. 配置

编辑 `project.yml` — 填源系统、业务域、场景。
编辑 `profiles.yml` — 填数据库地址和密码。

### 3. 开始

```bash
claude
```

---

## CLI 命令

### 项目管理

```bash
dbt-platform project list              # 列出所有项目
dbt-platform project current           # 当前项目
dbt-platform project switch <名称>     # 切换项目
dbt-platform init <名称> --adapter sap_ecc  # 创建新项目
```

### 项目扫描

```bash
dbt-platform scan                      # 模型数、宏数
dbt-platform scan --json               # JSON 格式
```

### DWD 代码生成

```bash
dbt-platform dwd generate --table vbrk --columns "erdat:date,netwr:decimal"
dbt-platform dwd generate --table vbrk --columns "..." --output models/dwd/order/dwd_order_vbrk.sql
dbt-platform dwd preview --table vbrk
```

列类型：`string` `date` `decimal` `flag`

### Agent 管理

```bash
dbt-platform agent list                # 8 个 Agent 及状态
dbt-platform agent show agent-03       # Agent 详情
dbt-platform agent status              # 执行状态
dbt-platform agent run agent-03 --domain fi --target dev
dbt-platform agent pipeline --dry-run  # 打印执行计划
```

### 场景执行

```bash
dbt-platform run <场景> --target dev
dbt-platform run <场景> --target hive
dbt-platform run <场景> --dry-run
```

### 数据验证

```bash
dbt-platform validate
```

### BI 看板

```bash
dbt-platform bi list
dbt-platform bi generate --config config/bi_dashboards/开票明细.yml
dbt-platform bi generate-all --target hive
```

看板 HTML 输出到 `output/bi/`。

### 查看配置

```bash
dbt-platform list
```

---

## 目录结构

```
├── project.yml              ← 项目配置
├── dbt_project.yml          ← dbt 配置
├── profiles.yml             ← 数据库连接
├── models/                  ← SQL 模型 (dwd/dws/dim/ads)
├── macros/                  ← Jinja 宏
├── config/                  ← BI 看板配置
├── output/                  ← BI HTML 输出
├── projects/                ← 其他项目
├── dbt_platform/            ← 引擎
├── .claude/                 ← Claude Code 配置
├── platform/electron/       ← 监控面板
└── pyproject.toml
```

---

## 标准工作流

```bash
claude

# "帮我在 project.yml 里加 fi 财务域"
# "盘点 dmp_ods 里 fi 相关的表"
# "生成每张表的 DWD 清洗 SQL 到 models/dwd/fi/"
# "跑 dbt parse 验证，然后 dbt run --target dev 本地测试"
# "本地验证通过后，dbt run --target hive 上生产"
```

---

## 8 个 Agent

| Agent | 职责 | 状态 |
|------|------|------|
| agent-00 | 规范制定 | completed |
| agent-01 | 场景分析 | completed |
| agent-02 | ODS 搭建 | completed |
| agent-03 | DWD 开发 | completed |
| agent-04 | DWS 开发 | pending |
| agent-05 | DIM 设计 | pending |
| agent-06 | ADS 开发 | pending |
| agent-07 | OceanBase 迁移验证 | pending |

执行顺序：00 → 01 → 02 → 03 → 04 → 06 → 07 ／ 03 → 05

---

## 依赖

- Python ≥ 3.10
- dbt-core、dbt-duckdb、dbt-spark
- Claude Code（AI 辅助，可选）
