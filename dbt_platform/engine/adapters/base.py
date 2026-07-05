# -*- coding: utf-8 -*-
"""
源系统适配器 — 抽象基类

每种源系统（SAP ECC / Oracle EBS / MySQL / 用友 / ...）实现此接口。
引擎层所有类型转换、NULL处理、去重策略通过适配器调用，不直接写死方言。

用法:
    from engine.adapters.sap_ecc import SapEccAdapter
    adapter = SapEccAdapter()
    sql = adapter.date_to_sql('erdat')  # → CAST(FROM_UNIXTIME(...) AS DATE)
"""
from abc import ABC, abstractmethod
from typing import Optional


class SourceAdapter(ABC):
    """源系统适配器抽象基类"""

    # ── 元信息 ──
    @property
    @abstractmethod
    def name(self) -> str:
        """适配器名称，如 'sap_ecc'"""
        ...

    @property
    @abstractmethod
    def display_name(self) -> str:
        """显示名称，如 'SAP ECC'"""
        ...

    # ── 类型转换 ──
    @abstractmethod
    def string_to_sql(self, col: str, default: str = "''") -> str:
        """字符串列 → SQL 表达式 (TRIM + COALESCE)"""
        ...

    @abstractmethod
    def date_to_sql(self, col: str) -> str:
        """日期列 → SQL DATE 表达式"""
        ...

    @abstractmethod
    def number_to_sql(self, col: str, precision: str = "15,2") -> str:
        """数值列 → SQL DECIMAL 表达式 (NULL → 0)"""
        ...

    @abstractmethod
    def flag_to_sql(self, col: str) -> str:
        """布尔标记列 → SQL '1'/'0' 表达式"""
        ...

    def convert(self, col: str, target_type: str, **kwargs) -> str:
        """统一入口：按目标类型调用对应的转换方法"""
        if target_type in ("number", "decimal"):
            return self.number_to_sql(col, precision=kwargs.get("precision", "15,2"))
        if target_type in ("string",):
            return self.string_to_sql(col, default=kwargs.get("default", "''"))
        if target_type in ("date",):
            return self.date_to_sql(col)
        if target_type in ("flag", "boolean"):
            return self.flag_to_sql(col)
        return col  # 透传

    # ── 元数据发现 ──
    @abstractmethod
    def discover_tables(self, connection) -> list[str]:
        """列出所有源表"""
        ...

    @abstractmethod
    def discover_columns(self, connection, table: str) -> list[dict]:
        """列出表的所有列 [{name, type, description, ...}]"""
        ...

    # ── 去重策略 ──
    @abstractmethod
    def dedup_keys(self, table: str) -> list[str]:
        """返回去重主键列（如 SAP 的 vbeln + mandt）"""
        ...

    @abstractmethod
    def dedup_order(self, table: str) -> str:
        """返回去重排序字段（如 SAP 的 erdat DESC）"""
        ...

    # ── NULL 处理策略 ──
    def null_default(self, target_type: str) -> str:
        """返回 NULL 替换默认值"""
        defaults = {
            "string": "''",
            "code": "''",
            "name": "'UNKNOWN'",
            "date": "NULL",
            "number": "0",
            "decimal": "0",
            "flag": "'0'",
            "boolean": "'0'",
        }
        return defaults.get(target_type, "NULL")
