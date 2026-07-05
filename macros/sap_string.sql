{#
    SAP 字符串清洗宏
    TRIM + 空值替换为默认值
    用法: {{ sap_string('name1', default="'UNKNOWN'") }}
#}
{% macro sap_string(column_name, default="''") -%}
    COALESCE(
        TRIM(CAST({{ column_name }} AS STRING)),
        {{ default }}
    )
{%- endmacro %}

{#
    数字型默认值处理
    用法: {{ sap_decimal('netwr', default='0') }}
#}
{% macro sap_decimal(column_name, precision='15,2', default='0') -%}
    CAST(COALESCE({{ column_name }}, {{ default }}) AS DECIMAL({{ precision }}))
{%- endmacro %}
