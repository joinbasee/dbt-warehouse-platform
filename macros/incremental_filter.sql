{#
    增量过滤宏
    基于日期字段过滤增量数据，用于 DWD 清洗阶段
    用法:
        {{ incremental_filter('erdat', days_lookback=7) }}
        {{ incremental_filter('fkdat') }}  -- 默认当天
#}
{% macro incremental_filter(date_column, days_lookback=0) -%}
    {% if is_incremental() %}
        CAST({{ date_column }} AS DATE) >= CURRENT_DATE - INTERVAL '{{ days_lookback }}' DAY
    {% else %}
        1=1
    {% endif %}
{%- endmacro %}
