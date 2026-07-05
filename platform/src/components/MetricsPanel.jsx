import React,{useState,useMemo}from'react';
import {BENZ_METRICS_BY_DOMAIN,CROSS_DOMAIN_METRICS}from'../data/benzMetrics.js';
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,PieChart,Pie,Cell,LineChart,Line}from'recharts';
const PC=['#007AFF','#34C759','#FF9500','#FF3B30','#AF52DE','#5AC8FA','#FF6B35','#8E8E93'];
function S({l,v,u,c}){return(<div className="stat-mini"><div className="stat-mini-value" style={{color:c}}>{v}<span className="stat-mini-unit">{u}</span></div><div className="stat-mini-label">{l}</div></div>)}
const Tp=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="chart-tooltip"><div className="tooltip-label">{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||p.fill,fontSize:11}}>{p.name}:<strong>{typeof p.value==='number'?p.value.toFixed(1):p.value}</strong></div>)}</div>)}
const TABS=['指标目录','指标定义','指标血缘','指标看板配置','共性指标','指标服务'];
const DOMAINS=['Prod','QM','安全管理部','HR','F&C','TSS','PP','RD','LOG','IT','MB/MP','After sales','培训部','P&S'];

export default function MetricsPanel(){const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[selDomain,setSelDomain]=useState('Prod');const[detail,setDetail]=useState(null);
  const domains=BENZ_METRICS_BY_DOMAIN||{};const dm=domains[selDomain];const allM=useMemo(()=>Object.values(domains).flatMap(d=>d.metrics||[]),[domains]);
  const filtered=useMemo(()=>{let m=dm?.metrics||[];if(search)m=m.filter(x=>x.name.toLowerCase().includes(search.toLowerCase())||(x.meaning||'').includes(search));return m},[dm,search]);
  const metricsByLevel=useMemo(()=>{const a={};allM.forEach(m=>{const l=m.level||'原子指标';a[l]=(a[l]||0)+1});return Object.entries(a).map(([k,v])=>({name:k,value:v}))},[allM]);
  const domainStats=useMemo(()=>DOMAINS.filter(k=>domains[k]).map(k=>({name:domains[k].name,count:domains[k].count})),[]);
  const commonM=CROSS_DOMAIN_METRICS||[];

  return(<div className="monitor-layout"><h1 className="page-title">数据指标管理</h1>
    <div className="kpi-row" style={{gridTemplateColumns:'repeat(5,1fr)'}}><S l="指标总数" v={allM.length} u="个" c="#007AFF"/><S l="原子指标" v={metricsByLevel.find(x=>x.name==='原子指标')?.value||0} u="个" c="#34C759"/><S l="衍生指标" v={metricsByLevel.find(x=>x.name==='衍生指标')?.value||0} u="个" c="#FF9500"/><S l="覆盖业务域" v={Object.keys(domains).length} u="个" c="#AF52DE"/><S l="共性指标" v={commonM.length} u="个跨域" c="#FF3B30"/></div>
    <div className="models-tabs">{TABS.map((t,i)=><button key={i} className={`models-tab${tab===i?' active':''}`} onClick={()=>{setTab(i);setDetail(null)}}>{t}</button>)}</div>
    {tab===0&&<div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>{DOMAINS.filter(k=>domains[k]).map(k=>(<button key={k} onClick={()=>setSelDomain(k)} className={`filter-chip ${selDomain===k?'active':''}`}>{domains[k].name}({domains[k].count})</button>))}</div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}><input className="models-search" placeholder="搜索指标名称/含义..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:240}}/><span style={{fontSize:10,color:'var(--text-tertiary)'}}>{filtered.length} 个指标</span></div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
        <div className="table-wrapper" style={{maxHeight:420,overflow:'auto'}}><table className="data-table"><thead><tr><th>指标</th><th>含义</th><th>层级</th><th>源系统</th><th>出现</th></tr></thead><tbody>
          {filtered.map((m,i)=><tr key={i} onClick={()=>setDetail(m)} style={{cursor:'pointer'}}><td style={{fontWeight:600,fontSize:11}}>{m.name}</td><td style={{fontSize:10,color:'var(--text-secondary)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.meaning?.slice(0,30)}</td><td style={{color:m.level==='原子指标'?'#007AFF':m.level==='衍生指标'?'#34C759':'#FF9500',fontSize:10}}>{m.level}</td><td style={{fontSize:9}}>{m.sources}</td><td>{m.count}</td></tr>)}
        </tbody></table></div>
        <div className="chart-card" style={{padding:12}}><div className="chart-title" style={{fontSize:11,marginBottom:8}}>指标详情 {detail&&`— ${detail.name}`}</div>
          {detail?<table className="data-table"><tbody>
            <tr><td style={{fontWeight:600,fontSize:10}}>名称</td><td style={{fontSize:11,fontWeight:600}}>{detail.name}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>含义</td><td style={{fontSize:10}}>{detail.meaning||'-'}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>计算口径</td><td style={{fontSize:10,fontFamily:"'SF Mono',monospace"}}>{detail.calc||'-'}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>类型</td><td>{detail.type}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>层级</td><td style={{color:detail.level==='原子指标'?'#007AFF':detail.level==='衍生指标'?'#34C759':'#FF9500'}}>{detail.level}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>源系统</td><td style={{fontSize:10}}>{detail.sources}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>使用部门</td><td style={{fontSize:10}}>{detail.depts}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>刷新频率</td><td style={{fontSize:10}}>{detail.freqs}</td></tr>
            <tr><td style={{fontWeight:600,fontSize:10}}>出现次数</td><td>{detail.count} 次</td></tr>
          </tbody></table>:<div style={{color:'var(--text-tertiary)',fontSize:10,textAlign:'center',padding:30}}>← 点击左侧指标查看详情</div>}
        </div>
      </div>
    </div>}
    {tab===1&&<div>
      <div style={{display:'flex',gap:8,marginBottom:8}}><input className="models-search" placeholder="搜索指标含义/口径..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:280}}/><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{DOMAINS.filter(k=>domains[k]).map(k=>(<span key={k} onClick={()=>setSearch(k)} style={{fontSize:9,padding:'2px 6px',borderRadius:3,border:'1px solid var(--border)',cursor:'pointer',color:'var(--text-secondary)'}}>{k}</span>))}</div></div>
      <div className="table-wrapper" style={{maxHeight:480,overflow:'auto'}}><table className="data-table"><thead><tr><th>指标</th><th>含义</th><th>计算口径</th><th>CheckPoint</th><th>源系统</th><th>刷新</th></tr></thead><tbody>
        {allM.filter(m=>!search||(m.name+m.meaning+(m.calc||'')+m.sources).toLowerCase().includes(search.toLowerCase())).slice(0,80).map((m,i)=><tr key={i} onClick={()=>setDetail(m)} style={{cursor:'pointer'}}><td style={{fontWeight:600,fontSize:11}}>{m.name}</td><td style={{fontSize:10,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.meaning?.slice(0,25)}</td><td style={{fontSize:9,color:'var(--text-secondary)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.calc?.slice(0,30)||'-'}</td><td style={{fontSize:9,color:'var(--text-tertiary)'}}>{(m.calc?.match(/CP:\d+/g)||m.meaning?.match(/CP:\d+/g)||[])[0]||'-'}</td><td style={{fontSize:9}}>{m.sources}</td><td style={{fontSize:9}}>{m.freqs}</td></tr>)}
      </tbody></table></div>
    </div>}
    {tab===2&&<div className="arch-diagram"><div className="chart-title" style={{marginBottom:12}}>指标血缘 — 点击指标查看全链路追溯</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{allM.filter(m=>m.count>=4).slice(0,12).map((m,i)=>(<button key={i} onClick={()=>setDetail(m)} className="quick-cmd-chip" style={{fontSize:10}}>{m.name}({m.count})</button>))}</div>
      {detail?<div className="arch-layers">{[{l:'指标',c:'#007AFF',n:detail.name,d:`${detail.meaning||''} · ${detail.calc||''}`},{l:'ADS',c:'#FF3B30',n:`ads_${detail.sources?.split('、')[0]?.toLowerCase()||'prod'}_view`,d:'dmp_ads · BI就绪'},{l:'DWS',c:'#FF9500',n:'dws_prod_daily_agg',d:'dmp_dw · 日汇总'},{l:'DWD',c:'#34C759',n:`dwd_${(detail.sources||'').split('、')[0]?.toLowerCase()||'prod'}_clean`,d:'dmp_dw · 1:1清洗'},{l:'ODS',c:'#5AC8FA',n:`${(detail.sources||'').split('、')[0]||'MRS'}.原始表`,d:'dmp_ods · 源系统'}].map(l=>(<div key={l.l} className="arch-layer" style={{background:'rgba(0,0,0,0.02)',cursor:'pointer'}}><span className="arch-layer-tag" style={{background:l.c}}>{l.l}</span><span className="arch-layer-name" style={{fontFamily:"'SF Mono',monospace",fontSize:11}}>{l.n}</span><span style={{fontSize:10,color:'var(--text-tertiary)',marginLeft:'auto'}}>{l.d}</span></div>))}</div>:<div style={{color:'var(--text-tertiary)',fontSize:11,textAlign:'center',padding:20}}>点击上方高频指标查看血缘链路</div>}
    </div>}
    {tab===3&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
      <div className="chart-card"><div className="chart-title" style={{marginBottom:8}}>各域指标分布</div><ResponsiveContainer width="100%" height={280}><BarChart data={domainStats} layout="vertical" margin={{top:0,right:20,left:70,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis type="number" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis type="category" dataKey="name" tick={{fontSize:9,fill:'#AEAEB2'}} width={65}/><Tooltip content={<Tp/>}/><Bar dataKey="count" name="指标数" maxBarSize={16} radius={[0,3,3,0]}>{domainStats.map((_,i)=><Cell key={i} fill={PC[i%8]}/>)}<LabelList dataKey="count" position="right" style={{fontSize:9,fill:'#86868B'}}/></Bar></BarChart></ResponsiveContainer></div>
      <div className="chart-card"><div className="chart-title" style={{marginBottom:8}}>指标层级分布</div><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={metricsByLevel} cx="50%" cy="50%" innerRadius={45} outerRadius={90} dataKey="value" stroke="none" label={({name,value})=>`${name} ${value}`}><Cell fill="#007AFF"/><Cell fill="#34C759"/><Cell fill="#FF9500"/></Pie><Tooltip content={<Tp/>}/></PieChart></ResponsiveContainer></div>
    </div>}
    {tab===4&&<div className="table-wrapper"><table className="data-table"><thead><tr><th>共性指标</th><th>跨部门数</th><th>使用部门</th><th>级别</th></tr></thead><tbody>
      {commonM.slice(0,40).map((m,i)=><tr key={i} onClick={()=>{const found=allM.find(x=>x.name===m.name);if(found)setDetail(found)}} style={{cursor:'pointer'}}><td style={{fontWeight:600}}>{m.name}</td><td><span style={{color:'#007AFF',fontWeight:700,fontSize:13}}>{m.domainCount}</span></td><td style={{fontSize:10}}>{m.departments}</td><td style={{fontSize:10,color:m.domainCount>=5?'#FF3B30':m.domainCount>=3?'#FF9500':'#007AFF'}}>{m.domainCount>=5?'全域级':m.domainCount>=3?'多域级':'跨域级'}</td></tr>)}
    </tbody></table></div>}
    {tab===5&&<div className="terminal-output" style={{color:'#C3E88D',minHeight:350,fontSize:11}}>
      <div style={{color:'#82AAFF'}}># ====== 指标查询API ======</div>
      <div style={{color:'#5A5A6E'}}># 1. 单个指标查询</div>
      <div>{'GET /api/v1/metrics/ftc?workshop=AS&date=2026-07-05'}</div>
      <div style={{color:'#FFCB6B'}}>{'{"metric":"FTC","value":97.2,"unit":"%","target":95,"checkPoint":"MP1:5204","source":"MRS","trend":"up"}'}</div>
      <div style={{color:'#5A5A6E',marginTop:8}}># 2. 指标趋势 (30天)</div>
      <div>{'GET /api/v1/metrics/ftc/trend?days=30&workshop=ALL'}</div>
      <div style={{color:'#FFCB6B'}}>{'{"data":[{"date":"06-06","value":97.0},...],"avg":97.2,"min":96.5,"max":97.8}'}</div>
      <div style={{color:'#5A5A6E',marginTop:8}}># 3. 按域查询指标列表</div>
      <div>{'GET /api/v1/metrics?domain=prod&page=1&size=50'}</div>
      <div style={{color:'#5A5A6E',marginTop:8}}># 4. 共性指标查询</div>
      <div>{'GET /api/v1/metrics/cross-domain?minDomains=3'}</div>
      <div style={{color:'#5A5A6E',marginTop:8}}># 5. 指标血缘查询</div>
      <div>{'GET /api/v1/metrics/ftc/lineage'}</div>
      <div style={{color:'#FFCB6B'}}>{'{"upstream":["MRS.Delivery_data_hour"],"downstream":["ads_prod_quality_ftc"],"models":["dws_prod_quality_daily","dwd_prod_mrs_ftc"]}'}</div>
    </div>}
  </div>);}
