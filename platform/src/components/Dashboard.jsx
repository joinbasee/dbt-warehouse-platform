import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AGENTS, DATABASE_CONNECTIONS, DOMAIN_INFO } from '../data/agents.js';

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA', '#FF6B35', '#8E8E93'];

function StatMini({ label, value, unit, color }) {
  return (
    <div className="stat-mini">
      <div className="stat-mini-value" style={{ color }}>{value}<span className="stat-mini-unit">{unit}</span></div>
      <div className="stat-mini-label">{label}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.payload?.fill || p.color, fontSize: 12, lineHeight: 1.6 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard({ projectData }) {
  const stats = projectData?.stats || { modelCount: 71, macroCount: 8, sourceCount: 74, domainCount: 6, connectionCount: 5 };
  const completedAgents = AGENTS.filter(a => a.status === 'completed').length;

  const domainChartData = useMemo(() =>
    Object.entries(DOMAIN_INFO).map(([key, info]) => ({ name: info.name, value: info.count, fill: info.color })),
  []);

  return (
    <div className="dashboard-v2">
      <div className="dash-header">
        <h1 className="page-title">项目总览</h1>
        <span className="dash-updated">实时数据 · {projectData?.updatedAt ? new Date(projectData.updatedAt).toLocaleTimeString('zh-CN') : '—'}</span>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <StatMini label="DWD 模型" value={stats.modelCount} unit="个" color="#007AFF" />
        <StatMini label="标准化宏" value={stats.macroCount} unit="个" color="#34C759" />
        <StatMini label="ODS 源表" value={stats.sourceCount} unit="张" color="#FF9500" />
        <StatMini label="业务域" value={stats.domainCount} unit="个" color="#AF52DE" />
        <StatMini label="数据库连接" value={stats.connectionCount} unit="个" color="#5AC8FA" />
        <StatMini label="Agent 完成" value={completedAgents} unit="/8" color="#FF3B30" />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-title">业务域模型分布</span>
            <span className="chart-subtitle">71 个 DWD 模型 / 6 个域</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={domainChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#AEAEB2' }} />
              <YAxis tick={{ fontSize: 10, fill: '#AEAEB2' }} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {domainChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <span className="chart-title">Agent 执行进度</span>
            <span className="chart-subtitle">{completedAgents}/8 已完成</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: '已完成', value: completedAgents, fill: '#34C759' },
                  { name: '待执行', value: 8 - completedAgents, fill: 'rgba(0,0,0,0.06)' },
                ]}
                cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none"
              >
                <Cell fill="#34C759" />
                <Cell fill="rgba(0,0,0,0.06)" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="arch-diagram">
        <div className="section-label">五层数据架构 & 8-Agent 协作流程</div>
        <div className="arch-layers">
          {[
            { layer: 'ODS', name: 'Hive dmp_ods · 374 张 SAP 原始表（DataX 同步）', color: '#8E8E93' },
            { layer: 'DWD', name: 'Hive dmp_dw · 71 张清洗表（1:1 映射 + 标准化 + 审计字段）', color: '#007AFF' },
            { layer: 'DWS', name: 'Hive dmp_dw · 中间层 ETL 链 + 业务宽表（多表 JOIN + 聚合）', color: '#34C759' },
            { layer: 'DIM', name: 'Hive dmp_dim · 共享维度表（客户 / 产品 / 组织 / 人员 / 日期）', color: '#FF9500' },
            { layer: 'ADS', name: 'OceanBase dmp_ads · BI 就绪参数化视图（FineReport 直连）', color: '#AF52DE' },
          ].map((l, i) => (
            <div key={i} className="arch-layer">
              <span className="arch-layer-tag" style={{ background: l.color }}>{l.layer}</span>
              <span className="arch-layer-name">{l.name}</span>
              {i < 4 && <span className="arch-layer-arrow">↓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Pipeline Bar */}
      <div>
        <div className="section-label">Agent 管道状态</div>
        <div className="agent-pipeline-bar">
          {AGENTS.map(a => (
            <div
              key={a.id}
              className={`agent-pipeline-step ${a.status === 'completed' ? 'done' : a.status === 'running' ? 'doing' : ''}`}
              title={`${a.name} — ${a.status}`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'var(--text-tertiary)' }}>
          {AGENTS.map(a => <span key={a.id}>{a.name.split('层')[0]}</span>)}
        </div>
      </div>

      {/* Database Connections */}
      <div>
        <div className="section-label">数据库连接状态</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {DATABASE_CONNECTIONS.map(conn => (
            <div key={conn.id} className={`db-conn-card ${conn.status}`}>
              <div className="db-conn-name">{conn.name}</div>
              <div className="db-conn-info">{conn.role}</div>
              <div className="db-conn-latency" style={{ color: conn.status === 'online' ? 'var(--green)' : 'var(--text-tertiary)' }}>
                {conn.status === 'online' ? `● ${conn.latency}` : '○ 离线'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
