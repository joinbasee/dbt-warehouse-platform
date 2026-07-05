import React,{useState} from 'react';
const TABS=['报表目录','报表血缘','订阅推送','使用统计'];
export default function ReportsPanel(){const[tab,setTab]=useState(0);
  return(<div className="monitor-layout"><h1 className="page-title">报表情况</h1><div className="models-tabs">{TABS.map((t,i)=><button key={i} className={`models-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>报表名称</th><th>所属域</th><th>刷新频率</th><th>状态</th><th>受众</th></tr></thead><tbody>
      <tr><td style={{fontWeight:600}}>生产运营看板</td><td>生产制造</td><td>每小时</td><td style={{color:'#34C759'}}>已发布</td><td>生产经理/车间主任</td></tr>
      <tr><td style={{fontWeight:600}}>质量绩效看板</td><td>生产制造</td><td>每日</td><td style={{color:'#34C759'}}>已发布</td><td>质量经理/Audit团队</td></tr>
      <tr><td style={{fontWeight:600}}>设备效率看板</td><td>生产制造</td><td>每班次</td><td style={{color:'#34C759'}}>已发布</td><td>设备经理/IE工程师</td></tr>
      <tr><td style={{fontWeight:600}}>过程控制看板</td><td>生产制造</td><td>每日</td><td style={{color:'#FF9500'}}>开发中</td><td>工艺工程师</td></tr>
      <tr><td style={{fontWeight:600}}>质量总览</td><td>质量管理</td><td>每日</td><td style={{color:'#FF9500'}}>开发中</td><td>质量部</td></tr>
      <tr><td style={{fontWeight:600}}>安防总览</td><td>安全与消防</td><td>每日</td><td style={{color:'#8E8E93'}}>规划中</td><td>安全管理部</td></tr>
      <tr><td style={{fontWeight:600}}>人力总览</td><td>人力资源</td><td>每日</td><td style={{color:'#8E8E93'}}>规划中</td><td>HR部门</td></tr>
      <tr><td style={{fontWeight:600}}>财务总览</td><td>财务成本</td><td>每月</td><td style={{color:'#8E8E93'}}>规划中</td><td>财务部</td></tr>
    </tbody></table></div>}
    {tab===1&&<div className="arch-diagram"><div className="chart-title" style={{marginBottom:12}}>报表血缘追溯：生产运营看板 ← FTC指标 ← ADS ← DWD ← MRS</div><div className="arch-layers">
      {[{l:'看板',c:'#007AFF',n:'生产运营看板',d:'BI消费层'},
        {l:'指标',c:'#34C759',n:'JPH / FTC / FTQ / 产量',d:'指标管理层'},
        {l:'ADS',c:'#FF9500',n:'ads_prod_ops_dashboard',d:'应用数据层'},
        {l:'DWS',c:'#AF52DE',n:'dws_prod_oee_daily ← dws_prod_quality',d:'服务数据层'},
        {l:'DWD',c:'#FF3B30',n:'dwd_prod_bde_stop ← dwd_prod_iportal_oee',d:'明细数据层'},
        {l:'ODS',c:'#5AC8FA',n:'BDE.OEE报表 / iPortal.kpi_indicator',d:'原始数据层'}].map(l=>(<div key={l.l} className="arch-layer" style={{background:'rgba(0,0,0,0.02)'}}><span className="arch-layer-tag" style={{background:l.c}}>{l.l}</span><span className="arch-layer-name">{l.n}</span><span style={{fontSize:10,color:'var(--text-tertiary)'}}>{l.d}</span></div>))}</div></div>}
    {tab===2&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>订阅名称</th><th>报表</th><th>接收人/群</th><th>频率</th><th>渠道</th><th>状态</th></tr></thead><tbody>
      <tr><td>生产日报</td><td>生产运营看板</td><td>生产经理/车间主任</td><td>每日08:00</td><td>邮件</td><td style={{color:'#34C759'}}>生效</td></tr>
      <tr><td>质量周报</td><td>质量绩效看板</td><td>质量经理/Audit</td><td>每周一09:00</td><td>企业微信</td><td style={{color:'#34C759'}}>生效</td></tr>
      <tr><td>设备异常告警</td><td>设备效率看板</td><td>设备经理/维修主管</td><td>实时</td><td>企业微信</td><td style={{color:'#FF9500'}}>测试中</td></tr>
    </tbody></table></div>}
    {tab===3&&<div><div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>{[{l:'报表总数',v:'8',u:'个',c:'#007AFF'},{l:'今日访问',v:'1,250',u:'次',c:'#34C759'},{l:'活跃用户',v:'48',u:'人',c:'#FF9500'},{l:'数据新鲜度',v:'92',u:'%',c:'#AF52DE'}].map((k,i)=><div key={i} className="stat-mini"><div className="stat-mini-value" style={{color:k.c}}>{k.v}<span className="stat-mini-unit">{k.u}</span></div><div className="stat-mini-label">{k.l}</div></div>)}</div>
      <div className="table-wrapper" style={{marginTop:10}}><table className="data-table"><thead><tr><th>报表</th><th>今日访问</th><th>昨日访问</th><th>本周</th><th>趋势</th></tr></thead><tbody>
        <tr><td>生产运营看板</td><td>480</td><td>445</td><td>2,850</td><td style={{color:'#34C759'}}>↑ 8%</td></tr>
        <tr><td>设备效率看板</td><td>320</td><td>305</td><td>1,980</td><td style={{color:'#34C759'}}>↑ 5%</td></tr>
        <tr><td>质量绩效看板</td><td>280</td><td>290</td><td>1,720</td><td style={{color:'#FF3B30'}}>↓ 3%</td></tr>
        <tr><td>过程控制看板</td><td>45</td><td>38</td><td>250</td><td style={{color:'#34C759'}}>↑ 18%</td></tr>
      </tbody></table></div></div>}
  </div>);}
