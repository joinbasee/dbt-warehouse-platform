/**
 * 模块2: DAG 血缘计算
 *
 * 解析所有模型的 ref() 和 source() 引用，构建完整的 DAG 节点-边图。
 * 纯函数，与 engine/validators/lineage.py 对称。
 */

const path = require('path');
const fs = require('fs');

/**
 * 计算完整血缘 DAG
 * @param {string} projectRoot — 项目根目录
 * @returns {{ nodes: object[], edges: object[], nodeMap: object, layerCounts: object }}
 */
function computeLineage(projectRoot) {
  const nodes = [];
  const edges = [];
  const nodeMap = {};
  let nodeId = 0;

  const addNode = (name, layer, domain, filePath, extra = {}) => {
    if (nodeMap[name]) return nodeMap[name];
    const id = `n${nodeId++}`;
    const node = { id, name, layer, domain, path: filePath, ...extra };
    nodes.push(node);
    nodeMap[name] = id;
    return id;
  };

  const addEdge = (fromName, toName, type) => {
    const fromId = nodeMap[fromName];
    const toId = nodeMap[toName];
    if (fromId && toId && fromId !== toId) {
      const key = `${fromId}->${toId}`;
      if (!edges.some(e => e.key === key)) {
        edges.push({ key, from: fromId, to: toId, type });
      }
    }
  };

  // Scan DWD models
  const dwdPath = path.join(projectRoot, 'models', 'dwd');
  if (fs.existsSync(dwdPath)) {
    for (const domain of fs.readdirSync(dwdPath)) {
      const dp = path.join(dwdPath, domain);
      if (!fs.statSync(dp).isDirectory()) continue;
      for (const file of fs.readdirSync(dp)) {
        if (!file.endsWith('.sql')) continue;
        const modelName = file.replace('.sql', '');
        const content = fs.readFileSync(path.join(dp, file), 'utf-8');
        const sourceMatch = content.match(/\{\{\s*source\('ods',\s*'([^']+)'\)\s*\}\}/);
        const sourceName = sourceMatch ? sourceMatch[1] : null;
        addNode(modelName, 'DWD', domain, `models/dwd/${domain}/${file}`, {
          sourceTable: sourceName,
          isIncremental: content.includes('is_incremental'),
          hasDedup: content.includes('ROW_NUMBER'),
        });
        const refs = content.match(/\{\{\s*ref\('([^']+)'\)\s*\}\}/g);
        if (refs) {
          for (const r of refs) {
            const refName = r.match(/ref\('([^']+)'\)/)[1];
            addEdge(modelName, refName, 'ref');
          }
        }
      }
    }
  }

  // Scan DWS / DIM / ADS (recursive)
  const scanModels = (dirPath, layer, domain = null) => {
    if (!fs.existsSync(dirPath)) return;
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scanModels(path.join(dirPath, entry.name), layer, domain || entry.name);
      } else if (entry.name.endsWith('.sql')) {
        const modelName = entry.name.replace('.sql', '');
        const content = fs.readFileSync(path.join(dirPath, entry.name), 'utf-8');
        addNode(modelName, layer, domain || 'common', path.relative(projectRoot, path.join(dirPath, entry.name)));
        const refs = content.match(/\{\{\s*ref\('([^']+)'\)\s*\}\}/g);
        if (refs) {
          for (const r of refs) {
            const refName = r.match(/ref\('([^']+)'\)/)[1];
            addEdge(modelName, refName, 'ref');
          }
        }
      }
    }
  };

  scanModels(path.join(projectRoot, 'models', 'dws'), 'DWS');
  scanModels(path.join(projectRoot, 'models', 'dim'), 'DIM');
  scanModels(path.join(projectRoot, 'models', 'ads'), 'ADS');

  // Add ODS source nodes
  for (const node of nodes) {
    if (node.sourceTable) {
      const odsName = `ods_sap_${node.sourceTable}`;
      addNode(odsName, 'ODS', node.domain || 'unknown', '—', { isSource: true });
      addEdge(node.name, odsName, 'source');
    }
  }

  // Layer counts
  const layerCounts = {};
  for (const n of nodes) {
    layerCounts[n.layer] = (layerCounts[n.layer] || 0) + 1;
  }

  return { nodes, edges, nodeMap, layerCounts };
}

module.exports = { computeLineage };
