# 智能数仓建设平台

## 需求分析（最高优先级）

**触发词**：需求分析 / 需求梳理 / 看看需求 / 需求文档 / 业务需求 / 指标梳理 / 数据盘点

逐项梳理，逐项确认，不跳步不猜测。

### 第一步：读取需求文档
读文档 → 概述（多少条、涉及部门）→ 确认

### 第二步：梳理系统情况
- 需求涉及多少源系统，列出清单
- 哪些已有适配器、哪些需新建
- 就绪度：A可直连 / B需开发接口 / C手工填报
→ 确认

### 第三步：梳理业务域
- 需求涉及哪些业务域
- 与 project.yml 已有域对比
- 输出：代码 + 名称 + 核心主题
→ 确认

### 第四步：梳理数据库连接
- 读 profiles.yml，列出已配置连接
- dev/hive/oceanbase/mysql → ✅/⚠️
- 能否满足需求文档的源系统
→ 确认

### 第五步：梳理数据表信息
- 从需求文档 + 数据库盘点表
- 每张表：表名、系统、字段数、数据量
- 表与业务域映射
→ 确认

### 第六步：梳理指标情况
- 提取所有业务指标
- 每个指标：名称 + 口径 + 来源表 + 字段 + 计算方式 + 粒度 + 就绪度
→ 确认

### 第七步：梳理数据逻辑
- 指标→源表→清洗规则→JOIN→输出表
- 数据流 ODS→DWD→DWS→ADS
→ 确认

### 第八步：汇总报告
生成 `output/designs/<项目>_需求分析报告.md`，包含：
- 系统清单、业务域划分、指标目录、表清单、数据流、实施建议、风险评估

更新 `output/designs/CHANGELOG.md`

---

## 准备阶段

按顺序执行以下检查，每步报结果：

### 1. 项目配置
读 `project.yml`，输出：
- 项目名、描述
- 源系统适配器类型
- 已定义的业务域（数量 + 列表）
- 已定义的业务场景（数量 + 列表）

### 2. 数据库连接
读 `profiles.yml`，逐个检查：
- dev (DuckDB) — 本地文件是否存在
- hive — host:port 是否配置
- oceanbase — host:port 是否配置
- 标记 ✅ 已配置 / ⚠️ 未配置

### 3. 项目模型
执行 `dbt-platform scan`，输出模型数和宏数

### 4. Agent 进度
执行 `dbt-platform agent list`，统计：
- completed / pending / failed 各多少
- 哪些 Agent 可以立即执行（依赖已满足）
- 哪些 Agent 被阻塞（缺什么依赖）

### 5. dbt 编译
执行 `.venv/Scripts/dbt parse`，报通过或失败

### 6. 汇总建议
一句话总结当前状态，给出明确的下一步建议。

输出格式：

> ## 项目状态报告
> - 项目：XX | 源系统：SAP ECC
> - 连接：dev ✅ · hive ⚠️ · oceanbase ⚠️
> - 模型：0 · 宏：10
> - Agent：3/8 完成 · 5 待执行
> - 编译：✅ 通过
> - 建议：先配 hive 连接，然后 "帮我开始 DWD 开发"

---

## 项目选择

**触发词**：选择项目 / 有哪些项目 / 项目列表 / 选XX / 切到XX / 看看XX项目

### 列出项目
当用户说"有哪些项目""项目列表"时：
执行 `dbt-platform project list`，列出所有项目，标注 * 当前活跃。

### 选择并查看项目
当用户说"选择XX""看看XX项目"时：
1. 执行 `dbt-platform project switch XX`
2. 然后自动走准备阶段：读 project.yml → scan → agent list → 汇总

输出：
> 已切换到 XX项目。类型：XX | 模型：XX | Agent：X/8 | 编译：通过

### 回到默认项目
当用户说"回来""回到默认""切回主项目"时：
执行 `dbt-platform project switch .`

---

当用户提到以下任一关键词时，自动调用对应功能：

## 项目扫描

**触发词**：扫描、盘点、看看项目、有什么、模型数、宏

执行：`dbt-platform scan` 或 `dbt-platform scan --json`

## 代码生成

**触发词**：生成 DWD、生成代码、建模型、清洗、dwd

执行：先问清表名和字段，然后 `dbt-platform dwd generate --table xxx --columns "field:type,..."`

## Agent 执行

**触发词**：执行 Agent、跑 agent、agent pipeline、DWD 开发、DWS 开发、ADS 开发

执行：
- 查看状态 `dbt-platform agent list`
- 执行单个 `dbt-platform agent run <agent-id> --domain <域> --target dev`
- 管道执行 `dbt-platform agent pipeline --target dev`

## BI 看板（设计优先，禁止直接生成）

**触发词**：看板 / BI / 大屏 / 报表 / 驾驶舱 / 图表 / 可视化 / 数据展示

⚠️ 用户说"生成看板"时，禁止直接跑 `bi generate`。必须先完成四步设计确认。

### 第一步：指标分析
和用户确认：
- 看板名称和用途
- 展示哪些业务指标（逐个列出）
- 每个指标的计算口径（SUM/COUNT/AVG/MAX）
- 数据粒度（按天/月/年/累计）

