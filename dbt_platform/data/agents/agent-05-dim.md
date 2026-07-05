---
id: agent-05
name: DIM层设计
name_en: DIM Layer Design
order: 5
status: pending
dependencies: [agent-03]
icon: "▥"
color: "#5AC8FA"

layer_permissions:
  read: [DWD]
  write: [DIM]

domain_scope: [md]

tools:
  dbt: [parse, run, test]
  scripts: []
  mcp: [Hive metadata, dbt compile]

input_contract: |
  Agent 1.4 的维度设计 + Agent 3 的 DWD 主数据模型
output_contract: |
  5+ 个维度模型（客户/产品/组织/员工/日期）

forbidden:
  - 禁止在 DIM 层做跨域 JOIN
  - 禁止修改 DWD 层模型

acceptance:
  - dbt parse --select +dim_*+ --target hive
  - 每个维度模型有代理键
---

# Agent 05: DIM层设计

生成跨域共享维度模型，支持 SCD Type 1/2 策略。

## 职责

1. 从 DWD 主数据域提取维度候选列
2. 实现 SCD Type 2（客户维度）
3. 实现 SCD Type 1（产品维度）
4. 生成代理键

## 目标维度

- dim_customer — 客户维度 (SCD Type2)
- dim_product_pub — 产品维度 (SCD Type1)
- dim_organization — 组织维度
- dim_employee — 员工维度
- dim_date — 日期维度
