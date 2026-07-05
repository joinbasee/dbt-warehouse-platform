{#
    审计字段宏
    为 DWD/DWS 模型统一添加 s_creator, s_create_time 等审计字段
    用法: {{ audit_columns() }}
#}
{% macro audit_columns() -%}
    'system'            AS s_creator,
    'system'            AS s_creator_name,
    CURRENT_TIMESTAMP() AS s_create_time,
    'system'            AS s_modifier,
    'system'            AS s_modifier_name,
    CURRENT_TIMESTAMP() AS s_modify_time,
    110                 AS s_state
{%- endmacro %}
