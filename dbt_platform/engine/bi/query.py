# -*- coding: utf-8 -*-
"""
ADS 模型查询器

从 dbt ADS 模型取数 → 返回结构化数据供图表渲染
"""
import subprocess
import json
import sys
from pathlib import Path
from typing import Optional

from dbt_platform.engine.utils.project import get_platform_root
PLATFORM_ROOT = get_platform_root()

# 尝试导入数据库驱动（失败时降级为 dbt query 方式）
try:
    from pyhive import hive
    HAS_HIVE = True
except ImportError:
    HAS_HIVE = False

try:
    import pymysql
    HAS_MYSQL = True
except ImportError:
    HAS_MYSQL = False


class AdsQuerier:
    """ADS 模型查询器"""

    def __init__(self, target: str = "hive", config: dict = None):
        self.target = target
        self.config = config or {}
        self._conn = None

    def query_model(self, model: str, fields: list[str],
                    filters: dict = None,
                    order_by: str = None,
                    limit: int = None) -> list[dict]:
        """查询 ADS 模型数据

        Args:
            model: ADS 模型名（如 ads_fi_zsdr005）
            fields: 需要的列
            filters: {field: value} 或 {field: {gte: val, lte: val}}
            order_by: "field DESC"
            limit: 行数限制
        """
        sql = self._build_sql(model, fields, filters, order_by, limit)

        if self.target == "dev":
            return self._query_duckdb(sql)
        elif self.target in ("hive",):
            return self._query_hive(sql)
        elif self.target in ("oceanbase_ads", "oceanbase_fdt"):
            return self._query_oceanbase(sql)
        else:
            return self._query_duckdb(sql)

    def _build_sql(self, model: str, fields: list[str],
                   filters: dict, order_by: str, limit: int) -> str:
        """构建 SQL"""
        cols = ", ".join(fields) if fields else "*"

        # 通过 dbt run --dry-run 或直接读 models/ads/ 获取编译后的表名
        # 简化：ADS 模型名 → 表名映射
        table_name = f"dmp_ads.{model}"

        sql = f"SELECT {cols} FROM {table_name}"

        if filters:
            conditions = []
            for field, value in filters.items():
                if isinstance(value, dict):
                    if "gte" in value:
                        conditions.append(f"{field} >= '{value['gte']}'")
                    if "lte" in value:
                        conditions.append(f"{field} <= '{value['lte']}'")
                else:
                    conditions.append(f"{field} = '{value}'")
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)

        if order_by:
            sql += f" ORDER BY {order_by}"
        if limit:
            sql += f" LIMIT {limit}"

        return sql

    def _query_hive(self, sql: str) -> list[dict]:
        """通过 PyHive 查询"""
        if not HAS_HIVE:
            return self._query_via_script(sql)

        conn = hive.connect(
            host=self.config.get("host", "192.168.120.77"),
            port=int(self.config.get("port", 10016)),
            username=self.config.get("user", "spark"),
            password=self.config.get("password", ""),
            database="dmp_ads",
            auth="CUSTOM",
        )
        cursor = conn.cursor()
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        return [dict(zip(columns, row)) for row in rows]

    def _query_duckdb(self, sql: str) -> list[dict]:
        """DuckDB 本地查询"""
        try:
            import duckdb
            db_path = PLATFORM_ROOT / "warehouse.duckdb"
            conn = duckdb.connect(str(db_path))
            # 将 SQL 中的表名映射到 DuckDB
            result = conn.execute(sql).fetchall()
            columns = [desc[0] for desc in conn.description]
            conn.close()
            return [dict(zip(columns, row)) for row in result]
        except Exception as e:
            print(f"[WARN] DuckDB 查询失败: {e}")
            return []

    def _query_oceanbase(self, sql: str) -> list[dict]:
        """OceanBase 查询"""
        if not HAS_MYSQL:
            return []
        conn = pymysql.connect(
            host=self.config.get("host", "192.168.120.74"),
            port=int(self.config.get("port", 2881)),
            user=self.config.get("user", ""),
            password=self.config.get("password", ""),
            database="dmp_ads",
            charset="utf8mb4",
        )
        cursor = conn.cursor()
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        return [dict(zip(columns, row)) for row in rows]

    def _query_via_script(self, sql: str) -> list[dict]:
        """降级方案：通过 Python 子进程 + 临时脚本查询"""
        import tempfile
        import os

        script = f'''
import sys; sys.path.insert(0, r"{PLATFORM_ROOT}")
from pyhive import hive
conn = hive.connect(host="{self.config.get('host', '192.168.120.77')}",
                    port={self.config.get('port', 10016)},
                    username="{self.config.get('user', 'spark')}",
                    password="{self.config.get('password', '')}",
                    database="dmp_ads", auth="CUSTOM")
cur = conn.cursor()
cur.execute("""{sql}""")
cols = [d[0] for d in cur.description]
import json
print(json.dumps([dict(zip(cols, row)) for row in cur.fetchall()], ensure_ascii=False, default=str))
conn.close()
'''
        try:
            result = subprocess.run(
                [sys.executable, "-c", script],
                capture_output=True, text=True, timeout=120,
                cwd=str(PLATFORM_ROOT),
            )
            return json.loads(result.stdout) if result.stdout else []
        except Exception as e:
            print(f"[ERROR] 查询失败: {e}")
            return []
