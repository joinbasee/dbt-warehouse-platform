{#-
    alter_add_columns — 动态 ALTER TABLE 加列（通用宏）

    用法:
        {{ alter_add_columns('dws_fi_invoice_partner', 'billing_type', 'STRING', '开票类型') }}

    注意: 项目专属的批量 ALTER 宏已迁移至 examples/pep/macros/alter_add_columns.sql

    推荐替代方案: 使用 dbt on_schema_change 配置:
        {{ config(materialized='table', on_schema_change='append_new_columns') }}
-#}
{% macro alter_add_columns(table_name, column_name, column_type, comment) %}
    {% set sql %}
        ALTER TABLE {{ table_name }} ADD COLUMNS (
            {{ column_name }} {{ column_type }} COMMENT '{{ comment }}'
        );
    {% endset %}
    {{ return(sql) }}
{% endmacro %}
