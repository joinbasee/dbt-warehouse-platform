# -*- coding: utf-8 -*-
"""
SAP ECC 源系统适配器

处理 SAP ABAP 数据字典的特有约定:
  - 日期: yyyyMMdd 字符串 → DATE
  - 布尔: 'X' / '' → '1' / '0'
  - 数值: NULL → 0
  - 字符串: TRIM + 默认值
  - 集团: mandt 字段参与去重
  - 排序: erdat / aedat 等变更日期字段
"""
from dbt_platform.engine.adapters.base import SourceAdapter


class SapEccAdapter(SourceAdapter):

    @property
    def name(self) -> str:
        return "sap_ecc"

    @property
    def display_name(self) -> str:
        return "SAP ECC"

    # ── 类型转换 ──

    def string_to_sql(self, col: str, default: str = "''") -> str:
        return f"COALESCE(TRIM(CAST({col} AS STRING)), {default})"

    def date_to_sql(self, col: str) -> str:
        return (
            f"CAST(FROM_UNIXTIME(UNIX_TIMESTAMP(CAST({col} AS STRING), "
            f"'yyyyMMdd'), 'yyyy-MM-dd') AS DATE)"
        )

    def number_to_sql(self, col: str, precision: str = "15,2") -> str:
        return f"CAST(COALESCE({col}, 0) AS DECIMAL({precision}))"

    def flag_to_sql(self, col: str) -> str:
        return f"CASE WHEN CAST({col} AS STRING) = 'X' THEN '1' ELSE '0' END"

    # ── 元数据发现 ──

    def discover_tables(self, connection) -> list[str]:
        """通过 SAP DD 字典表发现所有表"""
        cursor = connection.cursor()
        cursor.execute("SELECT DISTINCT tabname FROM dmp_ods.dd02t WHERE ddlanguage = 'M'")
        return [row[0].lower() for row in cursor.fetchall()]

    def discover_columns(self, connection, table: str) -> list[dict]:
        """通过 SAP DD 字典表发现列信息"""
        cursor = connection.cursor()
        sql = f"""
            SELECT f.fieldname, f.position, f.keyflag, f.datatype, f.leng,
                   t.ddtext
            FROM dmp_ods.dd03l f
            LEFT JOIN dmp_ods.dd04t t
              ON f.rollname = t.rollname AND t.ddlanguage = 'M'
            WHERE f.tabname = '{table.upper()}'
            ORDER BY f.position
        """
        cursor.execute(sql)
        return [
            {
                "name": row[0].lower(),
                "position": row[1],
                "is_key": row[2] == "X",
                "data_type": row[3],
                "length": row[4],
                "description": row[5] or "",
            }
            for row in cursor.fetchall()
        ]

    # ── 去重策略 ──

    def dedup_keys(self, table: str) -> list[str]:
        """SAP 去重键：业务主键 + mandt"""
        return ["{pk}", "mandt"]  # {pk} 由具体表的业务主键替换

    def dedup_order(self, table: str) -> str:
        """SAP 去重排序：优先用变更日期，其次创建日期"""
        date_candidates = ["aedat", "erdat", "budat", "fldat", "cpudt"]
        return f"COALESCE({', '.join(date_candidates)}) DESC"

    # ── 命名转换 ──

    @staticmethod
    def sap_to_english(sap_name: str) -> str:
        """SAP 缩写 → 英文语义名（常见映射表）"""
        mapping = {
            "vbeln": "document_no",
            "posnr": "item_no",
            "kunnr": "customer_code",
            "matnr": "material_code",
            "werks": "plant_code",
            "lgort": "storage_location",
            "bukrs": "company_code",
            "vkorg": "sales_org",
            "vtweg": "dist_channel",
            "spart": "product_dept",
            "waers": "currency",
            "meins": "unit",
            "netwr": "net_amount",
            "kbetr": "condition_rate",
            "fkimg": "invoice_quantity",
            "vrkme": "sales_unit",
            "erdat": "create_date",
            "ernam": "created_by",
            "aedat": "change_date",
            "aenam": "changed_by",
            "fkdat": "invoice_date",
            "fkart": "invoice_type",
            "fksto": "is_cancelled",
            "xblnr": "external_doc_no",
            "stceg": "vat_reg_no",
            "name1": "name",
            "ort01": "city",
            "pstlz": "postal_code",
            "regio": "region",
            "land1": "country",
            "telf1": "telephone",
            "stras": "street",
        }
        return mapping.get(sap_name.lower(), sap_name.lower())
