---
id: agent-04
name: DWS层开发
name_en: DWS Layer Development
order: 4
status: pending
dependencies: [agent-03]
icon: "▣"
color: "#AF52DE"

layer_permissions:
  read: [DWD, DWS]
  write: [DWS]

domain_scope: [order, fi, md, stock, ztppm, bj, xt]

tools:
  dbt: [parse, run, test]
  scripts: [run_etl05.py, run_etl06.py, run_etl08.py]
  mcp: [Hive metadata, dbt compile, lineage validation]

input_contract: |
  Agent 1.4 的 ETL 链设计 + Agent 3 的 DWD 模型
output_contract: |
  8 个中间层模型 + 4 个业务宽表（含 15 项业务计算规则）

forbidden:
  - 禁止绕过 DWD 直接引用 ODS（税务 ZTSD_A005 系列除外）
  - 禁止在中间层做最终聚合（留给 ADS）
  - 禁止修改 DWD 层模型

acceptance:
  - dbt parse --select +dws_*+ --target hive
  - dbt test --select +dws_*+ --target dev
  - ETL 链 DAG 无循环依赖
---

# Agent 04: DWS层开发

生成 DWS 中间层 ETL 链（ETL-01~08）和业务宽表。实现主数据装配→金税关联→数据分流→维度补全→定价成本→财务计划的 8 步链式依赖。

## 职责

1. 读取 Agent 1.4 的 ETL 链设计
2. 按 ETL 步骤顺序生成中间层模型
3. 实现多表 JOIN 和业务计算规则
4. 聚合生成宽表供 ADS 消费
5. 确保层间引用规则（ref('dwd_*') 不跨层）

## ETL 链结构

- ETL-01: 发票基表（4表 JOIN）
- ETL-02a: 金税桥接
- ETL-02b: 金税状态
- ETL-03: 数据分流
- ETL-04: 维度补全
- ETL-05: 定价成本
- ETL-06: 财务计划
- ETL-07~08: 业务宽表

## 当前产出

- models/dws/intermediate/ (8 个中间模型)
- FI 域完整链路已就位
