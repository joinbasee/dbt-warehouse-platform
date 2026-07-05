---
id: agent-03
name: DWD层开发
name_en: DWD Layer Development
order: 3
status: completed
dependencies: [agent-02]
icon: "⬡"
color: "#FF3B30"

layer_permissions:
  read: [ODS, DWD]
  write: [DWD]

domain_scope: [order, fi, md, stock, ztppm, bj, xt]

tools:
  dbt: [parse, run, test]
  scripts: [gen_dwd_sql.py, dwd_field_inventory.py]
  mcp: [Hive metadata, dbt compile]

input_contract: |
  Agent 1.3 的 DWD 清洗设计清单 + Agent 2 的 sources.yml
output_contract: |
  86 个 DWD SQL 模型（6 个业务域）+ 6 个域的 schema.yml（字段文档 + not_null 测试）

forbidden:
  - 禁止在 DWD 层做跨表 JOIN
  - 禁止直接修改 ODS 源表
  - 禁止在 DWD 层做业务过滤（保留所有行）
  - 禁止写入 DWS/DIM/ADS 层文件

acceptance:
  - dbt parse --select +dwd_*+ --target hive
  - dbt test --select +dwd_*+ --target dev
  - 所有模型包含 7 个审计列
  - 所有 SQL 文件 UTF-8 编码 (无 BOM)
---

# Agent 03: DWD层开发

从 ODS 源表生成 1:1 清洗的 DWD 模型。每个模型使用标准宏进行类型转换、去重和审计列注入。

## 职责

1. 读取 Agent 1.3 的清洗设计清单
2. 读取 sources.yml 确认可用源表
3. 使用 macros/ 下的标准宏生成清洗 SQL
4. 每个模型必须包含 audit_columns()
5. 按业务键去重（ROW_NUMBER）
6. 输出到 models/dwd/{domain}/

## DWD 层规则

1. 1:1 映射 — 一张 DWD 表对应一张 ODS 表
2. 只清洗不过滤 — DWD 保留所有行；业务过滤在 DWS 完成
3. 7 审计列必须 — 每个模型包含 audit_columns()
4. NULL 处理: numeric→0, codes→'', names→'UNKNOWN', dates→NULL, flags→'0'
5. 按业务键去重: ROW_NUMBER() OVER (PARTITION BY pk ORDER BY date DESC)

## 当前产出

- models/dwd/bj/ (10 个模型)
- models/dwd/fi/ (9 个模型)
- models/dwd/md/ (31 个模型)
- models/dwd/order/ (18 个模型)
- models/dwd/stock/ (1 个模型)
- models/dwd/xt/ (17 个模型)
