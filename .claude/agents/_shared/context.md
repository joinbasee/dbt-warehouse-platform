# Agent 体系 — 共享项目上下文

> 本文件为模板。运行时由 AgentRunner 从 project.yml 注入实际值。
> 占位符 `{{ ... }}` 在 prompt 构建时被替换。

## 项目信息

- **项目名**: {{ project_name }}
- **描述**: {{ project_description }}
- **源系统适配器**: {{ source_adapter }}
- **技术栈**: dbt-core 1.11.9, Hive/DuckDB/OceanBase

## 数据流架构 (5层)

```
{{ source_adapter }} → DataX → ODS (只读)
  → DWD (1:1清洗, 类型转换, 7审计列)
  → DWS (多表JOIN, 业务逻辑)
  → DIM (共享维度)
  → ADS (BI就绪, 双写)
  → BI 消费
```

## 层间引用规则

| 引用 | 状态 |
|------|------|
| source('ods') → ref('dwd_*') | 允许 |
| ref('dwd_*') → ref('dws_*') | 允许 |
| source('ods') → ref('dws_*') | 禁止 (绕过DWD) |
| ref('ads_*') → anything | 禁止 (ADS是终点) |

## 业务域

{{ domain_table }}

## 标准化宏

| 宏 | 用途 |
|------|---------|
| sap_date(col) | yyyyMMdd → DATE |
| sap_string(col, default) | TRIM + COALESCE |
| sap_flag(col) | X/ → 1/0 |
| sap_decimal(col, precision) | NULL→0 + CAST DECIMAL |
| audit_columns() | 7 个标准审计列 |
| incremental_filter() | 增量加载 WHERE |

## DWD 层规则

1. 1:1 映射 — 一张 DWD 对应一张 ODS
2. 只清洗不过滤 — 保留所有行
3. 7 审计列必须
4. NULL: numeric→0, codes→'', names→'UNKNOWN', dates→NULL, flags→'0'
5. 按业务键去重: ROW_NUMBER() OVER (PARTITION BY pk ORDER BY date DESC)
