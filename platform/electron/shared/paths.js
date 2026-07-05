/**
 * 路径常量 — 多项目架构双路径支持
 *
 * PLATFORM_ROOT: 平台代码位置（engine/, .venv/, .claude/ 等）
 * PROJECT_ROOT:  活跃项目位置（project.yml, models/, config/ 等）
 *
 * PROJECT_ROOT 解析优先级：
 *   1. DBT_PROJECT 环境变量（指向具体项目目录）
 *   2. .active_project 文件
 *   3. 向上查找 project.yml（向后兼容）
 *   4. 回退到 PLATFORM_ROOT
 */

const path = require('path');
const fs = require('fs');

/**
 * 解析平台根目录（包含 engine/ 的目录）
 */
function resolvePlatformRoot() {
  // 1. DBT_WAREHOUSE 环境变量指向平台根
  if (process.env.DBT_WAREHOUSE && fs.existsSync(process.env.DBT_WAREHOUSE)) {
    return path.resolve(process.env.DBT_WAREHOUSE);
  }

  // 2. 自动向上查找 engine/ 目录
  let current = path.resolve(__dirname, '..');  // shared → electron
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(current, 'engine');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return current;
    }
    current = path.resolve(current, '..');
  }

  // 3. 回退
  return path.resolve(__dirname, '..', '..', '..');
}

/**
 * 解析项目根目录（含 project.yml 的活跃项目）
 */
function resolveProjectRoot(platformRoot) {
  if (!platformRoot) platformRoot = resolvePlatformRoot();

  // 1. DBT_PROJECT 环境变量 — 显式指向项目
  if (process.env.DBT_PROJECT && fs.existsSync(process.env.DBT_PROJECT)) {
    const p = path.resolve(process.env.DBT_PROJECT);
    if (fs.existsSync(path.join(p, 'project.yml'))) {
      return p;
    }
  }

  // 2. .active_project 文件
  const activeFile = path.join(platformRoot, '.active_project');
  if (fs.existsSync(activeFile)) {
    const projectPath = fs.readFileSync(activeFile, 'utf-8').trim();
    const candidate = path.resolve(platformRoot, projectPath);
    if (fs.existsSync(path.join(candidate, 'project.yml'))) {
      return candidate;
    }
  }

  // 3. 向上查找 project.yml（向后兼容：平台根 = 项目根）
  let current = path.resolve(__dirname, '..');  // shared → electron
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(current, 'project.yml');
    if (fs.existsSync(candidate)) {
      return current;
    }
    current = path.resolve(current, '..');
  }

  // 4. 回退到平台根
  return platformRoot;
}

// ── 平台根目录（不变） ──
const PLATFORM_ROOT = resolvePlatformRoot();

// ── 活跃项目根目录 ──
const PROJECT_ROOT = resolveProjectRoot(PLATFORM_ROOT);

// ── 平台路径（基于 PLATFORM_ROOT） ──
const DBT_WAREHOUSE = PLATFORM_ROOT;
const DBT_VENV_PYTHON = path.join(PLATFORM_ROOT, '.venv', 'Scripts', 'python.exe');
const DBT_EXE = path.join(PLATFORM_ROOT, '.venv', 'Scripts', 'dbt.exe');
const AGENTS_DIR = path.join(PLATFORM_ROOT, '.claude', 'agents');
const TEMPLATES_DIR = path.join(PLATFORM_ROOT, 'templates');
const PROJECTS_DIR = path.join(PLATFORM_ROOT, 'projects');
const ACTIVE_PROJECT_FILE = path.join(PLATFORM_ROOT, '.active_project');

// ── 项目路径（基于 PROJECT_ROOT） ──
const MODELS_DIR = path.join(PROJECT_ROOT, 'models');
const MACROS_DIR = path.join(PROJECT_ROOT, 'macros');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const PROJECT_CONFIG = path.join(PROJECT_ROOT, 'project.yml');

module.exports = {
  // 根路径
  PLATFORM_ROOT,
  PROJECT_ROOT,

  // 平台路径
  DBT_WAREHOUSE,
  DBT_VENV_PYTHON,
  DBT_EXE,
  AGENTS_DIR,
  TEMPLATES_DIR,
  PROJECTS_DIR,
  ACTIVE_PROJECT_FILE,

  // 项目路径
  MODELS_DIR,
  MACROS_DIR,
  CONFIG_DIR,
  PROJECT_CONFIG,

  // 工具
  resolvePlatformRoot,
  resolveProjectRoot,
};
