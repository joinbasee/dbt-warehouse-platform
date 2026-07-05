{#
    SAP Flag 转换宏
    将 SAP 标记字段 ('X' / '') 转换为布尔整数 (1 / 0)
    用法: {{ sap_flag('fksto') }}
#}
{% macro sap_flag(column_name) -%}
    CASE WHEN CAST({{ column_name }} AS STRING) = 'X' THEN '1' ELSE '0' END
{%- endmacro %}
