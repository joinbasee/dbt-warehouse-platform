import React,{useState} from 'react';
const TABS=['API 管理','数据共享','服务监控','数据市场'];
export default function DataServicePanel(){const[tab,setTab]=useState(0);
  return(<div className="monitor-layout"><h1 className="page-title">数据服务</h1><div className="models-tabs">{TABS.map((t,i)=><button key={i} className={`models-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>API名称</th><th>方法</th><th>路径</th><th>状态</th><th>QPS</th><th>描述</th></tr></thead><tbody>
      <tr><td style={{fontWeight:600}}>指标查询</td><td style={{color:'#007AFF'}}>GET</td><td style={{fontFamily:"'SF Mono',monospace",fontSize:10}}>/api/v1/metrics/:name</td><td style={{color:'#34C759'}}>已发布</td><td>125</td><td>按指标名查询当前值/趋势</td></tr>
      <tr><td style={{fontWeight:600}}>Cube数据分析</td><td style={{color:'#34C759'}}>POST</td><td style={{fontFamily:"'SF Mono',monospace",fontSize:10}}>/api/v1/cube/query</td><td style={{color:'#34C759'}}>已发布</td><td>45</td><td>多维度聚合查询</td></tr>
      <tr><td style={{fontWeight:600}}>数据导出</td><td style={{color:'#FF9500'}}>POST</td><td style={{fontFamily:"'SF Mono',monospace",fontSize:10}}>/api/v1/export/csv</td><td style={{color:'#FF9500'}}>测试中</td><td>12</td><td>查询结果导出CSV/Excel</td></tr>
      <tr><td style={{fontWeight:600}}>表结构查询</td><td style={{color:'#007AFF'}}>GET</td><td style={{fontFamily:"'SF Mono',monospace",fontSize:10}}>/api/v1/schema/:table</td><td style={{color:'#8E8E93'}}>设计中</td><td>-</td><td>返回表字段/类型/注释</td></tr>
      <tr><td style={{fontWeight:600}}>实时推送</td><td style={{color:'#AF52DE'}}>WS</td><td style={{fontFamily:"'SF Mono',monospace",fontSize:10}}>/ws/v1/stream</td><td style={{color:'#8E8E93'}}>设计中</td><td>-</td><td>WebSocket实时指标推送</td></tr>
    </tbody></table></div>}
    {tab===1&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>数据集</th><th>所有者域</th><th>授权域</th><th>授权级别</th><th>过期时间</th><th>状态</th></tr></thead><tbody>
      <tr><td>生产运营数据</td><td>生产</td><td>质量/财务/技术支持</td><td>只读</td><td>永久</td><td style={{color:'#34C759'}}>已授权</td></tr>
      <tr><td>设备效率OEE</td><td>生产</td><td>生产计划/技术支持</td><td>只读</td><td>2027-06</td><td style={{color:'#34C759'}}>已授权</td></tr>
      <tr><td>人力考勤数据</td><td>人力资源</td><td>财务</td><td>脱敏</td><td>2026-12</td><td style={{color:'#FF9500'}}>审批中</td></tr>
    </tbody></table></div>}
    {tab===2&&<div><div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
      {[{l:'API总数',v:'5',u:'个',c:'#007AFF'},{l:'今日调用',v:'8,520',u:'次',c:'#34C759'},{l:'平均延迟',v:'125',u:'ms',c:'#FF9500'},{l:'成功率',v:'99.8',u:'%',c:'#AF52DE'}].map((k,i)=><div key={i} className="stat-mini"><div className="stat-mini-value" style={{color:k.c}}>{k.v}<span className="stat-mini-unit">{k.u}</span></div><div className="stat-mini-label">{k.l}</div></div>)}
    </div><div className="table-wrapper" style={{marginTop:10}}><table className="data-table"><thead><tr><th>时间</th><th>API</th><th>调用方</th><th>延迟</th><th>状态</th></tr></thead><tbody>
      <tr><td>14:30:25</td><td>/api/v1/metrics/FTC</td><td>质量看板</td><td>98ms</td><td style={{color:'#34C759'}}>200</td></tr>
      <tr><td>14:30:22</td><td>/api/v1/cube/query</td><td>BI大屏</td><td>245ms</td><td style={{color:'#34C759'}}>200</td></tr>
      <tr><td>14:30:18</td><td>/api/v1/metrics/OEE</td><td>设备看板</td><td>85ms</td><td style={{color:'#34C759'}}>200</td></tr>
      <tr><td>14:30:15</td><td>/api/v1/export/csv</td><td>财务部</td><td>520ms</td><td style={{color:'#FF9500'}}>429限流</td></tr>
    </tbody></table></div></div>}
    {tab===3&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>数据集</th><th>认证等级</th><th>所属域</th><th>更新频率</th><th>订阅数</th><th>操作</th></tr></thead><tbody>
      <tr><td>生产运营数据集</td><td style={{color:'#FF9500'}}>金牌</td><td>生产</td><td>每小时</td><td>48</td><td><button className="btn-mini">订阅</button></td></tr>
      <tr><td>质量绩效数据集</td><td style={{color:'#FF9500'}}>金牌</td><td>质量</td><td>每日</td><td>35</td><td><button className="btn-mini">订阅</button></td></tr>
      <tr><td>设备OEE数据集</td><td style={{color:'#007AFF'}}>银牌</td><td>生产</td><td>每班次</td><td>28</td><td><button className="btn-mini">订阅</button></td></tr>
      <tr><td>人力考勤数据集</td><td style={{color:'#8E8E93'}}>铜牌</td><td>人力</td><td>每日</td><td>12</td><td><button className="btn-mini">申请</button></td></tr>
    </tbody></table></div>}
  </div>);}
