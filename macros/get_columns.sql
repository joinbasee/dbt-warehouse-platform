{#-
    get_columns — 获取表字段列表（通用宏）

    用法:
        {{ get_columns('dwd_order_vbrk') }}

    输出: column_name|data_type（每行一个字段）

    database 和 schema 从 profiles.yml 的当前 target 自动读取。
-#}
{% macro get_columns(relation_name) %}
    {%- set columns = adapter.get_columns_in_relation(
        api.Relation.create(
            database=target.database,
            schema=target.schema,
            identifier=relation_name
        )
    ) -%}
    {% for col in columns %}
{{ col.column }}|{{ col.data_type }}
    {% endfor %}
{% endmacro %}
