import React, { useState } from 'react';

const NAV = [
  { key:'bi', label:'BI 看板', icon:'▣', desc:'数据消费与可视化', children:[
    { key:'bi', label:'看板总览', desc:'PEP · 奔驰 · Unisity' },
    { key:'bi-prod', label:'生产制造', desc:'运营/质量/设备/过程' },
    { key:'bi-qm', label:'质量管理', desc:'质量总览+供应商' },
    { key:'bi-safety', label:'安全与消防', desc:'安防总览' },
    { key:'bi-hr', label:'人力资源', desc:'人力总览' },
    { key:'bi-fc', label:'财务成本', desc:'财务总览' },
    { key:'bi-tss', label:'技术支持', desc:'技术总览' },
    { key:'bi-pp', label:'生产计划', desc:'计划总览' },
    { key:'bi-rd', label:'研发工艺', desc:'研发总览' },
    { key:'bi-log', label:'物流', desc:'物流总览' },
  ]},
  { key:'governance', label:'数据治理', icon:'◎', desc:'资产·标准·质量·安全', children:[
    { key:'governance', label:'数据地图', desc:'68系统资产目录树' },
    { key:'governance-meta', label:'元数据管理', desc:'表/字段级元数据' },
    { key:'governance-standard', label:'数据标准', desc:'命名/类型/宏函数' },
    { key:'governance-quality', label:'质量中心', desc:'六维度质量仪表盘' },
    { key:'governance-lineage', label:'血缘追踪', desc:'5层DAG全链路' },
    { key:'governance-security', label:'安全中心', desc:'敏感数据/脱敏/审计' },
    { key:'governance-lifecycle', label:'生命周期', desc:'3年归档/1年删除' },
    { key:'governance-score', label:'治理评估', desc:'健康分/域排名' },
  ]},
  { key:'metrics', label:'数据指标管理', icon:'◆', desc:'原子·衍生·复合', children:[
    { key:'metrics', label:'指标目录', desc:'390指标×14域×三级' },
    { key:'metrics-define', label:'指标定义', desc:'含义/口径/CP/源系统' },
    { key:'metrics-lineage', label:'指标血缘', desc:'指标→模型→源表' },
    { key:'metrics-board', label:'指标看板配置', desc:'看板编排' },
    { key:'metrics-common', label:'共性指标', desc:'15个跨部门共用KPI' },
    { key:'metrics-api', label:'指标服务', desc:'API接口/调用示例' },
  ]},
  { key:'sources', label:'数据源管理', icon:'◇', desc:'68系统·7数据库', children:[
    { key:'sources', label:'源系统清单', desc:'就绪度(A/B/C/D)面板' },
    { key:'sources-connect', label:'连接管理', desc:'7数据库·连接测试' },
    { key:'sources-ingest', label:'数据接入', desc:'同步任务·增量策略' },
    { key:'sources-tables', label:'源表浏览', desc:'24张已确认真实表名' },
    { key:'sources-macros', label:'宏函数库', desc:'8标准化宏' },
  ]},
  { key:'reports', label:'报表情况', icon:'◈', desc:'报表·血缘·订阅', children:[
    { key:'reports', label:'报表目录', desc:'4看板+各域总览' },
    { key:'reports-lineage', label:'报表血缘', desc:'报表→指标→模型→源表' },
    { key:'reports-sub', label:'订阅推送', desc:'邮件/企微定时推送' },
    { key:'reports-stats', label:'使用统计', desc:'访问频次/新鲜度' },
  ]},
  { key:'dev', label:'数据开发', icon:'▸', desc:'SQL·工作流·AI', children:[
    { key:'dev', label:'SQL 编辑器', desc:'语法高亮·执行历史' },
    { key:'dev-workflow', label:'工作流编排', desc:'5场景DAG流水线' },
    { key:'agents', label:'Agent 集群', desc:'8 Agent 状态/拓扑' },
    { key:'chat', label:'AI 辅助', desc:'Claude CLI·智能生成' },
    { key:'models', label:'模型管理', desc:'DWD/DWS/DIM/ADS' },
    { key:'dev-templates', label:'代码模板', desc:'清洗/聚合模板库' },
  ]},
  { key:'monitor', label:'数据监控', icon:'▤', desc:'任务·质量·告警', children:[
    { key:'monitor', label:'任务监控', desc:'dbt执行状态/耗时' },
    { key:'monitor-quality', label:'质量监控', desc:'415断言+六维度' },
    { key:'monitor-resource', label:'资源监控', desc:'CPU/MEM/存储' },
    { key:'monitor-alert', label:'告警中心', desc:'四级告警' },
    { key:'monitor-logs', label:'实时日志', desc:'Agent日志流' },
  ]},
  { key:'service', label:'数据服务', icon:'⬡', desc:'API·共享·市场', children:[
    { key:'service', label:'API 管理', desc:'注册/发布/测试' },
    { key:'service-share', label:'数据共享', desc:'跨部门授权' },
    { key:'service-monitor', label:'服务监控', desc:'QPS/延迟/成功率' },
    { key:'service-market', label:'数据市场', desc:'数据集浏览/订阅' },
  ]},
  { key:'ops', label:'数据运维', icon:'⚙', desc:'调度·资源·备份', children:[
    { key:'ops', label:'调度管理', desc:'5场景DolphinScheduler' },
    { key:'ops-resource', label:'资源管理', desc:'计算/存储配额' },
    { key:'ops-backup', label:'备份恢复', desc:'快照/跨库同步' },
    { key:'ops-version', label:'版本管理', desc:'模型版本/Git联动' },
  ]},
  { key:'asset', label:'数据资产', icon:'◉', desc:'盘点·目录·评估', children:[
    { key:'asset', label:'资产盘点', desc:'68系统就绪度仪表盘' },
    { key:'asset-catalog', label:'资产目录', desc:'域/系统/数据库三维' },
    { key:'asset-eval', label:'资产评估', desc:'价值/频次/排名' },
    { key:'asset-lifecycle', label:'生命周期', desc:'归档/销毁策略' },
    { key:'asset-report', label:'资产报告', desc:'健康分/排行榜' },
  ]},
];

