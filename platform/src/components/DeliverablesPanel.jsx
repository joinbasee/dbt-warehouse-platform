import React, { useState, useEffect, useCallback } from 'react';
import { getProjectData } from '../services/projectScanner.js';

const STAGE_INFO = {
  'Phase 0-2': { label: 'Phase 0-2: 基础搭建', status: 'completed', color: '#34C759', desc: '工作区清理 + 规范制定 + ODS层搭建' },
  'Phase 3': { label: 'Phase 3: DWD层', status: 'completed', color: '#34C759', desc: '71个DWD清洗模型' },
  'Phase 4': { label: 'Phase 4: DWS/DIM/ADS', status: 'in-progress', color: '#007AFF', desc: '5个场景逐场景实施' },
  'Phase 5': { label: 'Phase 5: BI对接', status: 'pending', color: '#8E8E93', desc: 'FineReport看板上线' },
  'Phase 6': { label: 'Phase 6: 持续优化', status: 'pending', color: '#8E8E93', desc: '性能优化、新场景扩展' },
};

const DELIVERABLES = [
  {
    category: '核心文档',
    icon: '📘',
    items: [
      { name: 'PEP数据仓库产品介绍报告', type: 'markdown', desc: '完整的数仓产品介绍、痛点分析、技术架构、Agent集群设计、效率对比', file: 'PEP数据仓库产品介绍报告.md', size: '41 KB', date: '2026-05-26' },
      { name: '数仓开发流程实施方案（Agent开发）', type: 'docx', desc: '8 Agent架构设计、DAG依赖、执行策略、产出物清单、执行顺序', file: '数仓开发流程实施方案（对应agent开发）.docx', size: '26 KB', date: '2026-05-20' },
      { name: '综合开发规范手册', type: 'docx', desc: '命名规范、SQL编写标准、宏使用标准、增量策略、测试标准、文档标准', file: '规范设计/人教社数仓综合开发规范手册.docx', size: '2.9K 行', date: '2026-05-20' },
      { name: '字段级数据标准规范与合规审查报告', type: 'docx', desc: '数据类型映射表、NULL处理规则、SAP→Hive类型对照、合规审查', file: '规范设计/字段级数据标准规范与合规审查报告.docx', size: '—', date: '2026-05-20' },
      { name: 'Agent Workshop 产品报告', type: 'markdown', desc: 'Agent Workshop产品设计报告（参考前端设计）', file: 'Agent Workshop 产品报告.md', size: '26 KB', date: '2026-05-26' },
    ],
  },
  {
    category: '模型产出',
    icon: '🗂',
    items: [
      { name: 'sources.yml (74张ODS源表)', type: 'yaml', desc: 'SAP ODS原始数据层完整定义，含字段名、类型、中文描述、freshness监控', file: 'models/sources.yml', size: '74 表', date: '2026-05-21' },
      { name: 'DWD SQL 模型 (71个)', type: 'sql', desc: '6个业务域 × 71个DWD清洗模型，统一宏洗、增量加载、审计字段', file: 'models/dwd/{domain}/', size: '71 文件', date: '2026-05-21' },
      { name: 'schema.yml (6个域)', type: 'yaml', desc: '每个域的字段级文档和not_null测试定义', file: 'models/dwd/{domain}/schema.yml', size: '6 文件', date: '2026-05-21' },
      { name: 'dbt_project.yml', type: 'yaml', desc: '项目核心配置：5层schema映射、物化策略、宏路径', file: 'dbt_project.yml', size: '609 B', date: '2026-05-20' },
    ],
  },
  {
    category: '宏函数库',
    icon: '⚙',
    items: [
      { name: 'sap_date.sql', type: 'sql', desc: 'SAP日期字符串 (yyyyMMdd) → 标准DATE类型转换', file: 'macros/sap_date.sql', size: '8 行', date: '—' },
      { name: 'sap_string.sql + sap_decimal', type: 'sql', desc: 'TRIM + COALESCE空值处理 / NULL→0 + CAST DECIMAL', file: 'macros/sap_string.sql', size: '17 行', date: '—' },
      { name: 'sap_flag.sql', type: 'sql', desc: 'SAP标记字段 (X/空) → 布尔整数 (1/0) 转换', file: 'macros/sap_flag.sql', size: '9 行', date: '—' },
      { name: 'audit_columns.sql', type: 'sql', desc: '7个标准审计字段统一注入 (s_creator/s_create_time/s_modifier/s_state等)', file: 'macros/audit_columns.sql', size: '14 行', date: '—' },
      { name: 'incremental_filter.sql', type: 'sql', desc: '基于日期字段的增量加载WHERE条件生成器，支持回溯天数配置', file: 'macros/incremental_filter.sql', size: '15 行', date: '—' },
      { name: 'group_concat.sql', type: 'sql', desc: '跨DuckDB/Hive/OceanBase/MySQL四种方言的字符串聚合', file: 'macros/group_concat.sql', size: '19 行', date: '—' },
      { name: 'generate_schema_name.sql', type: 'sql', desc: '自动schema路由：custom_schema → target.schema回退', file: 'macros/generate_schema_name.sql', size: '7 行', date: '—' },
      { name: 'zsdr005_params.sql', type: 'sql', desc: 'FineReport 20+参数动态WHERE条件生成 (多值/日期范围/模糊搜索/联动)', file: 'macros/zsdr005_params.sql', size: '—', date: '—' },
    ],
  },
  {
    category: '基础设施',
    icon: '🔧',
    items: [
      { name: 'profiles.yml', type: 'yaml', desc: '6个数据库连接配置 (DuckDB/Hive/OceanBase×2/MySQL/HANA)', file: 'profiles.yml', size: '1.4 KB', date: '2026-05-19' },
      { name: 'CLAUDE.md', type: 'markdown', desc: 'Claude Code项目上下文：架构、命令、宏、命名规范、域定义', file: 'CLAUDE.md', size: '5.7 KB', date: '2026-05-21' },
      { name: '智能数仓建设平台 (本应用)', type: 'app', desc: 'Electron+React桌面应用：7页交互、Claude Code集成、Agent集群管理', file: 'platform/', size: '20 文件', date: '2026-05-27' },
    ],
  },
];

