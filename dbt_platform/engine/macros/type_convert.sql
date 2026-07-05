# -*- coding: utf-8 -*-
"""
通用类型转换 Jinja 宏

替代原有的 sap_date / sap_string / sap_flag / sap_decimal。
通过适配器参数支持多种源系统，而非仅 SAP ECC。

用法:
    {{ type_convert('erdat', 'date', adapter='sap_ecc') }}
    {{ type_convert('name1', 'string', default="'UNKNOWN'", adapter='sap_ecc') }}
    {{ type_convert('amount', 'number', precision='15,2', adapter='mysql') }}
    {{ type_convert('is_active', 'flag', adapter='sap_ecc') }}
    {{ type_convert('created_at', 'date', adapter='mysql') }}

若省略 adapter，默认使用 project.yml 中配置的 source.adapter。
"""
{% macro type_convert(column_name, target_type, adapter=none, default=none, precision='15,2') -%}
    {%- if adapter is none -%}
        {%- set adapter = var('source_adapter', 'sap_ecc') -%}
    {%- endif -%}

    {%- if target_type == 'string' -%}
        {%- if adapter == 'sap_ecc' -%}
            COALESCE(TRIM(CAST({{ column_name }} AS STRING)), {{ default | default("''") }})
        {%- elif adapter == 'mysql' -%}
            COALESCE(TRIM({{ column_name }}), {{ default | default("''") }})
        {%- else -%}
            COALESCE(CAST({{ column_name }} AS STRING), {{ default | default("''") }})
        {%- endif -%}

    {%- elif target_type == 'date' -%}
        {%- if adapter == 'sap_ecc' -%}
            CAST(FROM_UNIXTIME(UNIX_TIMESTAMP(CAST({{ column_name }} AS STRING), 'yyyyMMdd'), 'yyyy-MM-dd') AS DATE)
        {%- elif adapter == 'mysql' -%}
            CAST({{ column_name }} AS DATE)
        {%- else -%}
            CAST({{ column_name }} AS DATE)
        {%- endif -%}

    {%- elif target_type in ('number', 'decimal') -%}
        CAST(COALESCE({{ column_name }}, 0) AS DECIMAL({{ precision }}))

    {%- elif target_type in ('flag', 'boolean') -%}
        {%- if adapter == 'sap_ecc' -%}
            CASE WHEN CAST({{ column_name }} AS STRING) = 'X' THEN '1' ELSE '0' END
        {%- elif adapter == 'mysql' -%}
            CASE WHEN {{ column_name }} = 1 THEN '1' ELSE '0' END
        {%- else -%}
            CAST({{ column_name }} AS STRING)
        {%- endif -%}

    {%- else -%}
        {{ column_name }}
    {%- endif -%}
{%- endmacro %}
