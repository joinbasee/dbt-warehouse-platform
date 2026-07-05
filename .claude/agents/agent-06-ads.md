---
id: agent-06
name: ADS层开发
name_en: ADS Layer Development
order: 6
status: pending
dependencies: [agent-04, agent-05]
icon: "◆"
color: "#FF6B35"

layer_permissions:
  read: [DWS, DIM]
  write: [ADS, macros]

domain_scope: ["*"]

tools:
  dbt: [parse, run, test]
  scripts: []
  mcp: [Hive metadata, OceanBase metadata]

input_contract: |
  Agent 4 的 DWS 宽表 + Agent 5 的 DIM 维度 + 报表原型参数定义
output_contract: |
  ADS SQL 模型 + 参数过滤宏 + 参数映射文档

forbidden:
  - 禁止 ADS 层再做 JOIN（应在 DWS 完成）
  - 禁止直接引用 ODS 或 DWD
  - 禁止在 ADS 中写复杂计算逻辑

acceptance:
  - dbt parse --select +ads_*+ --target hive
  - dbt test --select +ads_*+ --target dev
  - OceanBase 双写 schema 一致
---

# Agent 06: ADS层开发

生成参数化 ADS 视图，对接 FineReport BI。支持 20+ 筛选参数（多值、日期范围、模糊搜索、联动过滤），实现 Hive→OceanBase 跨目标部署。

## 职责

1. 读取 Agent 4 的 DWS 宽表 + Agent 5 的 DIM 维度
2. 生成参数化 ADS SQL 模型
3. 实现参数过滤宏
4. 确保 Hive + OceanBase 双写 schema 一致
5. 对接 FineReport BI 数据集

## 当前产出

- models/ads/ads_fi_zsdr005.sql
- macros/zsdr005_params.sql
