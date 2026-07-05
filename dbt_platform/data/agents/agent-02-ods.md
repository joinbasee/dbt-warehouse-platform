---
id: agent-02
name: ODS层搭建
name_en: ODS Layer Setup
order: 2
status: completed
dependencies: [agent-01]
icon: "◈"
color: "#FF9500"

layer_permissions:
  read: [ODS]
  write: [ODS]

domain_scope: ["*"]

tools:
  dbt: [parse, compile]
  scripts: []
  mcp: [Hive DESCRIBE TABLE, dbt compile, YAML validation]

input_contract: |
  Agent 1.2 的 ODS 模型设计清单 + Hive dmp_ods 原始表元数据
output_contract: |
  models/sources.yml（74张表的完整定义，含字段注释和freshness监控）

forbidden:
  - 禁止修改 ODS 源表数据（只读）
  - 禁止创建 ODS 层 dbt 模型
  - 禁止手写 source 定义绕过 sources.yml

acceptance:
  - dbt parse 编译通过
  - sources.yml 语法正确
  - 每个 source 表有 description
---

# Agent 02: ODS层搭建

负责配置 models/sources.yml，定义所有 ODS 源表的 dbt source 引用。

## 职责

1. 通过 MCP 自动读取 Hive dmp_ods 中所有表的元数据
2. 为每张表生成 source 定义
3. 配置 freshness 监控阈值
4. 验证 YAML 语法和 dbt compile

## 当前产出

- models/sources.yml（1511 个字段定义）
