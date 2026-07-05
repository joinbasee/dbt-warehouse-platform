# 脚本目录

本目录包含项目专属 Python 脚本，**大部分非通用产品代码**。

## 通用脚本（可跨项目复用）

| 脚本 | 说明 |
|------|------|
| `setup_env.py` | 环境标准化：.env → profiles.yml |
| `validate_cross_db.py` | Hive ↔ OceanBase 跨库行数验证 |

## 项目专属脚本

其余脚本含 PEP 项目专属逻辑，归档参考见 `examples/pep/scripts_archive/`。

新产品通过 CLI 模板初始化，无需此目录下的项目专属脚本。
