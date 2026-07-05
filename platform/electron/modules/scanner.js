/**
 * 模块1: 项目扫描器
 *
 * 扫描 DWD 模型、宏、sources.yml，缓存结果。
 * 纯函数，通过参数获取路径和状态，无全局变量依赖。
 */

const path = require('path');
const fs = require('fs');

// ── 业务域代码 → 中文名映射（从 project.yml 动态加载） ──
function _loadDomainMap(projectRoot) {
  try {
    const yaml = require('yaml');
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(projectRoot, 'project.yml');
    if (fs.existsSync(configPath)) {
      const config = yaml.parse(fs.readFileSync(configPath, 'utf-8'));
      const map = {};
      (config.domains || []).forEach(d => { map[d.code] = d.name; });
      return map;
    }
  } catch (e) { /* fall through */ }
  return {}; // 回退空映射
}

/**
 * 扫描项目结构
 * @param {string} projectRoot — 项目根目录
 * @param {object} [domainMap] — 业务域代码→中文名映射（从 project.yml domains 段读取）
 * @returns {{ models: object[], macros: object[], sources: object[], domains: object, stats: object, updatedAt: string }}
 */
function scanProject(projectRoot, domainMap) {
  const domainNameMap = domainMap || _loadDomainMap(projectRoot);
  const result = {
    models: [],
    macros: [],
    sources: [],
    domains: {},
    stats: { modelCount: 0, macroCount: 0, sourceCount: 0, domainCount: 0, connectionCount: 5 },
    updatedAt: new Date().toISOString(),
  };

  try {
    // Scan DWD models
    const dwdPath = path.join(projectRoot, 'models', 'dwd');
    if (fs.existsSync(dwdPath)) {
      const domains = fs.readdirSync(dwdPath);
      for (const domain of domains) {
        const domainPath = path.join(dwdPath, domain);
        if (!fs.statSync(domainPath).isDirectory()) continue;
        const models = [];
        const files = fs.readdirSync(domainPath);
        for (const file of files) {
          if (file.endsWith('.sql')) {
            const modelName = file.replace('.sql', '');
            const fullPath = path.join(domainPath, file);
            const stat = fs.statSync(fullPath);
            const content = fs.readFileSync(fullPath, 'utf-8');
            const preview = content.slice(0, 300);
            const model = {
              name: modelName,
              domain,
              path: `models/dwd/${domain}/${file}`,
              fullPath,
              preview,
              size: content.split('\n').length,
              sizeBytes: stat.size,
              hasIncremental: content.includes('is_incremental'),
              hasDedup: content.includes('ROW_NUMBER'),
              modifiedAt: stat.mtime.toISOString(),
            };
            models.push(model);
          }
        }
        if (models.length > 0) {
          result.domains[domain] = { name: getDomainName(domain, domainNameMap), models };
          result.models.push(...models);
        }
      }
    }

    // Scan macros
    const macrosPath = path.join(projectRoot, 'macros');
    if (fs.existsSync(macrosPath)) {
      const macroFiles = fs.readdirSync(macrosPath).filter(f => f.endsWith('.sql'));
      for (const file of macroFiles) {
        const content = fs.readFileSync(path.join(macrosPath, file), 'utf-8');
        result.macros.push({
          name: file.replace('.sql', ''),
          path: `macros/${file}`,
          content,
          description: extractMacroDescription(content),
          params: extractMacroParams(content),
        });
      }
    }

    // Scan sources
    const sourcesPath = path.join(projectRoot, 'models', 'sources.yml');
    if (fs.existsSync(sourcesPath)) {
      const yml = fs.readFileSync(sourcesPath, 'utf-8');
      const tableMatches = yml.match(/- name: ods_sap_(\w+)/g);
      if (tableMatches) {
        result.sources = tableMatches.map(m => {
          const name = m.replace('- name: ', '');
          const descMatch = yml.slice(yml.indexOf(name)).match(/description:\s*"([^"]+)"/);
          return {
            name,
            tableName: name.replace('ods_sap_', '').toUpperCase(),
            description: descMatch ? descMatch[1] : '',
          };
        });
      }
    }

    result.stats.modelCount = result.models.length;
    result.stats.macroCount = result.macros.length;
    result.stats.sourceCount = result.sources.length;
    result.stats.domainCount = Object.keys(result.domains).length;
  } catch (e) {
    console.error('Project scan error:', e.message);
  }

  return result;
}

function getDomainName(code, map) {
  return (map && map[code]) || code;
}

function extractMacroDescription(content) {
  const match = content.match(/\{#\s*\n?\s*(.+?)\s*\n/);
  return match ? match[1].trim() : '';
}

function extractMacroParams(content) {
  const match = content.match(/用法:\s*(.+)/);
  return match ? match[1] : '';
}

module.exports = { scanProject, getDomainName, extractMacroDescription, extractMacroParams };
