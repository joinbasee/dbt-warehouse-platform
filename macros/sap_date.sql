{#
    SAP 日期转换宏
    将 SAP 日期字符串 (YYYYMMDD) 转换为标准 DATE 类型
    用法: {{ sap_date('erdat') }}
#}
{% macro sap_date(column_name) -%}
    CAST(FROM_UNIXTIME(UNIX_TIMESTAMP(CAST({{ column_name }} AS STRING), 'yyyyMMdd'), 'yyyy-MM-dd') AS DATE)
{%- endmacro %}
