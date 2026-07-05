import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DOMAIN_INFO } from '../data/agents.js';

const LAYER_ORDER = ['ODS', 'DWD', 'DWS', 'DIM', 'ADS'];
const LAYER_COLORS = { ODS: '#8E8E93', DWD: '#007AFF', DWS: '#34C759', DIM: '#FF9500', ADS: '#AF52DE' };
const LAYER_LABELS = { ODS: 'ODS 源表', DWD: 'DWD 清洗', DWS: 'DWS 汇总', DIM: 'DIM 维度', ADS: 'ADS 应用' };
const DOMAIN_COLORS = {
  order: '#007AFF', bj: '#34C759', fi: '#FF9500', md: '#AF52DE', xt: '#FF3B30', stock: '#5AC8FA', common: '#8E8E93', unknown: '#8E8E93',
};

export default function LineagePanel() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLayer, setActiveLayer] = useState('all');
  const [layout, setLayout] = useState({});
  const svgRef = useRef(null);

  // Load lineage data
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      setLoading(false);
      return;
    }
    api.computeLineage().then(data => {
      setGraphData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Compute layout positions
  const computedLayout = useMemo(() => {
    if (!graphData?.nodes?.length) return { nodes: [], edges: [], width: 1200, height: 600 };

    const { nodes: rawNodes, edges: rawEdges } = graphData;
    const filteredNodes = rawNodes.filter(n => {
      if (activeLayer !== 'all' && n.layer !== activeLayer) return false;
      if (searchTerm && !n.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // Group nodes by layer
    const layerGroups = {};
    for (const n of filteredNodes) {
      if (!layerGroups[n.layer]) layerGroups[n.layer] = [];
      layerGroups[n.layer].push(n);
    }

    // Arrange by layer order
    const COL_WIDTH = 220;
    const NODE_H = 22;
    const NODE_GAP = 4;
    const PADDING_X = 80;
    const PADDING_Y = 40;

    let totalWidth = 0;
    let maxH = 0;

    const orderedLayers = Object.keys(layerGroups).sort((a, b) =>
      (LAYER_ORDER.indexOf(a) + 1 || 99) - (LAYER_ORDER.indexOf(b) + 1 || 99)
    );

    const layoutNodes = [];
    let colX = PADDING_X;

    for (const layer of orderedLayers) {
      const group = layerGroups[layer];
      // Sort within layer by domain then name
      group.sort((a, b) => {
        if (a.domain !== b.domain) return (a.domain || '').localeCompare(b.domain || '');
        return a.name.localeCompare(b.name);
      });

      let y = PADDING_Y;
      for (const node of group) {
        layoutNodes.push({ ...node, x: colX, y, w: COL_WIDTH - 10, h: NODE_H });
        y += NODE_H + NODE_GAP;
      }
      maxH = Math.max(maxH, y + PADDING_Y);

      // Sort domain groups with small gaps
      const domains = [...new Set(group.map(n => n.domain))];
      let dy = PADDING_Y + 6;
      for (const domain of domains) {
        const dNodes = group.filter(n => n.domain === domain);
        for (const node of dNodes) {
          const idx = layoutNodes.findIndex(ln => ln.id === node.id);
          if (idx >= 0) layoutNodes[idx].y = dy;
          dy += NODE_H + NODE_GAP;
        }
        dy += 10; // domain gap
      }
      maxH = Math.max(maxH, dy + PADDING_Y);

      colX += COL_WIDTH;
      totalWidth = colX;
    }

    // Filter edges to visible nodes
    const layoutEdges = rawEdges.filter(e => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to));

    return { nodes: layoutNodes, edges: layoutEdges, width: Math.max(totalWidth + PADDING_X, 1200), height: Math.max(maxH, 600) };
  }, [graphData, activeLayer, searchTerm]);

  // Connected nodes for hover highlight
  const connectedIds = useMemo(() => {
    if (!hoveredNode || !computedLayout.edges) return new Set();
    const ids = new Set([hoveredNode.id]);
    for (const e of computedLayout.edges) {
      if (e.from === hoveredNode.id) ids.add(e.to);
      if (e.to === hoveredNode.id) ids.add(e.from);
    }
    return ids;
  }, [hoveredNode, computedLayout.edges]);

  // Upstream/downstream chains for selected node
  const selectedChains = useMemo(() => {
    if (!selectedNode || !computedLayout.edges) return { upstream: [], downstream: [] };
    const upstream = [];
    const downstream = [];

    // Find all upstream (what this model depends on)
    const visited = new Set();
    const traverse = (id, dir, arr) => {
      if (visited.has(id)) return;
      visited.add(id);
      for (const e of computedLayout.edges) {
        if (dir === 'up' && e.from === id) {
          const node = computedLayout.nodes.find(n => n.id === e.to);
          if (node) { arr.push(node); traverse(e.to, dir, arr); }
        }
        if (dir === 'down' && e.to === id) {
          const node = computedLayout.nodes.find(n => n.id === e.from);
          if (node) { arr.push(node); traverse(e.from, dir, arr); }
        }
      }
    };
    traverse(selectedNode.id, 'up', upstream);
    traverse(selectedNode.id, 'down', downstream);
    return { upstream, downstream };
  }, [selectedNode, computedLayout]);

  const handleSvgClick = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setSelectedNode(null);
    }
  }, []);

  // Find node by id
  const findNode = (id) => computedLayout.nodes.find(n => n.id === id);
  const findRelNodes = (nodeId) => {
    const rels = [];
    for (const e of computedLayout.edges) {
      if (e.from === nodeId) { const n = findNode(e.to); if (n) rels.push({ node: n, type: 'depends on', edge: e }); }
      if (e.to === nodeId) { const n = findNode(e.from); if (n) rels.push({ node: n, type: 'referenced by', edge: e }); }
    }
    return rels;
  };

  if (loading) {
    return (
      <div className="lineage-layout">
        <h1 className="page-title">模型血缘</h1>
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="empty-state-text">正在解析 71 个模型的 ref/source 引用关系...</div>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="lineage-layout">
        <h1 className="page-title">模型血缘</h1>
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="empty-state-icon">◎</div>
          <div className="empty-state-text">请在 Electron 应用中查看完整血缘图</div>
          <div className="empty-state-hint">浏览器环境无法读取本地 SQL 模型文件</div>
        </div>
      </div>
    );
  }

  const { layerCounts = {} } = graphData;
  const totalNodes = computedLayout.nodes.length;
  const totalEdges = computedLayout.edges.length;

  return (
    <div className="lineage-layout">
      {/* Header */}
      <div className="lineage-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 className="page-title">模型血缘</h1>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {totalNodes} 节点 · {totalEdges} 条引用关系
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="models-search"
            placeholder="搜索模型名..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 160 }}
          />
          <select className="dbt-target-select" value={activeLayer} onChange={e => setActiveLayer(e.target.value)}>
            <option value="all">全部层级</option>
            {LAYER_ORDER.map(l => (
              <option key={l} value={l}>{LAYER_LABELS[l]} ({layerCounts[l] || 0})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Layer Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        {LAYER_ORDER.map(l => (
          <div key={l} style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--card)',
            boxShadow: 'var(--shadow-sm)', borderLeft: `3px solid ${LAYER_COLORS[l]}`,
            opacity: activeLayer === 'all' || activeLayer === l ? 1 : 0.4,
            cursor: 'pointer', transition: 'all var(--transition)',
          }} onClick={() => setActiveLayer(activeLayer === l ? 'all' : l)}>
            <div style={{ fontSize: 9, fontWeight: 600, color: LAYER_COLORS[l] }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{layerCounts[l] || 0}</div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{LAYER_LABELS[l]}</div>
          </div>
        ))}
      </div>

      {/* Main DAG Area */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 300px' : '1fr', gap: 14, flex: 1, minHeight: 0 }}>
        {/* SVG Graph */}
        <div style={{
          background: 'var(--card)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)', overflow: 'auto', position: 'relative',
          minHeight: Math.min(computedLayout.height, 700),
        }}>
          <svg
            ref={svgRef}
            width={computedLayout.width}
            height={computedLayout.height}
            onClick={handleSvgClick}
            style={{ minWidth: '100%' }}
          >
            {/* Grid lines */}
            {LAYER_ORDER.filter(l => computedLayout.nodes.some(n => n.layer === l)).map(l => {
              const ln = computedLayout.nodes.find(n => n.layer === l);
              if (!ln) return null;
              return (
                <g key={l}>
                  <line x1={ln.x - 20} y1={20} x2={ln.x - 20} y2={computedLayout.height - 10}
                    stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray="4 4" />
                  <text x={ln.x + 80} y={24} fontSize={10} fill={LAYER_COLORS[l]} fontWeight={600}
                    textAnchor="middle">
                    {l} · {LAYER_LABELS[l]}
                  </text>
                </g>
              );
            })}

            {/* Edges */}
            {computedLayout.edges.map((e, i) => {
              const fromNode = computedLayout.nodes.find(n => n.id === e.from);
              const toNode = computedLayout.nodes.find(n => n.id === e.to);
              if (!fromNode || !toNode) return null;
              const isHighlighted = hoveredNode && (hoveredNode.id === e.from || hoveredNode.id === e.to);
              const x1 = fromNode.x + 170;
              const y1 = fromNode.y + 11;
              const x2 = toNode.x;
              const y2 = toNode.y + 11;
              const cx1 = x1 + (x2 - x1) * 0.4;
              const cx2 = x1 + (x2 - x1) * 0.6;
              const path = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path d={path} fill="none"
                    stroke={isHighlighted ? '#007AFF' : 'rgba(0,0,0,0.1)'}
                    strokeWidth={isHighlighted ? 2 : 0.8}
                    opacity={hoveredNode && !isHighlighted ? 0.15 : 0.7}
                  />
                  {/* Arrow marker at end */}
                  <polygon
                    points={`${x2 - 4},${y2 - 3} ${x2},${y2} ${x2 - 4},${y2 + 3}`}
                    fill={isHighlighted ? '#007AFF' : 'rgba(0,0,0,0.15)'}
                    opacity={hoveredNode && !isHighlighted ? 0.15 : 0.7}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {computedLayout.nodes.map(node => {
              const isHovered = hoveredNode?.id === node.id;
              const isSel = selectedNode?.id === node.id;
              const isConnected = connectedIds.has(node.id);
              const domainColor = DOMAIN_COLORS[node.domain] || '#8E8E93';
              const opacity = hoveredNode ? (isHovered || isConnected ? 1 : 0.3) : 1;

              return (
                <g key={node.id} opacity={opacity} style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(selectedNode?.id === node.id ? null : node); }}
                >
                  {/* Background highlight for hovered/selected */}
                  {(isHovered || isSel) && (
                    <rect x={node.x - 2} y={node.y - 2} width={172} height={node.h + 4}
                      rx={4} fill="rgba(0,122,255,0.06)" />
                  )}
                  {/* Domain color bar */}
                  <rect x={node.x} y={node.y} width={3} height={node.h} rx={1} fill={domainColor} />
                  {/* Layer tag */}
                  <rect x={node.x + 7} y={node.y + 4} width={24} height={14} rx={3}
                    fill={LAYER_COLORS[node.layer] || '#999'} opacity={0.85} />
                  <text x={node.x + 19} y={node.y + 14} fontSize={7} fill="#fff" fontWeight={600}
                    textAnchor="middle">{node.layer}</text>
                  {/* Model name */}
                  <text x={node.x + 37} y={node.y + 15} fontSize={10} fill="#1D1D1F"
                    fontFamily="SF Mono, Consolas, monospace" fontWeight={isSel ? 700 : 400}>
                    {node.name.length > 24 ? node.name.slice(0, 22) + '…' : node.name}
                  </text>
                  {/* Source indicator */}
                  {node.sourceTable && (
                    <text x={node.x + 38 + Math.min(node.name.length * 7.5, 160)} y={node.y + 15} fontSize={7} fill={LAYER_COLORS.ODS}>◈</text>
                  )}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(${computedLayout.width - 200}, ${computedLayout.height - 50})`}>
              <rect x={0} y={0} width={190} height={40} rx={6} fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.08)" />
              <text x={10} y={16} fontSize={9} fill="#86868B">◈ 有 ODS 源表映射</text>
              <text x={10} y={30} fontSize={9} fill="#86868B">— 连线 = ref/source 引用</text>
            </g>
          </svg>
        </div>

        {/* Selected Node Detail Panel */}
        {selectedNode && (
          <div style={{
            background: 'var(--card)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)', padding: 16, overflow: 'auto', maxHeight: computedLayout.height,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: LAYER_COLORS[selectedNode.layer] || '#999',
              }} />
              <span style={{
                fontSize: 9, fontWeight: 600, color: LAYER_COLORS[selectedNode.layer],
                padding: '1px 6px', borderRadius: 3, background: `${LAYER_COLORS[selectedNode.layer]}15`,
              }}>
                {selectedNode.layer}
              </span>
              {selectedNode.domain && (
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{selectedNode.domain}</span>
              )}
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: "'SF Mono','Consolas',monospace", wordBreak: 'break-all' }}>
              {selectedNode.name}
            </div>
            {selectedNode.path && (
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: "'SF Mono','Consolas',monospace", marginBottom: 12 }}>
                {selectedNode.path}
              </div>
            )}

            {/* Meta info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {selectedNode.sourceTable && (
                <div style={{ fontSize: 10 }}>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>ODS 源表</div>
                  <div style={{ fontFamily: "'SF Mono','Consolas',monospace", color: LAYER_COLORS.ODS }}>
                    ods_sap_{selectedNode.sourceTable}
                  </div>
                </div>
              )}
              {selectedNode.isIncremental !== undefined && (
                <div style={{ fontSize: 10 }}>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>加载策略</div>
                  <div style={{ color: selectedNode.isIncremental ? 'var(--green)' : 'var(--text-secondary)' }}>
                    {selectedNode.isIncremental ? '增量 (7天回溯)' : '全量刷新'}
                  </div>
                </div>
              )}
              {selectedNode.hasDedup && (
                <div style={{ fontSize: 10 }}>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>去重</div>
                  <div style={{ color: 'var(--green)' }}>ROW_NUMBER() by PK</div>
                </div>
              )}
            </div>

            {/* Dependency chain */}
            {selectedChains.upstream.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase' }}>
                  ↑ 上游依赖 ({selectedChains.upstream.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {selectedChains.upstream.map(n => (
                    <span key={n.id} style={{
                      padding: '2px 6px', borderRadius: 4, fontSize: 9,
                      background: `${LAYER_COLORS[n.layer]}10`, color: LAYER_COLORS[n.layer],
                      fontFamily: "'SF Mono','Consolas',monospace", cursor: 'pointer',
                    }} onClick={() => setSelectedNode(n)}>
                      {n.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedChains.downstream.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase' }}>
                  ↓ 下游引用 ({selectedChains.downstream.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {selectedChains.downstream.map(n => (
                    <span key={n.id} style={{
                      padding: '2px 6px', borderRadius: 4, fontSize: 9,
                      background: `${LAYER_COLORS[n.layer]}10`, color: LAYER_COLORS[n.layer],
                      fontFamily: "'SF Mono','Consolas',monospace", cursor: 'pointer',
                    }} onClick={() => setSelectedNode(n)}>
                      {n.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Direct references */}
            {(() => {
              const rels = findRelNodes(selectedNode.id);
              if (rels.length === 0) return null;
              return (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase' }}>
                    直接关联 ({rels.length})
                  </div>
                  {rels.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0',
                      fontSize: 10, borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{
                        fontSize: 8, color: r.type === 'depends on' ? 'var(--red)' : 'var(--green)',
                        width: 50, flexShrink: 0,
                      }}>
                        {r.type === 'depends on' ? 'depends →' : '← used by'}
                      </span>
                      <span style={{
                        fontFamily: "'SF Mono','Consolas',monospace", color: LAYER_COLORS[r.node.layer],
                        cursor: 'pointer', flex: 1,
                      }} onClick={() => setSelectedNode(r.node)}>
                        {r.node.name}
                      </span>
                      <span style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>{r.node.layer}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
