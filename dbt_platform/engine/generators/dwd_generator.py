# -*- coding: utf-8 -*-
"""
通用 DWD SQL 生成器

输入: 适配器 + 表名 + 字段清单 + 列定义
输出: 完整 DWD SQL（CREATE TABLE + INSERT）

与 scripts/gen_dwd_sql.py 的区别:
  - 旧版: SAP 硬编码，PEP 专属列名
  - 新版: 通过适配器获取类型转换逻辑，适配任意源系统

用法:
    from dbt_platform.engine.generators.dwd_generator import DwdGenerator
    gen = DwdGenerator(adapter, config)
    sql = gen.generate(table="vbrk", columns=[...])
"""
from pathlib import Path
from typing import Optional

from dbt_platform.engine.adapters.base import SourceAdapter


class DwdGenerator:
    """通用 DWD 模型生成器"""

    def __init__(self, adapter: SourceAdapter, config: dict):
        self.adapter = adapter
        self.config = config
        self.layers = config.get("layers", [])

    def generate(self, table: str, columns: list[dict],
                 pk: Optional[list[str]] = None,
                 incremental_key: Optional[str] = None) -> str:
        """生成完整 DWD SQL

        Args:
            table: 源表名（如 vbrk）
            columns: 列定义列表，每项包含 {name, sap_name, target_type, alias, description}
            pk: 主键列表
            incremental_key: 增量键
        """
        dwd_name = f"dwd_{self._domain(table)}_{table}"

        # 列 SQL
        col_sqls = []
        for col in columns:
            sql = self.adapter.convert(
                col.get("sap_name", col["name"]),
                col.get("target_type", "string"),
                default=col.get("default"),
                precision=col.get("precision", "15,2"),
            )
            alias = col.get("alias", col["name"])
            if alias != col.get("sap_name", col["name"]):
                col_sqls.append(f"    {sql} AS {alias}")
            else:
                col_sqls.append(f"    {sql}")

        audit = (
            "    'system' AS s_creator,\n"
            "    'system' AS s_creator_name,\n"
            "    CURRENT_TIMESTAMP() AS s_create_time,\n"
            "    'system' AS s_modifier,\n"
            "    'system' AS s_modifier_name,\n"
            "    CURRENT_TIMESTAMP() AS s_modify_time,\n"
            "    110 AS s_state"
        )

        # 去重
        pk_cols = pk or self.adapter.dedup_keys(table)
        order_col = incremental_key or self.adapter.dedup_order(table)

        is_incremental = incremental_key is not None
        mat = "incremental" if is_incremental else "table"
        inc_key_line = f"#     Incremental Key: {incremental_key}\n" if incremental_key else ""
        inc_config = ""
        if is_incremental:
            inc_config = (
                "        incremental_strategy='insert_overwrite',\n"
                "        partition_by={'field': 's_create_time', 'data_type': 'timestamp'}\n"
            )
        inc_filter = (
            f"{{% if is_incremental() %}}\n"
            f"    AND {{{{ incremental_filter('{incremental_key}', 7) }}}}\n"
            f"{{% endif %}}\n"
        ) if is_incremental else ""

        sql = f"""\
{{#
#     Layer: DWD
#     Description: {self.config.get('project', {}).get('name', '')} — {table.upper()} 清洗
#     Source: {{{{ source("ods", "ods_sap_{table}") }}}}
#     PK: {', '.join(pk_cols)}
#     Adapter: {self.adapter.name}
{inc_key_line}#     Materialized: {mat}
#}}

{{{{
    config(
        materialized='{mat}',
        schema='dmp_dw'
{inc_config}    )
}}}}

WITH source_data AS (
    SELECT *
    FROM {{{{ source('ods', 'ods_sap_{table}') }}}}
),

deduped AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY {', '.join(pk_cols)}
            ORDER BY {order_col}
        ) AS rn
    FROM source_data
)

SELECT
{chr(10).join(col_sqls)},
{audit}
FROM deduped
WHERE rn = 1
{inc_filter}"""
        return sql

    def _domain(self, table: str) -> str:
        """根据表名推断业务域"""
        # 简单规则，可由 project.yml 的 domain.table_mapping 覆盖
        domain_map = self.config.get("domain_table_map", {})
        return domain_map.get(table.lower(), "common")

    def generate_all(self, tables: dict[str, list[dict]]) -> dict[str, str]:
        """批量生成，返回 {model_name: sql}"""
        results = {}
        for table, columns in tables.items():
            sql = self.generate(table, columns)
            dwd_name = f"dwd_{self._domain(table)}_{table}"
            results[dwd_name] = sql
        return results
