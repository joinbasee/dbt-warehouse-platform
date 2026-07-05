import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, LabelList
} from 'recharts';
import { PROJECTS } from '../data/projects.js';
import { BENZ_DOMAIN_DASHBOARDS, generateMockData } from '../data/benzDomain.js';
import { UNISITY_DOMAIN_DASHBOARDS, UNISITY_PLATFORM, UNISITY_REPORTS } from '../data/unisityDomain.js';

const PIE_COLORS = ['#FF3B30','#FF9500','#007AFF','#34C759','#AF52DE'];
const COLORS = ['#007AFF','#34C759','#FF9500','#FF3B30','#AF52DE','#5AC8FA','#FF6B35','#8E8E93'];

function S({ label, value, unit, trend, trendVal, src }) {
  return (<div className="stat-mini"><div className="stat-mini-value">{value}<span className="stat-mini-unit">{unit}</span></div><div className="stat-mini-label">{label}{trendVal && <span className={`stat-trend ${trend==='down'?'down':trend==='warn'?'':'up'}`}>{trendVal}</span>}</div>{src && <div style={{fontSize:9,color:'var(--text-tertiary)',marginTop:1}}>{src}</div>}</div>);
}
const Tp = ({ active, payload, label }) => { if (!active||!payload?.length) return null; return (<div className="chart-tooltip"><div className="tooltip-label">{label}</div>{payload.map((p,i)=>(<div key={i} style={{color:p.color||p.fill,fontSize:11,lineHeight:1.5}}>{p.name}: <strong>{typeof p.value==='number'?p.value.toFixed(1):p.value}</strong></div>))}</div>); };
function TC({ title, headers, rows }) { return (<div className="chart-card"><div className="chart-card-header"><span className="chart-title">{title}</span></div><div style={{overflowY:'auto',maxHeight:200}}><table className="data-table"><thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={c.style||{}}>{c.text}</td>)}</tr>)}</tbody></table></div></div>); }
function ParetoChart({ data, h:height=200 }) { const total=data.reduce((s,d)=>s+d.value,0);let cum=0;const cd=data.map(d=>{cum+=d.value;return{...d,累计:(cum/total*100).toFixed(1)}});return (<ResponsiveContainer width="100%" height={height}><ComposedChart data={cd} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="name" tick={{fontSize:9,fill:'#AEAEB2'}} angle={-20} textAnchor="end" height={50}/><YAxis yAxisId="left" tick={{fontSize:9,fill:'#AEAEB2'}} width={30}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:'#AEAEB2'}} width={30} domain={[0,100]} unit="%"/><Tooltip content={<Tp/>}/><Bar yAxisId="left" dataKey="value" name="数量" maxBarSize={28} radius={[4,4,0,0]}>{cd.map((_,i)=><Cell key={i} fill={COLORS[i%8]}/>)}</Bar><Line yAxisId="right" dataKey="累计" name="累计%" stroke="#007AFF" strokeWidth={2} dot={{r:3,fill:'#007AFF'}}/></ComposedChart></ResponsiveContainer>); }

function EmptyBI() {
  return (<div className="empty-state" style={{flex:1}}><div className="empty-state-icon" style={{fontSize:48,opacity:0.3}}>BI</div><div className="empty-state-text">该项目的 BI 看板尚未配置</div><div className="empty-state-hint">请先在对应项目下建立业务域指标体系后再生成看板</div></div>);
}

