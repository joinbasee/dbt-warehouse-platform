{#
    GROUP_CONCAT 方言适配宏
    用法: {{ group_concat('column_name', separator="', '") }}

    适配目标:
      - DuckDB: STRING_AGG
      - Spark/Hive: CONCAT_WS + COLLECT_LIST
      - MySQL/OceanBase: GROUP_CONCAT ... SEPARATOR
#}
{% macro group_concat(expr, separator="', '") -%}
    {% if target.type == 'duckdb' -%}
        STRING_AGG(CAST({{ expr }} AS VARCHAR), {{ separator }})
    {%- elif target.type == 'spark' -%}
        CONCAT_WS({{ separator }}, COLLECT_LIST({{ expr }}))
    {%- else -%}
        GROUP_CONCAT({{ expr }} SEPARATOR {{ separator }})
    {%- endif %}
{%- endmacro %}
