{#
#     Layer: DWD
#     Description: 测试 — 客户信息清洗
#     Materialized: table
#}
{{
    config(
        materialized='table',
        schema='dmp_dw'
    )
}}

-- 构造测试数据
WITH source AS (
    SELECT * FROM (VALUES
        ('C001', '张三', '北京'),
        ('C002', '李四', '上海'),
        ('C003', '王五', '广州')
    ) AS t(customer_code, customer_name, city)
)

SELECT
    CAST(customer_code AS VARCHAR) AS customer_code,
    CAST(customer_name AS VARCHAR) AS customer_name,
    CAST(city AS VARCHAR) AS city,
    'system' AS s_creator,
    'system' AS s_creator_name,
    CURRENT_TIMESTAMP AS s_create_time,
    'system' AS s_modifier,
    'system' AS s_modifier_name,
    CURRENT_TIMESTAMP AS s_modify_time,
    110 AS s_state
FROM source
