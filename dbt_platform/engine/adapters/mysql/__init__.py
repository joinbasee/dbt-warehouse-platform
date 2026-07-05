# -*- coding: utf-8 -*-
"""MySQL 通用源系统适配器"""
from dbt_platform.engine.adapters.base import SourceAdapter


class MysqlAdapter(SourceAdapter):

    @property
    def name(self) -> str:
        return "mysql"

    @property
    def display_name(self) -> str:
        return "MySQL"

    def string_to_sql(self, col: str, default: str = "''") -> str:
        return f"COALESCE(TRIM({col}), {default})"

    def date_to_sql(self, col: str) -> str:
        return f"CAST({col} AS DATE)"

    def number_to_sql(self, col: str, precision: str = "15,2") -> str:
        return f"CAST(COALESCE({col}, 0) AS DECIMAL({precision}))"

    def flag_to_sql(self, col: str) -> str:
        return f"CASE WHEN {col} = 1 THEN '1' ELSE '0' END"

    def discover_tables(self, connection) -> list[str]:
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        return [row[0] for row in cursor.fetchall()]

    def discover_columns(self, connection, table: str) -> list[dict]:
        cursor = connection.cursor()
        cursor.execute(f"DESCRIBE {table}")
        return [
            {
                "name": row[0],
                "position": i + 1,
                "is_key": row[3] == "PRI",
                "data_type": row[1],
                "length": None,
                "description": "",
            }
            for i, row in enumerate(cursor.fetchall())
        ]

    def dedup_keys(self, table: str) -> list[str]:
        return ["id"]  # 通用假设，具体覆盖

    def dedup_order(self, table: str) -> str:
        return "updated_at DESC"


class CustomAdapter(SourceAdapter):
    """自定义适配器 — 用户在 project.yml 中手工定义类型映射"""

    def __init__(self, config: dict):
        self._config = config
        self._name = config.get("name", "custom")
        self._display = config.get("display_name", "自定义")

    @property
    def name(self) -> str:
        return self._name

    @property
    def display_name(self) -> str:
        return self._display

    def string_to_sql(self, col: str, default: str = "''") -> str:
        return self._config.get("string_sql", f"CAST({col} AS STRING)")

    def date_to_sql(self, col: str) -> str:
        return self._config.get("date_sql", f"CAST({col} AS DATE)")

    def number_to_sql(self, col: str, precision: str = "15,2") -> str:
        return self._config.get("number_sql", f"CAST(COALESCE({col}, 0) AS DECIMAL({precision}))")

    def flag_to_sql(self, col: str) -> str:
        return self._config.get("flag_sql", f"CAST({col} AS STRING)")

    def discover_tables(self, connection) -> list[str]:
        return self._config.get("tables", [])

    def discover_columns(self, connection, table: str) -> list[dict]:
        return self._config.get("columns", {}).get(table, [])

    def dedup_keys(self, table: str) -> list[str]:
        return self._config.get("dedup_keys", {}).get(table, ["id"])

    def dedup_order(self, table: str) -> str:
        return self._config.get("dedup_order", {}).get(table, "updated_at DESC")


# 适配器注册表
ADAPTERS = {
    "sap_ecc": "dbt_platform.engine.adapters.sap_ecc.SapEccAdapter",
    "mysql": "dbt_platform.engine.adapters.mysql.MysqlAdapter",
    "custom": "dbt_platform.engine.adapters.mysql.CustomAdapter",
}


def load_adapter(name: str, config: dict = None):
    """通过名称加载适配器"""
    import importlib

    adapter_class_path = ADAPTERS.get(name)
    if adapter_class_path is None:
        raise ValueError(f"未知适配器: {name}，已注册: {list(ADAPTERS.keys())}")

    module_path, class_name = adapter_class_path.rsplit(".", 1)
    module = importlib.import_module(module_path)
    cls = getattr(module, class_name)

    if name == "custom":
        return cls(config or {})

    return cls()