export default function BIDashboard() {
  const [activeProject, setActiveProject] = useState('benz');
  const [activeDomain, setActiveDomain] = useState('prod');
  const [activeDashboard, setActiveDashboard] = useState('prod-ops');
  const [mock] = useState(generateMockData);
  const [drillStack, setDrillStack] = useState([]); // Unisity钻取栈

  const project = PROJECTS.find(p=>p.id===activeProject)||PROJECTS[1];

  // Benz: 9业务域
  const benzDomains = useMemo(()=>Object.entries(BENZ_DOMAIN_DASHBOARDS).map(([k,v])=>({code:k,...v})),[]);
  // Unisity: 4业务域
  const unisityDomains = useMemo(()=>Object.entries(UNISITY_DOMAIN_DASHBOARDS).map(([k,v])=>({code:k,...v})),[]);

  const switchProject = (pid) => {
    setActiveProject(pid);
    setDrillStack([]);
    if (pid==='benz') { setActiveDomain('prod'); setActiveDashboard('prod-ops'); }
    else if (pid==='unisity') { setActiveDomain('campus'); setActiveDashboard('campus-main'); }
  };

  const switchDomain = (code) => {
    setActiveDomain(code); setDrillStack([]);
    if (activeProject==='benz') { const d=benzDomains.find(x=>x.code===code); if(d?.dashboards[0]) setActiveDashboard(d.dashboards[0].id); }
    else if (activeProject==='unisity') { const d=unisityDomains.find(x=>x.code===code); if(d?.dashboards[0]) setActiveDashboard(d.dashboards[0].id); }
  };

  // Unisity钻取逻辑
  const currentUnisityDomain = unisityDomains.find(d=>d.code===activeDomain);
  const allDashboards = currentUnisityDomain?.dashboards||[];
  const currentDash = allDashboards.find(d=>d.id===activeDashboard);
  const isDrillMode = currentDash?.level==='drill';

  const enterDrill = (drillId) => {
    setDrillStack([...drillStack, activeDashboard]);
    setActiveDashboard(drillId);
  };
  const exitDrill = () => {
    if (drillStack.length>0) { setActiveDashboard(drillStack[drillStack.length-1]); setDrillStack(drillStack.slice(0,-1)); }
  };

  // Benz渲染
  const benzCurrentDomain = benzDomains.find(d=>d.code===activeDomain);
  const benzDash = benzCurrentDomain?.dashboards?.find(d=>d.id===activeDashboard);

  const renderBenzChart = (type, i) => {
    const charts = {
      hourly:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">小时产量分布</span><span className="chart-subtitle">MRS</span></div><ResponsiveContainer width="100%" height={200}><BarChart data={mock.hourly} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="hour" tick={{fontSize:8,fill:'#AEAEB2'}} angle={-45} textAnchor="end" height={45}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={24}/><Tooltip content={<Tp/>}/><Bar dataKey="上线" stackId="a" fill="#007AFF" maxBarSize={20}/><Bar dataKey="下线" stackId="a" fill="#5AC8FA" maxBarSize={20}/><Bar dataKey="FOK" stackId="a" fill="#34C759" maxBarSize={20}/></BarChart></ResponsiveContainer><div className="chart-legend-mini"><span><span className="legend-dot" style={{background:'#007AFF'}}/>上线</span><span><span className="legend-dot" style={{background:'#5AC8FA'}}/>下线</span><span><span className="legend-dot" style={{background:'#34C759'}}/>FOK</span></div></div>),
      jph:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">JPH趋势（近7天）</span><span className="chart-subtitle">MRS/iPortal</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.jph} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={24} domain={[35,50]}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="JPH" stroke="#007AFF" strokeWidth={2.5} dot={{r:3,fill:'#007AFF'}}/><Line type="monotone" dataKey="目标" stroke="#FF3B30" strokeDasharray="5 3" dot={false} strokeWidth={1.5}/></LineChart></ResponsiveContainer></div>),
      plan:(<TC key={i} title="生产计划 vs 实际" headers={['班次','计划','实际','差异','达成率','原因']} rows={[['早班','165','160',{text:'-5',style:{color:'#FF9500'}},'97.0%','设备短暂停机'],['中班','120','115',{text:'-5',style:{color:'#FF9500'}},'95.8%','物料延迟'],['夜班','60','53',{text:'-7',style:{color:'#FF3B30'}},'88.3%','人员不足']].map(r=>r.map(c=>typeof c==='string'?{text:c}:c))}/>),
      monthly:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">月度产量报告</span><span className="chart-subtitle">MRS</span></div><ResponsiveContainer width="100%" height={200}><BarChart data={mock.monthly} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="month" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={30}/><Tooltip content={<Tp/>}/><Bar dataKey="上线" fill="#007AFF" maxBarSize={24} radius={[4,4,0,0]}/><Bar dataKey="下线" fill="#5AC8FA" maxBarSize={24} radius={[4,4,0,0]}/><Bar dataKey="FOK" fill="#34C759" maxBarSize={24} radius={[4,4,0,0]}/><Bar dataKey="HO" fill="#AF52DE" maxBarSize={24} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer><div className="chart-legend-mini"><span><span className="legend-dot" style={{background:'#007AFF'}}/>上线</span><span><span className="legend-dot" style={{background:'#5AC8FA'}}/>下线</span><span><span className="legend-dot" style={{background:'#34C759'}}/>FOK</span><span><span className="legend-dot" style={{background:'#AF52DE'}}/>HO</span></div></div>),
      abnormal:(<TC key={i} title="异常车辆监控" headers={['指标','值','阈值','状态']} rows={[['滞留车数','8','≤10',{text:'正常',style:{color:'#34C759'}}],['滞留超24h',{text:'3',style:{color:'#FF3B30'}},'0',{text:'需关注',style:{color:'#FF3B30'}}],['离线车数','5','≤15',{text:'正常',style:{color:'#34C759'}}],['车间在制','142','≤200',{text:'正常',style:{color:'#34C759'}}]].map(r=>r.map(c=>typeof c==='string'?{text:c}:c))}/>),
      summary:(<TC key={i} title="关键指标速览" headers={['指标','值','目标','状态']} rows={[['FTC','97.2%','≥95%',{text:'达标',style:{color:'#34C759'}}],['FTQ','98.5%','≥97%',{text:'达标',style:{color:'#34C759'}}],['OEE',{text:'83.5%',style:{color:'#FF9500'}},'≥85%',{text:'未达标',style:{color:'#FF3B30'}}],['SPH','22','≥20',{text:'达标',style:{color:'#34C759'}}]].map(r=>r.map(c=>typeof c==='string'?{text:c}:c))}/>),
      trend:(<div className="chart-card" key={i} style={{gridColumn:'span 2'}}><div className="chart-card-header"><span className="chart-title">FTC/FTQ/VoCA/PAF 日趋势</span><span className="chart-subtitle">MRS</span></div><ResponsiveContainer width="100%" height={240}><LineChart data={mock.qualityTrend} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}} interval={4}/><YAxis yAxisId="left" tick={{fontSize:9,fill:'#AEAEB2'}} width={28} domain={[90,100]}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:'#AEAEB2'}} width={28}/><Tooltip content={<Tp/>}/><Line yAxisId="left" type="monotone" dataKey="FTC%" stroke="#007AFF" strokeWidth={2} dot={false}/><Line yAxisId="left" type="monotone" dataKey="FTQ%" stroke="#34C759" strokeWidth={2} dot={false}/><Line yAxisId="right" type="monotone" dataKey="VoCA" stroke="#FF9500" strokeWidth={2} dot={false}/><Line yAxisId="right" type="monotone" dataKey="PAF" stroke="#FF3B30" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer><div className="chart-legend-mini"><span><span className="legend-dot" style={{background:'#007AFF'}}/>FTC%</span><span><span className="legend-dot" style={{background:'#34C759'}}/>FTQ%</span><span><span className="legend-dot" style={{background:'#FF9500'}}/>VoCA</span><span><span className="legend-dot" style={{background:'#FF3B30'}}/>PAF</span></div></div>),
      voca_pareto:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">VoCA缺陷帕累托</span><span className="chart-subtitle">MRS</span></div><ParetoChart data={mock.vocaPareto}/></div>),
      paf_pareto:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">PAF缺陷帕累托</span><span className="chart-subtitle">PowerBI</span></div><ParetoChart data={mock.pafPareto}/></div>),
      workshop:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">各车间质量KPI对比</span><span className="chart-subtitle">MRS</span></div><ResponsiveContainer width="100%" height={220}><BarChart data={mock.workshops} layout="vertical" margin={{top:5,right:10,left:50,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis type="number" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis type="category" dataKey="name" tick={{fontSize:9,fill:'#AEAEB2'}} width={55}/><Tooltip content={<Tp/>}/><Bar dataKey="FTC%" fill="#007AFF" maxBarSize={12} radius={[0,2,2,0]}/><Bar dataKey="FTQ%" fill="#34C759" maxBarSize={12} radius={[0,2,2,0]}/><Bar dataKey="VoCA" fill="#FF9500" maxBarSize={12} radius={[0,2,2,0]}/></BarChart></ResponsiveContainer></div>),
      quality_issues:(<TC key={i} title="重点质量问题" headers={['编号','问题','责任','状态']} rows={[['Q-0628','右后门间隙超差0.5mm','AS',{text:'整改中',style:{color:'#FF9500'}}],['Q-0629','前盖PAF划伤','PS',{text:'超期',style:{color:'#FF3B30'}}],['Q-0701','扭矩EC红灯率','AS',{text:'分析中',style:{color:'#FF9500'}}]].map(r=>r.map(c=>typeof c==='string'?{text:c}:c))}/>),
      quality_snapshot:(<TC key={i} title="过程快报" headers={['指标','值','目标','状态']} rows={[['扭矩EC红灯率','2.8%','≤3.0%',{text:'正常',style:{color:'#34C759'}}],['报废PPM','12,800','≤15,000',{text:'正常',style:{color:'#34C759'}}],['3C CPK','1.42','≥1.33',{text:'合格',style:{color:'#34C759'}}],['焊返率','1.5%','≤2.0%',{text:'正常',style:{color:'#34C759'}}]].map(r=>r.map(c=>typeof c==='string'?{text:c}:c))}/>),
      oee_stack:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">OEE三要素分解</span><span className="chart-subtitle">BDE</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.oee30} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}} interval={4}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={28} domain={[80,100]}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="可用性" stroke="#007AFF" strokeWidth={1.5} dot={false}/><Line type="monotone" dataKey="性能" stroke="#5AC8FA" strokeWidth={1.5} dot={false}/><Line type="monotone" dataKey="质量率" stroke="#34C759" strokeWidth={1.5} dot={false}/></LineChart></ResponsiveContainer><div className="chart-legend-mini"><span><span className="legend-dot" style={{background:'#007AFF'}}/>可用性</span><span><span className="legend-dot" style={{background:'#5AC8FA'}}/>性能</span><span><span className="legend-dot" style={{background:'#34C759'}}/>质量率</span></div></div>),
      oee_sph:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">OEE/SPH 日趋势</span></div><ResponsiveContainer width="100%" height={200}><ComposedChart data={mock.oeeDaily} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis yAxisId="left" tick={{fontSize:9,fill:'#AEAEB2'}} width={28} domain={[75,95]}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:9,fill:'#AEAEB2'}} width={28}/><Tooltip content={<Tp/>}/><Bar yAxisId="left" dataKey="OEE" fill="#007AFF" maxBarSize={20} radius={[4,4,0,0]}/><Line yAxisId="right" type="monotone" dataKey="SPH" stroke="#FF9500" strokeWidth={2.5} dot={{r:4,fill:'#FF9500'}}/></ComposedChart></ResponsiveContainer></div>),
      stop_pareto:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">停机帕累托</span><span className="chart-subtitle">iPortal</span></div><ParetoChart data={mock.stopPareto}/></div>),
      stop_top10:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">停机时长Top10</span></div><ResponsiveContainer width="100%" height={220}><BarChart data={mock.stopTop10.slice().reverse()} layout="vertical" margin={{top:5,right:40,left:115,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis type="number" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis type="category" dataKey="name" tick={{fontSize:8,fill:'#AEAEB2'}} width={110}/><Tooltip content={<Tp/>}/><Bar dataKey="min" maxBarSize={14} radius={[0,3,3,0]}>{mock.stopTop10.map((_,idx)=><Cell key={idx} fill={idx<3?'#FF3B30':idx<6?'#FF9500':'#007AFF'}/>)}<LabelList dataKey="min" position="right" style={{fontSize:9,fill:'#86868B'}} formatter={v=>`${v}min`}/></Bar></BarChart></ResponsiveContainer></div>),
      stop_pie:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">停机类型占比</span></div><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={mock.stopPie} cx="50%" cy="50%" innerRadius={35} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">{mock.stopPie.map((_,idx)=><Cell key={idx} fill={PIE_COLORS[idx]}/>)}</Pie><Tooltip content={<Tp/>}/></PieChart></ResponsiveContainer><div className="chart-legend-mini">{mock.stopPie.map((d,i)=><span key={i}><span className="legend-dot" style={{background:PIE_COLORS[i]}}/>{d.name}</span>)}</div></div>),
      takt:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">瓶颈工位节拍</span></div><ResponsiveContainer width="100%" height={220}><BarChart data={mock.takt} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="station" tick={{fontSize:7,fill:'#AEAEB2'}} angle={-45} textAnchor="end" height={45}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={24} domain={[60,85]}/><Tooltip content={<Tp/>}/><Bar dataKey="actual" maxBarSize={18} radius={[4,4,0,0]}>{mock.takt.map((d,i)=><Cell key={i} fill={d.actual>72?'#FF3B30':d.actual>70?'#FF9500':'#34C759'}/>)}</Bar><Line type="monotone" dataKey="target" stroke="#FF3B30" strokeDasharray="5 3" dot={false} strokeWidth={1.5}/></BarChart></ResponsiveContainer></div>),
      film_thickness:(<div className="chart-card" key={i} style={{gridColumn:'span 2'}}><div className="chart-card-header"><span className="chart-title">膜厚趋势</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.film} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}} interval={4}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={28}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="电泳" stroke="#007AFF" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="面漆" stroke="#34C759" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="分层" stroke="#AF52DE" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>),
    };
    return charts[type] || (<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">{type}</span></div><div className="empty-state"><div className="empty-state-text">图表开发中</div></div></div>);
  };

  const renderBenzOtherChart = (type, i) => {
    const Q={qm_cmm:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">CMM CPK 各工位</span></div><ResponsiveContainer width="100%" height={200}><BarChart data={mock.qmCmm||[{station:'Z2.3',cpk:'1.52'}]} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="station" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={28}/><Tooltip content={<Tp/>}/><Bar dataKey="cpk" fill="#007AFF" maxBarSize={24} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>),
      qm_8d:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">8D开闭趋势</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.qm8d||[]} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}} interval={4}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={28}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="open" stroke="#FF9500" strokeWidth={2} dot={false} name="新开"/><Line type="monotone" dataKey="closed" stroke="#34C759" strokeWidth={2} dot={false} name="关闭"/></LineChart></ResponsiveContainer></div>),
      qm_supplier:(<TC key={i} title="供应商质量" headers={['指标','值','目标','状态']} rows={[['零件交付PPM','2,850','≤3,000',{text:'正常',style:{color:'#34C759'}}],['索赔接受率','87.2%','≥85%',{text:'正常',style:{color:'#34C759'}}]].map(r=>r.map(c=>typeof c==='string'?{text:c}:c))}/>),
      safety_events:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">安全事件趋势(月)</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.safetyEvents||[]} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="month" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={24}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="安全事件" stroke="#FF3B30" strokeWidth={2} dot={{r:3,fill:'#FF3B30'}}/><Line type="monotone" dataKey="消防报警" stroke="#FF9500" strokeWidth={2} dot={{r:3,fill:'#FF9500'}}/><Line type="monotone" dataKey="周界报警" stroke="#007AFF" strokeWidth={2} dot={{r:3,fill:'#007AFF'}}/></LineChart></ResponsiveContainer></div>),
      hr_ot:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">OT趋势(30天)</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.hrOT||[]} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}} interval={4}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={30} domain={[2500,4500]}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="OT" stroke="#AF52DE" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="目标" stroke="#FF3B30" strokeDasharray="5 3" dot={false}/></LineChart></ResponsiveContainer></div>),
      fc_cost:(<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">运营成本 vs 预算</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={mock.fcCost||[]} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}} interval={4}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={30}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="预算" stroke="#FF3B30" strokeDasharray="5 3" dot={false}/><Line type="monotone" dataKey="实际" stroke="#007AFF" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>),
    };
    return Q[type] || (<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">{type}</span></div><div className="empty-state"><div className="empty-state-text">开发中</div></div></div>);
  };

  // Unisity: 通用模拟图表
  const renderUnisityChart = (type, i) => {
    const d=Array.from({length:7},(_,i)=>({day:`0${6+i}`.slice(-2)}));
    const line=(k,v,c)=> (<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">{k}</span></div><ResponsiveContainer width="100%" height={200}><LineChart data={v||d.map(x=>({...x,v:50+Math.random()*50}))} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={30}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="v" stroke={c||'#007AFF'} strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>);
    const bar=(k,v,c)=> (<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">{k}</span></div><ResponsiveContainer width="100%" height={200}><BarChart data={v||['A','B','C','D','E'].map(x=>({name:x,v:20+Math.random()*80}))} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="name" tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={30}/><Tooltip content={<Tp/>}/><Bar dataKey="v" fill={c||'#007AFF'} maxBarSize={30} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>);
    if (type.startsWith('enroll_funnel')||type==='funnel_detail') return bar('招生漏斗','咨询量/报名数/录取数/报到数'.split('/').map(x=>({name:x,v:1000+Math.random()*20000})),'#34C759');
    if (type.includes('trend')||type.includes('predict')) return line('趋势分析',null,'#007AFF');
    if (type.includes('pie')||type.includes('ratio')) return (<div className="chart-card" key={i}><div className="chart-card-header"><span className="chart-title">{type}</span></div><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[{name:'A',value:35},{name:'B',value:25},{name:'C',value:20},{name:'D',value:15},{name:'E',value:5}]} cx="50%" cy="50%" innerRadius={35} outerRadius={75} dataKey="value" stroke="none">{PIE_COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip content={<Tp/>}/></PieChart></ResponsiveContainer></div>);
    return bar('数据概览',null,'#007AFF');
  };

  // Unisity钻取表格
  const renderDrillTable = (type, i) => {
    const rows={
      asset_detail:[['教学大楼','12栋','85,200m²','良好'],['实验楼','5栋','28,500m²','良好'],['图书馆','1栋','18,000m²','良好'],['体育馆','2栋','12,000m²','需维修']],
      energy_trend:[['1月','32','4.8'],['2月','28','4.2'],['3月','30','4.5'],['4月','26','3.9'],['5月','25','3.8'],['6月','24','3.6']],
      finance_structure:[['财政拨款','2.85','52.3%'],['学费收入','1.52','27.9%'],['科研经费','0.65','11.9%'],['其他收入','0.43','7.9%']],
      research_output:[['国家级项目','45','2,850万'],['省部级项目','85','1,520万'],['横向课题','120','4,200万'],['校级项目','35','380万']],
    };
    const d=rows[type];
    if (!d) return renderUnisityChart(type,i);
    const h=type.includes('finance')?['来源','金额(亿元)','占比']:type.includes('research')?['类型','数量','经费']:type.includes('energy')?['月份','用电(万kWh)','用水(万吨)']:['资产','数量','面积','状态'];
    return <TC key={i} title="明细数据" headers={h} rows={d.map(r=>r.map(c=>({text:c})))}/>;
  };

  return (
    <div className="monitor-layout">
      {/* 顶栏 */}
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:16}}>
          <h1 className="page-title">BI 看板</h1>
          <div style={{display:'flex',gap:2,background:'rgba(0,0,0,0.03)',borderRadius:8,padding:2}}>
            {PROJECTS.map(p=>(<button key={p.id} onClick={()=>switchProject(p.id)}
              style={{padding:'4px 14px',borderRadius:6,border:'none',fontSize:11,fontWeight:500,cursor:'pointer',
                background:activeProject===p.id?'var(--card)':'transparent',
                color:activeProject===p.id?'var(--text)':'var(--text-tertiary)',
                boxShadow:activeProject===p.id?'var(--shadow-sm)':'none'}}>{p.name}</button>))}
          </div>
          <span style={{fontSize:11,color:'var(--text-tertiary)'}}>{project.subtitle}</span>
        </div>
      </div>

      {/* PEP空状态 */}
      {activeProject==='pep' && <EmptyBI/>}

      {/* Benz */}
      {activeProject==='benz' && (<>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {benzDomains.map(d=>(<button key={d.code} onClick={()=>switchDomain(d.code)}
            style={{padding:'5px 12px',borderRadius:16,border:`1px solid ${activeDomain===d.code?d.color:'var(--border)'}`,
              background:activeDomain===d.code?d.color+'15':'transparent',color:activeDomain===d.code?d.color:'var(--text-secondary)',
              fontSize:11,fontWeight:500,cursor:'pointer',transition:'all 0.2s'}}>{d.name} <span style={{opacity:0.5,fontSize:10}}>{d.demand}条</span></button>))}
        </div>
        {benzCurrentDomain?.dashboards?.length>1 && (<div className="models-tabs">{benzCurrentDomain.dashboards.map(d=>(<button key={d.id} className={`models-tab${activeDashboard===d.id?' active':''}`} onClick={()=>setActiveDashboard(d.id)}>{d.name}</button>))}</div>)}
        {benzDash?.kpis?.length>0 && (<div className="kpi-row" style={{gridTemplateColumns:`repeat(${Math.min(benzDash.kpis.length,6)},1fr)`}}>{benzDash.kpis.map((k,i)=><S key={i} {...k}/>)}</div>)}
        <div style={{display:'grid',gap:10,gridTemplateColumns:'1fr 1fr 1fr'}}>
          {benzDash?.charts?.map((c,i)=>{const s=['trend','film_thickness'].includes(c)?{gridColumn:'span 2'}:{};return <div key={i} style={s}>{renderBenzChart(c,i)||renderBenzOtherChart(c,i)}</div>;})}
        </div>
      </>)}

      {/* Unisity */}
      {activeProject==='unisity' && (<>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {unisityDomains.map(d=>(<button key={d.code} onClick={()=>switchDomain(d.code)}
            style={{padding:'5px 12px',borderRadius:16,border:`1px solid ${activeDomain===d.code?d.color:'var(--border)'}`,
              background:activeDomain===d.code?d.color+'15':'transparent',color:activeDomain===d.code?d.color:'var(--text-secondary)',
              fontSize:11,fontWeight:500,cursor:'pointer',transition:'all 0.2s'}}>{d.name} <span style={{opacity:0.5,fontSize:10}}>{d.demand}指标</span></button>))}
        </div>

        {/* 面包屑钻取 */}
        {isDrillMode && (<div style={{display:'flex',alignItems:'center',gap:8,fontSize:11}}>
          <button className="btn-mini" onClick={exitDrill}>← 返回大屏</button>
          <span style={{color:'var(--text-tertiary)'}}>{allDashboards.find(d=>d.id===drillStack[drillStack.length-1])?.name} / <b>{currentDash?.name}</b></span>
        </div>)}

        {/* Unisity主屏标签 */}
        {currentUnisityDomain && !isDrillMode && (<>
          <div className="models-tabs">
            {allDashboards.filter(d=>d.level==='main').map(d=>(<button key={d.id} className={`models-tab${activeDashboard===d.id?' active':''}`} onClick={()=>setActiveDashboard(d.id)}>大屏：{d.name}</button>))}
          </div>
          {/* 钻取入口 */}
          {currentDash?.drills && (<div style={{marginTop:4}}>
            <span style={{fontSize:10,color:'var(--text-tertiary)',marginRight:8}}>钻取分析：</span>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {currentDash.drills.map(d=>(<button key={d.id} onClick={()=>enterDrill(d.id)}
                className="btn-mini" style={{fontSize:10,padding:'3px 10px'}}>{d.name}</button>))}
            </div>
          </div>)}
        </>)}

        {/* KPI + 图表 */}
        {currentDash?.kpis?.length>0 && (<div className="kpi-row" style={{gridTemplateColumns:`repeat(${Math.min(currentDash.kpis.length,6)},1fr)`}}>{currentDash.kpis.map((k,i)=><S key={i} {...k}/>)}</div>)}
        <div style={{display:'grid',gap:10,gridTemplateColumns:'1fr 1fr'}}>
          {currentDash?.charts?.map((c,i)=>renderUnisityChart(c,i))}
          {/* 如果有钻取表格，显示额外明细 */}
          {currentDash?.id?.includes('asset') && renderDrillTable('asset_detail',99)}
          {currentDash?.id?.includes('energy') && renderDrillTable('energy_trend',98)}
          {currentDash?.id?.includes('finance') && renderDrillTable('finance_structure',97)}
          {currentDash?.id?.includes('research') && renderDrillTable('research_output',96)}
        </div>
      </>)}
    </div>
  );
}