export default function DeliverablesPanel() {
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadData = useCallback(async () => {
    const data = await getProjectData();
    setProject(data);
    // Load actual document files
    const api = window.electronAPI;
    if (api) {
      try {
        const docs = await api.scanDocuments();
        if (docs?.length) setDocuments(docs);
      } catch (e) { /* ignore */ }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = project?.stats || {};

  const typeColors = {
    markdown: { bg: 'rgba(52,199,89,0.1)', color: '#34C759' },
    docx: { bg: 'rgba(0,122,255,0.1)', color: '#007AFF' },
    xlsx: { bg: 'rgba(52,199,89,0.1)', color: '#34C759' },
    yaml: { bg: 'rgba(255,149,0,0.1)', color: '#FF9500' },
    sql: { bg: 'rgba(175,82,222,0.1)', color: '#AF52DE' },
    app: { bg: 'rgba(255,59,48,0.1)', color: '#FF3B30' },
  };

  return (
    <div className="sources-layout" style={{ gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">成果文档</h1>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            项目交付物 · {DELIVERABLES.reduce((sum, c) => sum + c.items.length, 0)} 项核心成果
            {documents.length > 0 && <span> · 扫描到 {documents.length} 个文件</span>}
          </span>
        </div>
        <button className="btn-mini" onClick={loadData}>刷新</button>
      </div>

      {/* Phase Progress */}
      <div>
        <div className="section-label">项目阶段进度</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {Object.entries(STAGE_INFO).map(([key, stage]) => (
            <div key={key} className="stat-mini" style={{
              padding: '12px 14px',
              opacity: stage.status === 'pending' ? 0.6 : 1,
              borderLeft: `3px solid ${stage.color}`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: stage.color, marginBottom: 4 }}>
                {stage.status === 'completed' ? '● 已完成' : stage.status === 'in-progress' ? '● 进行中' : '○ 待开始'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{stage.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          { label: 'DWD模型', v: stats.modelCount || 71, u: '个', c: '#007AFF' },
          { label: '宏函数', v: stats.macroCount || 8, u: '个', c: '#34C759' },
          { label: 'ODS源表', v: stats.sourceCount || 74, u: '张', c: '#FF9500' },
          { label: '业务域', v: stats.domainCount || 6, u: '个', c: '#AF52DE' },
          { label: '核心文档', v: DELIVERABLES[0].items.length, u: '份', c: '#FF3B30' },
          { label: 'Agent完成', v: '4/8', u: '', c: '#5AC8FA' },
        ].map((k, i) => (
          <div key={i} className="stat-mini" style={{ padding: '10px 14px' }}>
            <div className="stat-mini-value" style={{ fontSize: 22, color: k.c }}>{k.v}<span className="stat-mini-unit">{k.u}</span></div>
            <div className="stat-mini-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Deliverables by Category */}
      {DELIVERABLES.map((cat, ci) => (
        <div key={ci}>
          <div className="section-label">{cat.icon} {cat.category} ({cat.items.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {cat.items.map((item, ii) => {
              const tc = typeColors[item.type] || { bg: 'rgba(0,0,0,0.04)', color: '#8E8E93' };
              return (
                <div key={ii} className="macro-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                    background: tc.bg, color: tc.color, whiteSpace: 'nowrap', marginTop: 2,
                  }}>
                    {item.type.toUpperCase()}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
                      {item.desc}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 9, color: 'var(--text-tertiary)' }}>
                      <span style={{ fontFamily: "'SF Mono','Consolas',monospace" }}>{item.file}</span>
                      {item.size && <span>· {item.size}</span>}
                      {item.date && item.date !== '—' && <span>· {item.date}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Scanned Documents (from file system) */}
      {documents.length > 0 && (
        <div>
          <div className="section-label">📁 文件系统扫描 ({documents.length} 个文件)</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>文件名</th><th>路径</th><th>类型</th><th>大小</th><th>修改时间</th></tr>
              </thead>
              <tbody>
                {documents.slice(0, 30).map((d, i) => {
                  const tc = typeColors[d.type] || typeColors['yaml'];
                  return (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-tertiary)', width: 40 }}>{i + 1}</td>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{d.name}</td>
                      <td style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 10, color: 'var(--text-secondary)' }}>{d.path}</td>
                      <td>
                        <span style={{
                          padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 500,
                          background: tc.bg, color: tc.color,
                        }}>
                          {d.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 10 }}>
                        {d.size > 1024 ? `${(d.size / 1024).toFixed(1)} KB` : `${d.size} B`}
                      </td>
                      <td style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        {d.modifiedAt ? new Date(d.modifiedAt).toLocaleDateString('zh-CN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
