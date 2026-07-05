---
id: agent-07
name: OceanBase迁移验证
name_en: Migration & Validation
order: 7
status: pending
dependencies: [agent-06]
icon: "▧"
color: "#8E8E93"

layer_permissions:
  read: [ADS]
  write: [ADS]

domain_scope: ["*"]

tools:
  dbt: [run, test]
  scripts: [validate_cross_db.py]
  mcp: [Hive COUNT/SUM, OceanBase COUNT/SUM, cross-db sampling]

input_contract: |
  Agent 6 的 ADS 模型 + Hive dmp_ads + OceanBase dmp_ads
output_contract: |
  迁移脚本 + 四维一致性验证报告（行数/金额/主键/抽样）

forbidden:
  - 禁止修改 ADS SQL 模型
  - 禁止在 Hive 和 OceanBase 之间做数据同步（应由调度系统完成）
  - 验证报告不得隐瞒差异

acceptance:
  - 跨库行数对比通过
  - 跨库金额对比通过
  - 主键唯一性一致
  - 抽样数据一致
---

# Agent 07: OceanBase迁移验证

将 ADS 层数据从 Hive 迁移至 OceanBase dmp_ads，执行 8 步迁移流程并生成四维一致性验证报告。

## 职责

1. 从 Hive ADS 读取数据
2. 生成 OceanBase DDL 迁移脚本（含类型映射）
3. 执行迁移（Hive → OceanBase）
4. 四维验证：行数、金额、主键、抽样
5. 生成一致性验证报告

## 8 步迁移流程

1. 表结构创建（Hive DDL → OceanBase DDL）
2. 全量迁移
3. 增量同步
4. 行数验证（COUNT(*))
5. 金额验证（SUM(amount)）
6. 主键验证（UNIQUE COUNT）
7. 抽样验证（随机抽样对比）
8. FineReport 连接测试

## 验收产出

- 迁移脚本
- 验收/一致性验证报告.md