export default function Sidebar({ activePage, onNavigate, projectData }) {
  const modelCount = projectData?.stats?.modelCount || 71;
  const [expanded, setExpanded] = useState({ bi:true });

  const toggle = (k) => setExpanded(p => ({...p, [k]: !p[k]}));

  const isActive = (childKey) => {
    if (childKey === 'bi-prod' && activePage === 'bi') return true;
    return activePage === childKey;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">智能数仓建设平台</div>
        <div className="sidebar-subtitle">dbt Agent Platform v1.2<br/>奔驰 68系统 · 10模块</div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(sec => (
          <div key={sec.key} style={{marginBottom:1}}>
            <button className="nav-item" onClick={()=>toggle(sec.key)}
              style={{fontWeight:600,fontSize:11,color:expanded[sec.key]?'var(--text)':'var(--text-secondary)',justifyContent:'space-between',padding:'7px 12px'}}>
              <span style={{display:'flex',alignItems:'center',gap:7}}>
                <span className="nav-icon" style={{fontSize:13}}>{sec.icon}</span>
                <span>{sec.label}</span>
              </span>
              <span style={{fontSize:8,transition:'transform 0.2s',transform:expanded[sec.key]?'rotate(90deg)':'rotate(0deg)',opacity:0.35}}>▸</span>
            </button>
            {expanded[sec.key] && (
              <div style={{paddingLeft:14}}>
                {sec.children.map(c => (
                  <button key={c.key} className={`nav-item${isActive(c.key)?' active':''}`}
                    onClick={()=>onNavigate(c.key)}
                    style={{fontSize:10,padding:'5px 12px',flexDirection:'column',alignItems:'flex-start',gap:1}}>
                    <span style={{fontWeight:isActive(c.key)?500:400}}>{c.label}</span>
                    <span style={{fontSize:8,color:isActive(c.key)?'var(--blue)':'var(--text-tertiary)',opacity:0.65}}>{c.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-status"><span className="status-dot"/>系统运行中 · {modelCount} 模型就绪</div>
      </div>
    </aside>
  );
}
