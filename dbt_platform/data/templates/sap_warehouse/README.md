# {{ PROJECT_NAME }}

智能数仓建设平台 — SAP ECC 适配器项目模板。

## 快速开始

1. 编辑 `project.yml` 填入业务域和场景
2. `cp config/.env.example .env` 并填入数据库凭证
3. `python scripts/setup_env.py` 生成 profiles.yml
4. `dbt parse --target dev` 验证
5. `dbt run --target hive` 生产执行
