# CLAUDE.md — 智能数仓建设平台

> 本文件约束 Claude Code 在本项目中的工作方式。
> 通用宪法来源：[gitee.com/sliver-ring_admin/skills](https://gitee.com/sliver-ring_admin/skills)

## 项目标识

- **PROJECT**: 智能数仓建设平台 — 通用数据仓库建设系统
- **当前示例**: PEP企业数据仓库 (人教社 SAP ECC → Hive + OceanBase)
- **目标**: 源系统适配 → dbt 自动化数仓建设 → BI 消费
- **技术栈**: dbt-core 1.11.9, Hive (Spark Thrift), OceanBase (obmysql), DuckDB (dev)
- **语言**: SQL (多方言), Python 3 (Jinja2 宏), JavaScript (Electron 平台 UI)
- **语言要求**: 任何时候使用中文，除非用户明确要求英文输出

## 技能触发

用户说以下关键词时，自动调用对应功能。不用等用户说完整的命令，听懂意图就执行。

### 需求分析（最高优先级）

**触发词**：分析需求 / 需求梳理 / 看看需求 / 需求文档 / 业务需求 / 指标梳理 / 数据盘点

逐项梳理，逐项确认，不跳步、不猜测、不一次全输出。

**第一步：读取需求文档**
读文档 → 一句话概述（多少条需求、涉及哪些部门）→ 确认

**第二步：梳理系统情况**
需求涉及多少源系统 → 哪些已有适配器 → 系统就绪度（A可直连/B需开发/C手工）→ 确认

**第三步：梳理业务域**
需求涉及哪些域 → 和 project.yml 对比 → 输出域列表（代码+名称+主题）→ 确认

**第四步：梳理数据库连接**
读 profiles.yml → 已配置连接 → 哪些可用哪些缺失 → 确认

**第五步：梳理数据表信息**
盘点需求涉及的表（表名、系统、字段数、数据量）→ 表与域的映射 → 确认

**第六步：梳理指标情况**
从需求文档提取所有指标 → 名称+口径+来源表+来源字段+计算方式+粒度+就绪度 → 确认

**第七步：梳理数据逻辑**
指标→源表→清洗→JOIN→输出 → 数据流 ODS→DWD→DWS→ADS → 确认

**第八步：汇总报告**
所有确认后，生成报告：

```
output/designs/<项目>_需求分析报告.md
```

包含：系统清单、业务域划分、指标目录、表清单、数据流、实施建议、风险评估

### 准备阶段

**触发词**：准备 / 准备阶段 / 检查环境 / 准备好了吗 / 状态检查 / 连得上吗

按顺序执行：

1. 读 `project.yml` → 报项目名、源系统、业务域数、场景数
2. 读 `profiles.yml` → 报当前 target、可用连接
3. `dbt-platform scan` → 报模型数、宏数
4. `dbt-platform agent list` → 报 Agent 进度（几个完成、几个待执行）
5. `.venv/Scripts/dbt parse` → 报编译是否通过
6. 汇总：一句话说当前项目状态，哪些能做、哪些要先补

输出格式：

> 项目：XX数据仓库 | 源系统：SAP ECC
> 连接：dev ✅ DuckDB · hive ⚠️ 未配置
> 模型：0 个 · 宏：10 个
> Agent：3 完成 / 5 待执行
> 编译：✅ 通过
> 下一步建议：先配置 hive 连接，然后从 DWD 开发开始

### 项目选择

| 用户说的 | 调什么 |
|------|------|
| 选择项目 / 有哪些项目 / 项目列表 / 切换项目 | `dbt-platform project list` → 列出所有项目，标注当前活跃 |
| 选择XX项目 / 看看XX / XX项目怎么样 | `dbt-platform project switch XX` → 切换后 `dbt-platform scan` + `dbt-platform agent list` → 报该项目完整状态 |

选完项目后自动进准备阶段，输出该项目完整状态报告。

### 常用命令

| 用户说的 | 调什么 |
|------|------|
| 扫描 / 盘点 / 看看项目 / 有什么 | `dbt-platform scan` |
| 生成 DWD / 生成代码 / 建表 / 清洗 | `dbt-platform dwd generate --table <表> --columns "..."` |
| 执行 Agent / 跑 agent / DWD开发 / DWS开发 | `dbt-platform agent run <agent-id> --domain <域> --target dev` |
| Agent 状态 / 有哪些 agent | `dbt-platform agent list` |
| 跑管道 / pipeline / 一键执行 | `dbt-platform agent pipeline --target dev` |
| 看板 / BI / 图表 / 可视化 | 走 BI 设计流程（见下方 BI 设计规范） |
| 大屏 / 报表 / 驾驶舱 | 同上，走 BI 设计流程 |

### BI 设计规范

当用户提到看板、大屏、报表、图表、可视化等需求时，**禁止直接生成**。必须先完成设计确认。

**第一步：指标分析**
- 这个看板要展示什么业务指标？
- 每个指标的计算口径是什么？
- 数据粒度（日/月/年）？

**第二步：数据来源**
- 指标对应哪个 ADS 表？哪个字段？
- ADS 表是否存在？如果不存在，需要先走 agent-06 ADS开发
- 列出表名 + 字段名 + 聚合方式

**第三步：样式设计**
- 每个指标用什么图表类型（KPI卡片/折线图/柱状图/饼图/表格）？
- 布局方案（几行几列）？
- 配色偏好？

**第四步：逻辑与交互**
- 是否需要筛选器（日期范围/业务域）？
- 是否有下钻需求？
- 刷新频率？

以上四步和用户逐一确认后：

**第五步：生成并归档**

1. 如 ADS 表缺失 → `dbt-platform agent run agent-06 --domain <域> --target dev`
2. 写设计文档 → `output/designs/<看板名>_设计文档.md`（模板见下）
3. 写看板配置 → `config/bi_dashboards/<看板名>.yml`
4. 生成 HTML → `dbt-platform bi generate --config config/bi_dashboards/<看板名>.yml`
5. 输出看板 → `output/bi/<看板名>_v1_时间戳.html`
6. 更新变更记录 → `output/designs/CHANGELOG.md`

### 设计文档模板

每个看板必须在 `output/designs/` 下生成一份设计文档，包含：

```markdown
# <看板名> — 设计文档

## 需求概述
- 业务场景：
- 目标用户：
- 创建日期：YYYY-MM-DD
- 版本：v1

## 指标定义
| 指标 | 计算口径 | 数据粒度 | 来源表 | 来源字段 |
|------|------|------|------|------|

## 数据来源
- ADS 表：
- 关键字段：
- 数据刷新：

## 样式设计
- 布局方案：
- 图表类型及用途：
- 配色：

## 交互逻辑
- 筛选器：
- 下钻：
- 刷新：

## 版本记录
| 版本 | 日期 | 变更内容 | 看板文件 |
|------|------|------|------|
| v1 | YYYY-MM-DD | 初始版本 | output/bi/xxx_v1_xxx.html |
```

### 目录结构

```
output/
├── designs/                  ← 设计文档（MD，版本控制）
│   ├── 收入执行大屏_设计文档.md
│   ├── 开票明细_设计文档.md
│   └── CHANGELOG.md          ← 所有看板的变更汇总
└── bi/                       ← 生成的看板（HTML）
    ├── 收入执行大屏_v1_20260705.html
    └── 收入执行大屏_v2_20260712.html
```

后续修改看板时，更新设计文档 + 生成新版本 HTML，CHANGELOG 记录变更。保证每一步都有依据、可追溯、可回滚。

| 用户说的 | 调什么 |
|------|------|
| 扫描 / 盘点 / 看看项目 / 有什么 | `dbt-platform scan` |
| 验证数据 / 跨库对比 / 两边一致吗 | `dbt-platform validate` |
| 跑场景 / 执行场景 / 上生产 | `dbt-platform run <场景> --target hive` |
| 切换项目 / 换项目 | `dbt-platform project switch <名称>` |
| 新建项目 / 初始化 | `dbt-platform init <名称> --adapter <类型>` |
| parse / 编译 / 语法检查 | `.venv/Scripts/dbt parse` |
| dev 跑 / 本地测试 / 跑一下试试 | `.venv/Scripts/dbt run --target dev` |
| 上生产 / 跑 hive | `.venv/Scripts/dbt run --target hive`（先确认！） |

每个命令执行前先从 `project.yml` 读取当前项目配置。执行后直接汇报结果，不要问"要不要执行"——用户已经表达了意图。

## 文档输出规范

所有文档（指标逻辑、数据设计、架构方案、验收报告等）遵循同一原则：**先确认骨架，再填充内容，归档到正确位置**。

### 触发词

| 用户说的 | 处理方式 |
|------|------|
| 写文档 / 出报告 / 整理指标 / 数据逻辑 / 设计方案 | 走文档设计流程 |

### 文档设计流程

**第一步：确认骨架**
先和用户确认文档结构（一级标题、二级标题），列出目录大纲。用户确认后再往下。

**第二步：确认关键内容**
每一节的核心观点、数据来源、结论。有分歧的先对齐，不跳过。

**第三步：生成文档**
按确认的骨架写入 `output/designs/<文档名>.md`。

**第四步：版本记录**
追加到 `output/designs/CHANGELOG.md`。

### 文档分类与存放

| 文档类型 | 目录 | 示例 |
|------|------|------|
| 指标逻辑 | `output/designs/` | `FI域_指标口径定义.md` |
| 数据设计 | `output/designs/` | `DWS层_收入宽表_设计文档.md` |
| 架构方案 | `output/designs/` | `多源接入_技术方案.md` |
| BI 看板 | `output/designs/` | `收入执行大屏_设计文档.md` |
| 验收报告 | `output/designs/` | `跨库验证_20260705.md` |
| 变更记录 | `output/designs/` | `CHANGELOG.md` |

### 文档骨架模板

```markdown
# <文档标题>

## 1. 背景与目标
## 2. 核心内容（指标/逻辑/设计）
## 3. 数据来源
## 4. 方案对比（如有）
## 5. 结论与建议
## 6. 版本记录
```

用户说"写XX文档"时，先画骨架，确认→填充→归档。不问用户"要不要写文档"，直接走流程。

## 真源入口

- **TRUTH**: `project.yml` — 项目配置单真源（名称/源系统/域/场景/分层）
- **引擎层**: `engine/` — 零业务耦合的通用引擎（适配器/生成器/验证器/编排器）
- **配置真源**: `dbt_project.yml`, `profiles.yml` (git-ignored), `models/sources.yml`
- **PEP 示例**: `examples/pep/` — PEP 项目专属文档、设计、验收数据
- **平台代码**: `platform/` (Electron + Vite 智能数据平台)
- **产品文档**: `docs/产品介绍报告.md`

## 产品边界

- **BOUNDARY-goal**:
  - 5 层数据流: ODS → DWD → DWS → DIM → ADS → FineReport BI
  - 5 个业务场景按序推进: 01 开票明细, 02 收入执行, 03 表单报表, 04 应收, 05 选题模块
  - 6 大业务域: ztppm(选题/编辑), order(订单), fi(财务), md(主数据), stock(库存), ztsd(销售定制)
- **BOUNDARY-non-goal**:
  - 不做 OLTP / 事务处理
  - 不直接修改 dmp_ods 源表（只读，由 DataX 同步）
  - SAP HANA 已不可达（protocol timeout），不依赖其数据
  - 不做实时流处理
  - 不引入新数据库平台（已否定路线: 直接查 SAP, 纯 Excel 手工）

## 核心命令

- **COMMAND-validate**: `.venv/Scripts/dbt parse` — 编译验证所有模型
- **COMMAND-test**: `.venv/Scripts/dbt test --target hive` — 数据质量测试
- **COMMAND-build-dev**: `.venv/Scripts/dbt run --target dev` — DuckDB 本地快速验证
- **COMMAND-build**: `.venv/Scripts/dbt run --target hive` — Hive 生产集群执行
- **COMMAND-build-single**: `.venv/Scripts/dbt run --select <model_name> --target hive`
- **COMMAND-docs**: `.venv/Scripts/dbt docs generate && .venv/Scripts/dbt docs serve`
- **COMMAND-platform**: Electron 智能数据平台 (参见 `platform/`)

---

## 核心原则

- **架构优先、设计优先、真源优先、严格验收**。
- 开始编码前必须先想清楚：为什么要这样做、是否正确、是否存在更简单且更符合当前系统的做法。
- 必须敢于指出不合理的需求、错误的架构方向、冲突的规则和缺失的验收条件。
- **禁止补丁式开发**: 不得用散落 `if`、临时兼容分支、硬编码、`sleep`、全局 flag、mock 或假数据绕过架构问题。
- **禁止无意义向后/向下兼容**: 旧字段、旧接口、旧产品残影若污染当前合同，必须先向用户说明取舍。
- **禁止选项剧场**: 给出一个推荐主线；备选方案只用于解释为什么不选。
- **禁止偷懒、糊弄和留尾巴**。完成定义必须包含可验证结果、未闭合风险和下一步边界。
- **最小改动不是半截改动**。本轮触达的调用链必须闭合到 owner、测试和文档。
- 用户明确否定的概念必须从代码、文档、计划和命名中删除，禁止换个名字继续保留。
- 当用户说"先看""不动代码""先给判断"时，必须保持只读审查，直到用户明确要求执行。

## ⚠️ 项目宪法红线 (最高优先级，每次必遵守)

1. **禁止擅自写入/传输数据**：可以检查数据、查询数据、验证数据。禁止 INSERT / UPDATE / DELETE / CREATE TABLE AS / DROP / TRUNCATE / DataX / dbt run 等任何写入操作。写入操作必须先向用户说明并获取明确授权。
2. **Hive 库是唯一数据真源，验证自动查**：所有数据情况以 Hive 为准。字段、数据量、填充率全部自动查 Hive 获取，不猜测不依赖本地。
3. **修改前必须先审查**：所有代码、配置、SQL 修改必须先向用户说明（改什么、为什么、影响范围），得到审查确认后再执行。禁止先斩后奏。
4. **不擅自执行任何操作**：未经用户明确指令，禁止自行执行 dbt run / test / parse / docs 等命令、Python 脚本、Shell 脚本或 SQL 文件。产出 SQL/命令文本给用户，由用户在平台自行执行。
5. **以用户为主，平台可复现**：所有产出必须可直接复制执行，不依赖本会话临时状态。修改文件后告知路径和改动摘要，由用户自行验证和提交。

## 真源优先级

事实冲突时按以下顺序处理:

1. 当前源码、测试、脚本、schema、运行日志、实机/用户侧证据、当前 git 状态。
2. 本文件 (`CLAUDE.md`)。
3. `project.yml` — 项目配置真源。
4. `examples/pep/规范设计/人教社数仓综合开发规范手册.docx` — PEP 项目开发规范。
5. `dbt_project.yml`, `models/sources.yml`, `profiles.yml`。
5. 当前有效的 `docs/`、`规范设计/`、`设计文档/`、issue、review comments、commit history。
6. archive 历史文档、旧会话、旧记忆只能作为模式证据，不能覆盖当前项目事实。

## 必需工作流

对立项、接管、功能、重构、修 bug、发布和文档任务，默认遵循:

```
当前真源审计
  → 推理闸
  → 唯一 owner 与合同设计
  → 测试 / fixture / 门禁计划
  → 核心实现
  → 薄 adapter / UI / CLI / API 接线
  → 针对性验收 (dbt parse → dbt run --target dev → dbt test → dbt run --target hive)
  → 文档回写
  → git 边界复核
```

**半路接管项目时**，禁止把已有项目当空项目重写；必须先做只读接管审计。

## 推理闸

编码前至少回答:

- 实际要解决的问题是什么？涉及哪个业务域 (ztppm/order/fi/md/stock/ztsd)？
- 谁创建这个概念，谁调用它，谁消费它（最终是 FineReport BI）？
- 当前真源在哪里？是否已经有同职责模块、schema、宏或文档？
- 唯一 owner 是哪一层？ODS(只读) / DWD(清洗) / DWS(业务) / DIM(共享维度) / ADS(BI就绪)？
- 是否跨多个入口（dbt 模型 + Electron 平台 + 脚本）？跨入口语义必须先进入共享合同。
- 更简单、更保守的设计是什么？为什么不够？
- 最大回归风险是什么？用什么阻断 (dbt parse / dbt test / DuckDB 验证 / Hive 实机证据)？

**推理闸没有闭合，不开始实现。**

## 设计规则

- 共享语义必须单一真源: 跨入口复用的概念进入 `macros/` 公共宏，不要散落在各模型、adapter 或脚本里。
- adapter、UI (Electron 平台)、CLI (dbt 命令)、脚本 (`scripts/`, `_*.py`) 只做协议映射和接线，不拥有核心业务语义。
- 已有风格、组件、命名、宏和错误处理方式时优先复用；只有在现有模式错误或不足时才提出替换。
- 抽象只在能减少真实复杂度时引入。禁止为了"看起来架构化"过度封装。
- 生成物只读不手改。`target/` 目录、`dbt docs generate` 输出、schema/codegen 输出变更时改源并重新生成。
- 所有外部输入、查询结果、缓存、文件大小、重试、超时都应有上界和降级策略。

## 错误分级

| 级别 | 定义 | 处理 |
|------|------|------|
| **阻断** | 破坏核心功能、owner边界、数据真相、dbt parse/test 失败、用户关键体验 | 当轮必须收掉 |
| **设计风险** | 导致架构漂移、层间越界、运行面失控或后续难维护 | 说明取舍和验收入口 |
| **可记录债务** | 不影响本轮目标链路 | 说明不处理原因和后续入口 |
| **无关优化** | 不进入本轮范围 | 禁止借机扩大改造 |

## 实现规则

- 从 schema、宏 (macros/)、核心模型开始，而不是从 UI、CLI、临时脚本倒推核心。
- 添加测试应放在风险真正所属的层级 (schema test → model test → integration)。
- 使用 dbt 结构化 API、Jinja 宏和本地 helper，而不是脆弱的字符串拼接。
- 不手改 `target/` 等生成文件；项目有生成器时，运行生成器并检查输出。
- 不用旧记忆、旧输出或"应该是这样"代替当前命令和当前代码证据。
- 修改代码、schema、配置、架构边界后，必须同步项目文档。
- 生产路径用 dbt 统一错误类型和结构化日志返回失败；禁止裸异常或静默吞错。
- 配置、密钥和权限通过 `profiles.yml` 和 dbt 既有配置系统读取；禁止硬编码密钥或日志明文输出敏感信息。
- 用户可见文案必须遵守项目既有命名和文档规范；禁止临时硬编码后续再补。

## 多 Agent 规则

- 优先使用多 agent 执行模式，但只在任务能拆成互不干扰的独立域时使用（如不同业务域并行开发）。
- 每个子 agent 必须有明确范围、输入、禁止事项和期望输出。
- 多 agent 修改代码时必须分配不重叠的文件或模块 owner（不同域/不同层的模型文件），集成时复核冲突。
- 子 agent 的结论不是最终真源；最终结论仍要由主 agent 对照 `dbt parse`、测试和文档验收。

## 验收规则

- 验收必须匹配改动风险，不能只跑最轻命令就宣布完成。
- 声称"完成""修好""通过"前，必须提供实际运行过的命令和输出证据:
  - dbt 模型变更: `dbt parse` + `dbt run --target dev` + `dbt test`（如适用）
  - Hive 生产变更: `dbt run --target hive` 输出
  - 平台 UI 变更: 实际渲染截图或用户侧证据
- 发现失败时，先复现、收集证据、建立可证伪假设，再修改。禁止无复现地猜测。
- warning、lint warning、格式漂移、生成物漂移、文档索引缺失和本轮 TODO/TBD 都按缺陷处理。

## 文档分层

- **内部真源**: 架构、宪法、owner map、验收门禁、治理历史 → `docs/`
- **引擎文档**: 适配器接口、生成器规范、编排器逻辑 → `engine/`
- **PEP 专属文档**: 需求手册、模型设计、验收数据 → `examples/pep/`
- **外部文档**: 产品介绍报告 → `docs/产品介绍报告.md`
- 同一变更同时影响用户行为和内部机制时，必须分别写入对应层。

## Git 规则

- 提交前确认 git root、`git status --short`、ignored 文件和嵌套仓库边界。
- **禁止 `git add .`**。只 stage 与本任务相关的文件。
- 注意 `profiles.yml` 是 git-ignored（含凭证），不得 force-add。
- dirty worktree 中不得回滚、覆盖或吸入用户未授权的改动。
- 不使用破坏性 git 命令（`reset --hard`、`push --force`），除非用户明确要求并确认风险。
- Commit message 中文描述 + `Co-Authored-By: Claude Code <noreply@anthropic.com>`。

## 必须停止并询问的情况

- 用户需求、当前代码、本宪法、真源文档或验收结果互相冲突。
- 需要修改 dbt_project.yml 核心配置、profiles.yml 连接定义或 models/sources.yml 源表契约。
- 需要删除已有模型、宏、API、字段、路由、配置、迁移历史。
- 需要跨越层边界（如 DWS 直接读 ODS 绕过 DWD）——除非是已确认的例外（如税务 ZTSD_A005 系列）。
- 当前证据表明用户目标会损害数据架构、安全、权限或长期可维护性。

停止时给出: 冲突证据、可选方向、推荐方向、需要用户确认的问题。

## 交接规则

当上下文过大、需要换窗口或任务未闭合时，产出交接文本:

- 当前目标和已确认的产品/架构边界。
- 当前 git 状态、已改文件、未提交文件。
- 已完成工作、实际验收命令和结果。
- 未闭合风险、漂移警告和禁止触碰的用户改动。
- 下一步最安全命令和停止条件。

---

## 架构

### 数据流 (5 层)
```
SAP ECC → 用友DataX → Hive dmp_ods (382 tables, read-only by dbt)
  → DWD (dmp_dw: 1:1 cleaning, type conversion, audit columns)
  → DWS (dmp_dw: multi-table JOIN, business logic, intermediate views + wide tables)
  → DIM (dmp_dim: shared dimensions)
  → ADS (dmp_ads: BI-ready, parameterized, Hive + OceanBase dual-write)
  → FineReport BI dashboards
```

### 层间引用规则 (dbt DAG 强制)
| 引用 | 状态 |
|------|------|
| `source('ods', ...)` → `ref('dwd_*')` | 允许 |
| `ref('dwd_*')` → `ref('dws_*')` | 允许 |
| `source('ods', ...)` → `ref('dws_*')` | **禁止** (绕过 DWD) |
| `ref('ads_*')` → anything | **禁止** (ADS 是终点) |

**例外**: 税务表 ZTSD_A005 系列可在 DWS 中间层直接引用 ODS，因 DWD 仅含主键列。

### 数据库连接 (profiles.yml)
| Target | Adapter | 用途 |
|--------|---------|------|
| `dev` | duckdb | 本地快速迭代 |
| `hive` | spark (thrift) | 生产 — 读 dmp_ods, 写 dmp_dw/dmp_dim/dmp_ads |
| `oceanbase_ads` | obmysql | 生产输出 dmp_ads |
| `oceanbase_fusion` | obmysql | 只读 Data Fusion 元数据 |
| `mysql_pepdata` | obmysql | FineReport 表单数据 (sacdb) |
| `sap_hana` | hana | SAP HANA 元数据 — **不可达** (protocol timeout) |

`profiles.yml` 是 git-ignored（含凭证）。obmysql adapter 同时用于 OceanBase 和标准 MySQL 8.0（dbt-mysql 与 dbt-core 1.11.9 不兼容）。

**OWNER-ods**: `dmp_ods` 外部只读，由 DataX 同步，dbt 不写入
**OWNER-dwd**: `models/dwd/` — 1:1 清洗，禁止跨表 JOIN，7 审计列必须
**OWNER-dws**: `models/dws/` — 多表 JOIN + 业务逻辑 + 中间视图 + 宽表
**OWNER-dim**: `models/dim/` — 共享维度
**OWNER-ads**: `models/ads/` — BI 就绪，Hive + OceanBase 双写

### 业务域
| 域 | 代码 | DWD 前缀 | 内容 |
|--------|------|------------|---------|
| 选题/编辑 | `ztppm` | `dwd_ztppm_*` | 选题、编辑计划、三审三校、版权、合同、印制 |
| 订单 | `order` | `dwd_order_*` | 销售订单、开票、交货、采购 |
| 财务 | `fi` | `dwd_fi_*` | 费用报销、稿酬、成本核算 |
| 主数据 | `md` | `dwd_md_*` | 客户、物料、员工、字典 |
| 库存 | `stock` | `dwd_stock_*` | 库存凭证 |
| 销售定制 | `ztsd` | `dwd_ztsd_*` | 销售定制表 |

### 关键宏 (macros/)
所有 DWD/DWS 模型**必须**使用这些宏，禁止手写原始 SQL:

| 宏 | 用途 | 示例 |
|-------|---------|---------|
| `sap_date(col)` | yyyyMMdd string → DATE | `{{ sap_date('a.erdat') }}` |
| `sap_string(col, default="''")` | TRIM + COALESCE | `{{ sap_string('a.name1', default="'UNKNOWN'") }}` |
| `sap_flag(col)` | 'X'/'' → '1'/'0' | `{{ sap_flag('a.fksto') }}` |
| `sap_decimal(col, precision='15,2')` | NULL→0 + CAST DECIMAL | `{{ sap_decimal('a.netwr') }}` |
| `audit_columns()` | 添加 7 个标准审计列 | `{{ audit_columns() }}` |
| `group_concat(expr, separator)` | 跨方言 GROUP_CONCAT | `{{ group_concat('col') }}` |
| `generate_schema_name()` | 自定义 schema 命名 | 自动应用 |
| `incremental_filter()` | 增量加载 WHERE 子句 | `{{ incremental_filter() }}` |

## DWD 层规则

1. **1:1 映射** — 一张 DWD 表对应一张 ODS 表，禁止跨表 JOIN
2. **只清洗不过滤** — DWD 保留所有行；业务过滤在 DWS 完成
3. **7 审计列必须** — 每个 DWD/DWS 模型必须包含 `{{ audit_columns() }}`
4. **类型转换** 按规范手册标准映射 (Section 3.1)
5. **NULL 处理**: numeric→0, codes→'', names→'UNKNOWN', dates→NULL, flags→'0'
6. **按业务键去重** — `ROW_NUMBER() OVER (PARTITION BY pk ORDER BY date DESC)`

## @@ADAPTER@@ 适配块

### @@ADAPTER:framework/dbt@@
applies_when: "项目实际使用 dbt-core 1.11.9"
authority: "低于通用 Agent 宪法，高于普通建议"
verification: "COMMAND-validate: .venv/Scripts/dbt parse"

- dbt 模型必须通过 `ref()` / `source()` 建立 DAG 依赖，禁止硬编码表名。
- Jinja 宏是唯一业务逻辑复用入口；禁止跨模型复制 SQL 片段。
- `profiles.yml` 是凭证真源，不在模型或脚本中硬编码连接信息。
- 模型文件名 = 表名（如 `models/dwd/order/dwd_order_vbrk.sql`）。
- 增量模型必须使用 `incremental_filter()` 宏，不手写 WHERE 子句。
- 所有模型文件 UTF-8 编码 (无 BOM)。

### @@ADAPTER:database/Hive@@
applies_when: "目标为 Hive (Spark SQL 方言)"
verification: "COMMAND-build: .venv/Scripts/dbt run --target hive"

- Spark SQL 方言: 注意 `DATE` 类型处理、分区语法、`GROUP BY` 限制。
- Hive 不支持 `VALUES` 子句，用 `SELECT ... UNION ALL` 替代。
- 大表必须指定分区策略（`partition_by` 在 dbt config 中）。
- `sap_date()` 宏负责 yyyyMMdd → DATE 转换，跨方言兼容 DuckDB/Spark/OceanBase。

### @@ADAPTER:database/OceanBase@@
applies_when: "目标为 OceanBase (obmysql adapter)"
verification: "dbt run --target oceanbase_ads"

- OceanBase MySQL 模式，使用 obmysql adapter（非 dbt-mysql）。
- ADS 层双写 Hive + OceanBase，确保两边的 schema 一致。
- OceanBase 连接信息在 `profiles.yml` 中，git-ignored。

### @@ADAPTER:toolchain/duckdb@@
applies_when: "本地开发验证"
verification: "COMMAND-build-dev: .venv/Scripts/dbt run --target dev"

- DuckDB 用于快速迭代验证，不做生产部署。
- `--target dev` 先跑通，再切 `--target hive` 上生产。
- `warehouse.duckdb` 是本地 DuckDB 文件，git-ignored。

### @@ADAPTER:platform/Electron@@
applies_when: "智能数据平台 UI 变更"
verification: "platform/ 目录下 Electron + Vite 构建"

- 平台 UI 只做展示和接线，不拥有核心业务语义。
- 数据查询通过 dbt docs / dbt run 接口，不在平台代码中私造 SQL。

---

## 当前状态 (2026-07-02)

- **通用化完成**: 引擎层 8 大引擎就位、3 个源系统适配器、2 个项目模板、CLI 命令行
- **配置中心化**: `project.yml` 统一管理项目名称/源系统/业务域/场景/连接
- **目录清理**: PEP 专属内容归档至 `examples/pep/`，根目录精简约 20 个文件/目录
- **CI/CD 就位**: GitHub Actions dbt CI + Deploy + DolphinScheduler 5 场景调度
- **数据质量**: 415 条 not_null 断言，4/6 域有 schema.yml
- **DWD 87 模型 / DWS 8 中间表 / ADS 1 表 / DIM 1 表**
- **当前场景**: PEP 项目作为 SAP ECC 适配器的官方示例运行中

## 开发模式: 场景驱动

不是一次性构建所有层。每个业务场景按: ADS 设计 ← DWS 设计 ← DWD 设计 ← ODS 盘点，顺序实施。
5 个场景: 01 开票明细, 02 收入执行, 03 表单报表, 04 应收, 05 选题模块。

## 命名规范

- 表: `{layer}_{domain}_{short_name}` — 小写，下划线分隔 (如 `dwd_order_vbrk`)
- 文件: 匹配表名 (如 `models/dwd/order/dwd_order_vbrk.sql`)
- 列: 英文 snake_case，符合 ISO 11179，最长 30 字符
- SQL 文件: UTF-8 编码 (无 BOM)