输出示例：
> 收入执行看板 — 4 个指标：
> 1. 月度收入总额 (SUM) — 按月
> 2. 收入达成率 (实际/预算) — 按产品线
> 3. 同比增速 — 按产品线
> 4. 收入排名 TOP10 — 按客户

### 第二步：数据来源
检查每个指标的数据来源：
- 对应 ADS 表的表名和字段名
- 如果 ADS 表不存在 → 标注"需先开发 ADS"
- 列出完整的 SQL 映射：`表名.字段名 → 聚合方式 → 指标名`

输出示例：
> 数据来源：
> - ads_fi_revenue_summary.revenue_amount → SUM → 月度收入总额
> - ads_fi_revenue_summary.budget_amount → SUM → 预算金额
> - ads_fi_revenue_summary.product_line → GROUP BY → 产品线维度
> ⚠️ ads_fi_revenue_summary 不存在，需先执行 agent-06

### 第三步：样式设计
和用户确认每个指标的展示方式：
- KPI 卡片 — 单个大数字（收入总额、达成率）
- 折线图 — 趋势（月度收入走势）
- 柱状图 — 对比（产品线收入对比）
- 饼图 — 占比（客户收入占比）
- 表格 — 明细（TOP10 排名）
- 布局：几行几列

### 第四步：逻辑与交互
- 是否需要时间筛选器（默认近12个月）？
- 是否需要业务域切换？
- 是否需要下钻（点击柱状图看明细）？
- 刷新频率（静态/每次打开刷新）？

### 第五步：确认并生成

四步确认后：

1. 如果 ADS 表缺失：
   ```
   dbt-platform agent run agent-06 --domain <域> --target dev
   ```
   等 ADS 表建好后再继续。

2. 写设计文档（必须！）：
   ```
   写入 output/designs/<看板名>_设计文档.md
   ```
   包含：需求概述、指标定义、数据来源、样式设计、交互逻辑、版本记录

3. 写看板配置文件：
   ```
   写入 config/bi_dashboards/<看板名>.yml
   ```

4. 生成 HTML：
   ```
   dbt-platform bi generate --config config/bi_dashboards/<看板名>.yml
   ```

5. 告知输出：
   ```
   设计文档：output/designs/<看板名>_设计文档.md
   看板文件：output/bi/<看板名>_v1_时间戳.html
   ```

6. 更新变更记录：
   ```
   追加到 output/designs/CHANGELOG.md
   ```

目录结构：

```
output/
├── designs/                  ← 设计文档（每看板一份 MD）
│   └── CHANGELOG.md          ← 所有变更汇总
└── bi/                       ← 看板 HTML（按版本命名）
```

设计文档是后续修改和回溯的依据，不可跳过。

---

## 文档输出（设计优先，统一归档）

**原则**：所有文档产出——指标逻辑、数据设计、架构方案、验收报告——必须先确认骨架，再填充内容，归档到 `output/designs/`，版本可追溯。

### 触发词
写文档 / 出报告 / 整理指标 / 数据逻辑 / 设计方案 / 架构说明

### 流程

**第一步：画骨架**
和用户确认目录大纲。不写正文，先列一二三级标题。

**第二步：对关键内容**
每节的核心指标、数据来源、结论——有分歧先对齐。

**第三步：生成**
写入 `output/designs/<文档名>.md`，按确认的骨架逐节填充。

**第四步：记录**
追加 `output/designs/CHANGELOG.md`：文档名 + 日期 + 变更摘要。

### 文档分类

| 类型 | 文件名 | 示例 |
|------|------|------|
| 指标口�� | `<域>_指标口径定义.md` | `FI域_指标口径定义.md` |
| 数据设计 | `<层>_<表名>_设计文档.md` | `DWS层_收入宽表_设计文档.md` |
| 架构方案 | `<主题>_技术方案.md` | `多源接入_技术方案.md` |
| BI 看板 | `<看板名>_设计文档.md` | `收入执行大屏_设计文档.md` |
| 验收报告 | `验收_<类型>_<日期>.md` | `验收_跨库对比_20260705.md` |

### 统一目录

```
output/designs/
├── FI域_指标口径定义.md
├── DWS层_收入宽表_设计文档.md
├── 收入执行大屏_设计文档.md
├── 验收_跨库对比_20260705.md
└── CHANGELOG.md
```

---

当用户提到以下任一关键词时，自动调用对应功能：

## 数据验证

**触发词**：验证、对比、跨库、两边一致吗、数据质量

执行：`dbt-platform validate`

## 场景执行

**触发词**：跑场景、执行场景、上生产、dev 验证

执行：`dbt-platform run <场景名> --target dev` 或 `--target hive`

## 项目管理

**触发词**：切换项目、换项目、新建项目、项目列表

执行：
- 列出 `dbt-platform project list`
- 切换 `dbt-platform project switch <名称>`
- 新建 `dbt-platform init <名称> --adapter <类型>`

## 代码验证

**触发词**：验证语法、parse、编译、能跑吗

执行：`.venv/Scripts/dbt parse`，如果有模型文件改动

## 本地测试

**触发词**：本地测试、dev 跑一下、试试

执行：`.venv/Scripts/dbt run --target dev`，跑完报结果

## 生产执行

**触发词**：上生产、跑 hive、正式执行

⚠️ 先确认用户意图，得到明确确认后执行：`.venv/Scripts/dbt run --target hive`
