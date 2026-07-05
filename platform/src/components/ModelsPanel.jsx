import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DOMAIN_INFO } from '../data/agents.js';
import { getProjectData } from '../services/projectScanner.js';

export default function ModelsPanel() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState('order');
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sql');
  const [modelContent, setModelContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getProjectData();
    setProject(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Lazy-load model content when selecting a model
  const handleSelectModel = useCallback(async (model) => {
    setSelectedModel(model);
    setModelContent(null);
    setContentLoading(true);
    const api = window.electronAPI;
    if (api && model.path) {
      const result = await api.loadModelContent(model.path);
      if (result.success) {
        setModelContent(result.content);
      }
    } else if (model.preview) {
      setModelContent(model.preview);
    }
    setContentLoading(false);
  }, []);

  const domains = useMemo(() => {
    if (project?.domains) return Object.entries(project.domains);
    return Object.entries(DOMAIN_INFO).map(([k, v]) => [k, { ...v, models: [] }]);
  }, [project]);

  const currentDomain = useMemo(() => {
    const d = domains.find(([k]) => k === activeDomain);
    return d ? d[1] : { name: '', models: [] };
  }, [domains, activeDomain]);

  const filteredModels = useMemo(() => {
    if (!currentDomain.models) return [];
    if (!searchTerm) return currentDomain.models;
    return currentDomain.models.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentDomain, searchTerm]);

  return (
    <div className="models-layout">
      <div className="models-header">
        <h1 className="page-title">模型浏览</h1>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {project?.stats?.modelCount || 71} 个 DWD 模型 · 6 个业务域
        </span>
        <button className="btn-mini" onClick={loadData} style={{ marginLeft: 'auto' }}>
          {loading ? '刷新中...' : '刷新'}
        </button>
        <input
          className="models-search"
          placeholder="搜索模型..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Domain Tabs */}
      <div className="models-tabs">
        {domains.map(([key, info]) => (
          <button
            key={key}
            className={`models-tab ${activeDomain === key ? 'active' : ''}`}
            onClick={() => { setActiveDomain(key); setSelectedModel(null); }}
          >
            {info.name} ({info.models?.length || info.count || 0})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="models-content">
        {/* Model List */}
        <div className="model-list">
          {filteredModels.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-text" style={{ fontSize: 12 }}>
                {searchTerm ? '没有匹配的模型' : '暂无模型数据'}
              </div>
              <div className="empty-state-hint">
                {loading ? '正在扫描项目文件...' : '点击"刷新"按钮重新加载'}
              </div>
            </div>
          ) : (
            filteredModels.map((model, i) => (
              <div
                key={i}
                className={`model-list-item ${selectedModel?.name === model.name ? 'selected' : ''}`}
                onClick={() => handleSelectModel(model)}
              >
                <span className="model-list-item-name">{model.name}</span>
                <span className="model-list-item-info">
                  {model.size || '—'} 行 · {model.hasIncremental ? '增量' : '全量'}
                  {model.hasDedup ? ' · 去重' : ''}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Model Detail */}
        <div className="model-detail">
          {selectedModel ? (
            <>
              <div className="model-detail-name">{selectedModel.name}</div>
              <div className="model-detail-path">{selectedModel.path || `models/dwd/${activeDomain}/${selectedModel.name}.sql`}</div>

              <div className="model-detail-tabs" style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {[
                  { key: 'sql', label: 'SQL 源码' },
                  { key: 'schema', label: '字段定义' },
                  { key: 'info', label: '元数据' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`model-detail-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'sql' && (
                <div className="sql-viewer">
                  {contentLoading ? (
                    <span style={{ color: '#5A5A6E', fontStyle: 'italic' }}>加载中...</span>
                  ) : modelContent ? (
                    modelContent
                  ) : selectedModel.preview ? (
                    selectedModel.preview
                  ) : (
                    <span style={{ color: '#5A5A6E', fontStyle: 'italic' }}>SQL 源码加载中...</span>
                  )}
                </div>
              )}
              {activeTab === 'schema' && (
                <div className="sql-viewer">
                  <span style={{ color: '#C3E88D' }}>
                    {`# ${selectedModel.name} — 字段定义 (schema.yml)
# 域: ${DOMAIN_INFO[activeDomain]?.name || activeDomain}
# 审计字段: s_creator / s_creator_name / s_create_time / s_modifier / s_modifier_name / s_modify_time / s_state
# 去重策略: ROW_NUMBER() OVER (PARTITION BY 业务主键 ORDER BY 日期 DESC)
# 增量策略: ${selectedModel.hasIncremental ? '增量（7天回溯窗口）' : '全量刷新'}`}
                  </span>
                </div>
              )}
              {activeTab === 'info' && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2.2 }}>
                  <div><strong>业务域</strong>：{DOMAIN_INFO[activeDomain]?.name || activeDomain} — {DOMAIN_INFO[activeDomain]?.desc || ''}</div>
                  <div><strong>文件路径</strong>：{selectedModel.path}</div>
                  <div><strong>SQL 行数</strong>：{selectedModel.size || '—'}</div>
                  <div><strong>ODS 映射</strong>：1:1（对应一张 ODS 源表）</div>
                  <div><strong>物化方式</strong>：table（INSERT OVERWRITE，按 s_create_time 分区）</div>
                  <div><strong>审计字段</strong>：7 列（s_creator / s_creator_name / s_create_time / s_modifier / s_modifier_name / s_modify_time / s_state）</div>
                  <div><strong>去重策略</strong>：{selectedModel.hasDedup ? 'ROW_NUMBER() OVER (PARTITION BY 业务主键)' : '无'}</div>
                  <div><strong>增量策略</strong>：{selectedModel.hasIncremental ? '增量加载（7 天回溯窗口）' : '全量刷新'}</div>
                  <div><strong>标准宏</strong>：sap_date / sap_string / sap_flag / sap_decimal / audit_columns / incremental_filter</div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">▣</div>
              <div className="empty-state-text">选择一个模型查看详情</div>
              <div className="empty-state-hint">
                左侧列表显示{currentDomain.name}下的 {filteredModels.length} 个 DWD 模型
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
