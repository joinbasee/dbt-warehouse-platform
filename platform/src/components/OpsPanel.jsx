import React,{useState} from 'react';
const TABS=['调度管理','资源管理','备份恢复','版本管理'];
export default function OpsPanel(){const[tab,setTab]=useState(0);
  return(<div className="monitor-layout"><h1 className="page-title">数据运维</h1><div className="models-tabs">{TABS.map((t,i)=><button key={i} className={`models-tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}</div>
    {tab===0&&<div><div className="kpi-row" style={{gridTemplateColumns:'repeat(5,1fr)'}}>
      {[{l:'调度任务',v:'5',u:'场景',c:'#007AFF'},{l:'今日执行',v:'12',u:'次',c:'#34C759'},{l:'成功率',v:'91.7',u:'%',c:'#FF9500'},{l:'平均耗时',v:'8.5',u:'min',c:'#AF52DE'},{l:'下次执行',v:'18:00',u:'',c:'#FF3B30'}].map((k,i)=><div key={i} className="stat-mini"><div className="stat-mini-value" style={{color:k.c}}>{k.v}<span className="stat-mini-unit">{k.u}</span></div><div className="stat-mini-label">{k.l}</div></div>)}
    </div><div className="table-wrapper" style={{marginTop:10}}><table className="data-table"><thead><tr><th>场景</th><th>调度</th><th>最近执行</th><th>耗时</th><th>状态</th></tr></thead><tbody>
      <tr><td style={{fontWeight:600}}>01 开票明细</td><td>每日 06:00</td><td>07-05 06:00</td><td>6.2min</td><td style={{color:'#34C759'}}>成功</td></tr>
      <tr><td style={{fontWeight:600}}>02 收入执行</td><td>每月1日 06:00</td><td>07-01 06:00</td><td>12.5min</td><td style={{color:'#34C759'}}>成功</td></tr>
      <tr><td style={{fontWeight:600}}>03 表单报表</td><td>每周一 06:00</td><td>06-30 06:00</td><td>3.8min</td><td style={{color:'#34C759'}}>成功</td></tr>
      <tr><td style={{fontWeight:600}}>04 应收</td><td>每日 07:00</td><td>07-05 07:00</td><td>8.1min</td><td style={{color:'#34C759'}}>成功</td></tr>
      <tr><td style={{fontWeight:600}}>05 选题模块</td><td>每周二 06:00</td><td>07-01 06:00</td><td>2.5min</td><td style={{color:'#FF3B30'}}>失败</td></tr>
    </tbody></table></div></div>}
    {tab===1&&<div><div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>{[{l:'CPU使用率',v:'45',u:'%',c:'#34C759'},{l:'内存使用率',v:'62',u:'%',c:'#FF9500'},{l:'存储使用率',v:'38',u:'%',c:'#007AFF'},{l:'连接池使用',v:'72',u:'%',c:'#AF52DE'}].map((k,i)=><div key={i} className="stat-mini"><div className="stat-mini-value" style={{color:k.c}}>{k.v}<span className="stat-mini-unit">{k.u}</span></div><div className="stat-mini-label">{k.l}</div></div>)}</div>
      <div className="table-wrapper" style={{marginTop:10}}><table className="data-table"><thead><tr><th>资源项</th><th>配额</th><th>已用</th><th>使用率</th><th>状态</th></tr></thead><tbody>
        <tr><td>计算资源(核)</td><td>64</td><td>28</td><td>44%</td><td style={{color:'#34C759'}}>正常</td></tr>
        <tr><td>内存(GB)</td><td>256</td><td>158</td><td>62%</td><td style={{color:'#FF9500'}}>关注</td></tr>
        <tr><td>存储(TB)</td><td>100</td><td>38</td><td>38%</td><td style={{color:'#34C759'}}>正常</td></tr>
      </tbody></table></div></div>}
    {tab===2&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>备份策略</th><th>范围</th><th>频率</th><th>保留</th><th>最近备份</th><th>状态</th></tr></thead><tbody>
      <tr><td>全量备份</td><td>全库</td><td>每周日02:00</td><td>4周</td><td>06-29 02:15</td><td style={{color:'#34C759'}}>成功</td></tr>
      <tr><td>增量备份</td><td>ODS层</td><td>每日03:00</td><td>7天</td><td>07-05 03:08</td><td style={{color:'#34C759'}}>成功</td></tr>
      <tr><td>Hive→OceanBase</td><td>ADS层</td><td>每日06:30</td><td>实时</td><td>07-05 06:42</td><td style={{color:'#34C759'}}>成功</td></tr>
    </tbody></table></div>}
    {tab===3&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>模型</th><th>版本</th><th>修改时间</th><th>作者</th><th>变更说明</th></tr></thead><tbody>
      <tr><td style={{fontFamily:"'SF Mono',monospace"}}>dwd_prod_bde_stop</td><td>v3</td><td>07-05 05:50</td><td>Agent-3</td><td>新增模具停机分类</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace"}}>dws_prod_oee_daily</td><td>v2</td><td>07-04 17:30</td><td>Agent-4</td><td>修复JPH计算口径</td></tr>
      <tr><td style={{fontFamily:"'SF Mono',monospace"}}>ads_prod_ops</td><td>v1</td><td>07-03 10:15</td><td>Agent-6</td><td>初始版本</td></tr>
    </tbody></table></div>}
  </div>);}
