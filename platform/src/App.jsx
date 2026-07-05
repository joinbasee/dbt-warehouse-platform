import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatPanel from './components/ChatPanel';
import AgentsPanel from './components/AgentsPanel';
import ModelsPanel from './components/ModelsPanel';
import LineagePanel from './components/LineagePanel';
import DeliverablesPanel from './components/DeliverablesPanel';
import SourcesPanel from './components/SourcesPanel';
import PipelinePanel from './components/PipelinePanel';
import MonitorPanel from './components/MonitorPanel';
import BIDashboard from './components/BIDashboard';
import GovernancePanel from './components/GovernancePanel';
import MetricsPanel from './components/MetricsPanel';
import DevPanel from './components/DevPanel';
import DataServicePanel from './components/DataServicePanel';
import OpsPanel from './components/OpsPanel';
import AssetPanel from './components/AssetPanel';
import ReportsPanel from './components/ReportsPanel';
import { getProjectData } from './services/projectScanner.js';
import { pipelineEngine } from './services/pipelineEngine.js';

const PAGES = {
  // BI看板
  bi: BIDashboard,
  'bi-prod': BIDashboard,
  'bi-qm': BIDashboard,
  'bi-safety': BIDashboard,
  'bi-hr': BIDashboard,
  'bi-fc': BIDashboard,
  'bi-tss': BIDashboard,
  'bi-pp': BIDashboard,
  'bi-rd': BIDashboard,
  'bi-log': BIDashboard,
  // 数据治理
  governance: GovernancePanel,
  'governance-meta': GovernancePanel,
  'governance-standard': GovernancePanel,
  'governance-quality': GovernancePanel,
  'governance-lineage': GovernancePanel,
  'governance-security': GovernancePanel,
  'governance-lifecycle': GovernancePanel,
  'governance-score': GovernancePanel,
  // 指标管理
  metrics: MetricsPanel,
  'metrics-define': MetricsPanel,
  'metrics-lineage': MetricsPanel,
  'metrics-board': MetricsPanel,
  'metrics-common': MetricsPanel,
  'metrics-api': MetricsPanel,
  // 数据源
  sources: SourcesPanel,
  'sources-connect': SourcesPanel,
  'sources-ingest': SourcesPanel,
  'sources-tables': SourcesPanel,
  'sources-macros': SourcesPanel,
  // 报表
  reports: ReportsPanel,
  'reports-lineage': ReportsPanel,
  'reports-sub': ReportsPanel,
  'reports-stats': ReportsPanel,
  // 数据开发
  dev: DevPanel,
  'dev-workflow': DevPanel,
  'dev-templates': DevPanel,
  agents: AgentsPanel,
  chat: ChatPanel,
  models: ModelsPanel,
  lineage: LineagePanel,
  deliverables: DeliverablesPanel,
  // 监控
  monitor: MonitorPanel,
  'monitor-quality': MonitorPanel,
  'monitor-resource': MonitorPanel,
  'monitor-alert': MonitorPanel,
  'monitor-logs': MonitorPanel,
  // 服务
  service: DataServicePanel,
  'service-share': DataServicePanel,
  'service-monitor': DataServicePanel,
  'service-market': DataServicePanel,
  // 运维
  ops: OpsPanel,
  'ops-resource': OpsPanel,
  'ops-backup': OpsPanel,
  'ops-version': OpsPanel,
  // 资产
  asset: AssetPanel,
  'asset-catalog': AssetPanel,
  'asset-eval': AssetPanel,
  'asset-lifecycle': AssetPanel,
  'asset-report': AssetPanel,
  // 默认
  dashboard: Dashboard,
  pipeline: PipelinePanel,
};

export default function App() {
  const [activePage, setActivePage] = useState('bi');
  const [projectData, setProjectData] = useState(null);
  const [pipelineState, setPipelineState] = useState(pipelineEngine.getState());

  const refresh = useCallback(async () => {
    const data = await getProjectData();
    setProjectData(data);
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);
  useEffect(() => { const u = pipelineEngine.subscribe(setPipelineState); return u; }, []);

  const PageComponent = PAGES[activePage] || BIDashboard;

  return (
    <div className="app">
      <Sidebar activePage={activePage} onNavigate={setActivePage} projectData={projectData} />
      <div className="main">
        <PageComponent projectData={projectData} pipelineState={pipelineState} />
      </div>
    </div>
  );
}
