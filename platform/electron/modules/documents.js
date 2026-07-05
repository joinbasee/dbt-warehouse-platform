/**
 * 模块3: 文档扫描
 *
 * 扫描设计文档目录，返回文件清单供 DeliverablesPanel 展示。
 */

const path = require('path');
const fs = require('fs');

/**
 * 扫描设计文档目录
 * @param {string} projectRoot — 项目根目录
 * @returns {object[]} 文档列表
 */
function scanDocuments(projectRoot) {
  const docs = [];

  const scanDir = (dir, prefix) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('~') || entry.name.startsWith('.')) continue;
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), prefix + entry.name + '/');
        } else if (/\.(md|docx|sql|yml|yaml|xlsx)$/i.test(entry.name)) {
          const fullPath = path.join(dir, entry.name);
          try {
            const stat = fs.statSync(fullPath);
            docs.push({
              name: entry.name,
              path: prefix + entry.name,
              fullPath,
              size: stat.size,
              modifiedAt: stat.mtime.toISOString(),
              type: entry.name.endsWith('.md') ? 'markdown'
                : entry.name.endsWith('.docx') ? 'docx'
                : entry.name.endsWith('.xlsx') ? 'excel'
                : entry.name.endsWith('.yml') || entry.name.endsWith('.yaml') ? 'yaml'
                : entry.name.endsWith('.sql') ? 'sql' : 'other',
            });
          } catch (e) { /* skip unreadable files */ }
        }
      }
    } catch (e) { /* skip unreadable dirs */ }
  };

  // Design document directories
  const designDirs = [
    path.join(projectRoot, '规范设计'),
    path.join(projectRoot, '设计文档'),
    path.join(projectRoot, '数仓智能dbt设计流程'),
  ];
  for (const d of designDirs) {
    if (fs.existsSync(d)) scanDir(d, '');
  }

  // Scan top-level report files (generic — matches project name from project.yml)
  try {
    const rootFiles = fs.readdirSync(projectRoot);
    const reportPatterns = ['.md', '.docx', '.pdf'];
    for (const file of rootFiles) {
      const ext = path.extname(file).toLowerCase();
      if (reportPatterns.includes(ext) && !file.startsWith('~') && !file.startsWith('.')) {
        const fullPath = path.join(projectRoot, file);
        try {
          const stat = fs.statSync(fullPath);
          docs.push({
            name: file,
            path: file,
            fullPath,
            size: stat.size,
            modifiedAt: stat.mtime.toISOString(),
            type: ext === '.md' ? 'markdown' : ext === '.docx' ? 'docx' : 'other',
          });
        } catch (e) { /* skip */ }
      }
    }
  } catch (e) { /* skip */ }

  return docs;
}

module.exports = { scanDocuments };
