import React, { useState, useEffect, useCallback } from 'react';
import { DATABASE_CONNECTIONS } from '../data/agents.js';
import { getProjectData } from '../services/projectScanner.js';

function MacroCard({ macro, isSelected, onClick }) {
  const nameMap = {
    sap_date: 'sap_date(col)', sap_string: 'sap_string(col, default)',
    sap_flag: 'sap_flag(col)', sap_decimal: 'sap_decimal(col, prec, def)',
    audit_columns: 'audit_columns()', incremental_filter: 'incremental_filter(col, days)',
    group_concat: 'group_concat(expr, sep)', zsdr005_params: 'zsdr005_where_clause()',
  };
  return (
    <div className={`macro-card ${isSelected ? 'selected' : ''}`} onClick={() => onClick(macro)}>
      <div className="macro-name">{nameMap[macro.name] || macro.name}</div>
      <div className="macro-desc">{macro.description || 'dbt 标准化宏函数'}</div>
      {macro.params && <div className="macro-params">用法: {macro.params}</div>}
    </div>
  );
}

export default function SourcesPanel() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMacro, setSelectedMacro] = useState(null);
  const [activeTab, setActiveTab] = useState('macros');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getProjectData();
    setProject(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const macros = project?.macros || [];
  const sources = project?.sources || [];
  const stats = project?.stats || { modelCount: 71, macroCount: 8, sourceCount: 74 };

  return (
    <div className="sources-layout">
      <div className="pipeline-header">
        <div>
          <h1 className="page-title">数据源 & 宏</h1>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {stats.macroCount} 宏 · {stats.sourceCount} 源表 · 5 数据库
          </span>
        </div>
        <button className="btn-mini" onClick={loadData} style={{ marginLeft: 'auto' }}>
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* Tabs */}
      <div className="pipeline-tabs">
        <button className={`pipeline-tab ${activeTab === 'macros' ? 'active' : ''}`} onClick={() => setActiveTab('macros')}>
          宏函数库 ({macros.length || 8})
        </button>
        <button className={`pipeline-tab ${activeTab === 'sources' ? 'active' : ''}`} onClick={() => setActiveTab('sources')}>
          ODS 源表 ({sources.length || 74})
        </button>
        <button className={`pipeline-tab ${activeTab === 'connections' ? 'active' : ''}`} onClick={() => setActiveTab('connections')}>
          数据库连接
        </button>
        <button className={`pipeline-tab ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          成果文档
        </button>
      </div>

      {/* Macro Library */}
      {activeTab === 'macros' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="section-label">标准化宏函数 — 跨 DuckDB / Hive / OceanBase / MySQL 四种 SQL 方言兼容</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {macros.map((m, i) => (
              <MacroCard key={i} macro={m} isSelected={selectedMacro?.name === m.name} onClick={setSelectedMacro} />
            ))}
          </div>
          {selectedMacro && (
            <div className="agent-detail-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--blue)', fontFamily: "'SF Mono','Consolas',monospace" }}>
                  {selectedMacro.name}
                </div>
                <button className="btn-mini" onClick={() => setSelectedMacro(null)}>关闭</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="agent-detail-title">描述</div>
                  <div className="agent-detail-text">{selectedMacro.description || 'dbt 标准化宏函数'}</div>
                </div>
                <div>
                  <div className="agent-detail-title">使用示例</div>
                  <div className="agent-detail-text" style={{ fontFamily: "'SF Mono','Consolas',monospace" }}>
                    {selectedMacro.params || '—'}
                  </div>
                </div>
              </div>
              <div className="agent-detail-title">源码</div>
              <div className="sql-viewer" style={{ maxHeight: 300 }}>
                {selectedMacro.content || '（在 Electron 应用中加载完整源码）'}
              </div>
            </div>
          )}
          {macros.length === 0 && (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">◇</div>
              <div className="empty-state-text">8 个宏函数就绪</div>
              <div className="empty-state-hint">macros/ 目录 · 启动 Electron 应用加载真实源码</div>
            </div>
          )}
        </div>
      )}

      {/* ODS Sources */}
      {activeTab === 'sources' && (
        <div>
          <div className="section-label">ODS 源表清单 — Hive dmp_ods · DataX 同步自 SAP ECC</div>
          {sources.length > 0 ? (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>dbt Source</th><th>SAP 表</th><th>描述</th></tr>
                </thead>
                <tbody>
                  {sources.map((s, i) => (
                    <tr key={i}>
                      <td style={{ width: 40, color: 'var(--text-tertiary)' }}>{i + 1}</td>
                      <td style={{ fontFamily: "'SF Mono','Consolas',monospace", color: 'var(--blue)', fontSize: 11 }}>{s.name}</td>
                      <td style={{ fontFamily: "'SF Mono','Consolas',monospace", fontSize: 11 }}>{s.tableName}</td>
                      <td style={{ fontSize: 11 }}>{s.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">◈</div>
              <div className="empty-state-text">74 张 ODS 源表就绪</div>
              <div className="empty-state-hint">models/sources.yml · 启动 Electron 应用加载完整清单</div>
            </div>
          )}
        </div>
      )}

      {/* Database Connections */}
      {activeTab === 'connections' && (
        <div>
          <div className="section-label">数据库连接状态 — 6 个 Target</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {DATABASE_CONNECTIONS.map(conn => (
              <div key={conn.id} className={`db-conn-card ${conn.status}`} style={{ padding: 18 }}>
                <div className="db-conn-name" style={{ fontSize: 14 }}>{conn.name}</div>
                <div className="db-conn-info" style={{ fontSize: 11, marginTop: 2 }}>{conn.role}</div>
                <div className="db-conn-info" style={{ fontSize: 10, fontFamily: "'SF Mono','Consolas',monospace" }}>{conn.type}{conn.host ? ` · ${conn.host}` : ''}</div>
                <div className="db-conn-latency" style={{ fontSize: 12, marginTop: 8 }}>
                  <span style={{ color: conn.status === 'online' ? 'var(--green)' : 'var(--text-tertiary)' }}>
                    {conn.status === 'online' ? '● 在线' : '○ 离线'}
                  </span>
                  {conn.latency !== '-' && <span style={{ marginLeft: 6, fontWeight: 400 }}>{conn.latency}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成果文档 */}
      {activeTab === 'docs' && (
        <div>
          <div className="section-label">项目交付成果文档</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { title: '产品介绍报告', file: 'PEP数据仓库产品介绍报告.md', desc: '完整的数仓产品介绍、痛点分析、技术架构、Agent集群设计', icon: '📄', type: 'markdown' },
              { title: '综合开发规范手册', file: '规范设计/人教社数仓综合开发规范手册.docx', desc: '命名规范、SQL标准、宏定义、增量策略、测试标准', icon: '📘', type: 'docx' },
              { title: '字段级数据标准规范', file: '规范设计/字段级数据标准规范与合规审查报告.docx', desc: '数据类型映射表、NULL处理规则、合规审查', icon: '📋', type: 'docx' },
              { title: 'Agent 实施方案', file: '数仓开发流程实施方案（对应agent开发）.docx', desc: '8 Agent架构设计、DAG依赖、产出物清单、执行策略', icon: '⚙', type: 'docx' },
              { title: 'sources.yml', file: 'models/sources.yml', desc: '74张ODS源表完整定义（字段名/类型/中文描述/freshness监控）', icon: '🗂', type: 'yaml' },
              { title: 'dbt_project.yml', file: 'dbt_project.yml', desc: '项目核心配置（5层schema映射/物化策略/宏路径）', icon: '🔧', type: 'yaml' },
              { title: '审计字段宏', file: 'macros/audit_columns.sql', desc: '7个审计字段自动注入（s_creator/s_create_time/s_modifier/s_state等）', icon: '◇', type: 'sql' },
              { title: 'SAP 日期转换宏', file: 'macros/sap_date.sql', desc: 'yyyyMMdd字符串→标准DATE类型转换', icon: '◆', type: 'sql' },
            ].map((doc, i) => (
              <div key={i} className="macro-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{doc.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{doc.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'SF Mono','Consolas',monospace", marginTop: 2 }}>
                      {doc.file}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                  {doc.desc}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 500,
                    background: doc.type === 'markdown' ? 'rgba(52,199,89,0.1)' :
                      doc.type === 'docx' ? 'rgba(0,122,255,0.1)' :
                        doc.type === 'yaml' ? 'rgba(255,149,0,0.1)' : 'rgba(175,82,222,0.1)',
                    color: doc.type === 'markdown' ? 'var(--green)' :
                      doc.type === 'docx' ? 'var(--blue)' :
                        doc.type === 'yaml' ? 'var(--orange)' : 'var(--purple)',
                  }}>
                    {doc.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DWD Model Stats */}
          <div className="section-label" style={{ marginTop: 20 }}>DWD 模型产出统计</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>业务域</th><th>代码</th><th>模型数</th><th>核心SAP源表</th><th>业务内容</th></tr>
              </thead>
              <tbody>
                {[
                  { name: '选题域', code: 'xt', count: 17, tables: 'ZTMM_A101, ZTPPM_A026, ZTPS_A111 等', desc: '选题申报、合同、印制、版权、成本核算' },
                  { name: '编校域', code: 'bj', count: 10, tables: 'ZTPPM_A020, ZTPPM_A025, ZTPPM_A051 等', desc: '编辑计划、三审三校、工作量统计、取退稿' },
                  { name: '订单域', code: 'order', count: 15, tables: 'VBAK, VBAP, VBRK, VBRP, LIKP, LIPS, EKKO, EKPO', desc: '销售订单、交货、开票、采购（SAP SD/MM核心模块）' },
                  { name: '财务域', code: 'fi', count: 7, tables: 'ZTFI_A301, ZTPPM_A049, ZTPPM_A054, ZTSD_C020', desc: '费用报销、稿酬、培训费、发行配置' },
                  { name: '主数据域', code: 'md', count: 24, tables: 'KNA1, MARA, PA0001, DD07T, T001L 等', desc: '客户、物料、员工、组织架构、字典配置' },
                  { name: '库存域', code: 'stock', count: 1, tables: 'MSEG', desc: '物料凭证、库存移动' },
                ].map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td style={{ fontFamily: "'SF Mono','Consolas',monospace", color: 'var(--blue)' }}>{d.code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>{d.count}</td>
                    <td style={{ fontSize: 10, fontFamily: "'SF Mono','Consolas',monospace" }}>{d.tables}</td>
                    <td style={{ fontSize: 11 }}>{d.desc}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(0,122,255,0.03)', fontWeight: 700 }}>
                  <td><strong>合计</strong></td>
                  <td>—</td>
                  <td style={{ fontWeight: 700, color: 'var(--blue)' }}>71</td>
                  <td colSpan={2}>6 个业务域 · 覆盖 SAP SD/MM/FI/PP/PS 核心模块</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
