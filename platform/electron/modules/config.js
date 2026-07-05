/**
 * 配置持久化管理器
 *
 * 从 Electron userData 目录加载/保存平台配置。
 */

const path = require('path');
const fs = require('fs');

/**
 * 创建配置管理器
 * @param {string} userDataPath — Electron app.getPath('userData')
 */
function createConfigManager(userDataPath) {
  const CONFIG_PATH = path.join(userDataPath, 'dbt-platform-config.json');

  const DEFAULTS = {
    claudeWorkDir: null,     // null → 自动使用 projectRoot
    autoStartClaude: false,
    dbtTarget: 'dev',
    envVars: {},
    projectPath: null,        // 用户选择的项目路径
  };

  /** 加载配置 */
  function load() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        return { ...DEFAULTS, ...data };
      }
    } catch (e) { /* ignore corrupt file */ }
    return { ...DEFAULTS };
  }

  /** 保存配置 */
  function save(config) {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) { /* ignore write errors */ }
  }

  /** 更新配置（合并写入） */
  function update(updates) {
    const current = load();
    const merged = { ...current, ...updates };
    save(merged);
    return merged;
  }

  // 初始加载
  const config = load();

  return { config, load, save, update, CONFIG_PATH };
}

module.exports = { createConfigManager };
