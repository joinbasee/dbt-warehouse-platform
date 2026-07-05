import React, { useState, useMemo } from 'react';
import { BENZ_SYSTEMS, BENZ_DATABASES, READINESS_STATS } from '../data/benzGovernance.js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#34C759','#FF9500','#007AFF','#FF3B30','#8E8E93'];
const PIE_C = ['#007AFF','#34C759','#FF9500','#AF52DE','#FF3B30','#5AC8FA','#FF6B35','#8E8E93'];
const RADAR_D = ['完整性','有效性','及时性','一致性','准确性','唯一性'];

function S({label,value,unit,color,sub}){return(<div className="stat-mini"><div className="stat-mini-value" style={{color}}>{value}<span className="stat-mini-unit">{unit}</span></div><div className="stat-mini-label">{label}{sub&&<span className="stat-trend" style={{color:color,marginLeft:6}}>{sub}</span>}</div></div>)}
const Tp=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="chart-tooltip"><div className="tooltip-label">{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||p.fill,fontSize:11}}>{p.name}:<strong>{typeof p.value==='number'?p.value.toFixed(1):p.value}</strong></div>)}</div>)}

const TABS=['数据地图','元数据管理','数据标准','质量中心','血缘追踪','安全中心','生命周期','治理评估'];

// 模拟字段级元数据
const FIELD_META = {
  'BDE':{desc:'冲压车间生产数据系统 (SQL Server, 8张表)',fields:[
    {name:'event_time',type:'DATETIME',desc:'事件时间戳',nullable:false,quality:'✓'},
    {name:'shift_id',type:'VARCHAR(10)',desc:'班次ID (早/中/夜)',nullable:false,quality:'✓'},
    {name:'stop_code',type:'VARCHAR(20)',desc:'停机代码 (Level1-4层级)',nullable:false,quality:'✓'},
    {name:'stop_reason',type:'VARCHAR(200)',desc:'停机原因描述',nullable:true,quality:'⚠ 12%空值'},
    {name:'duration_min',type:'DECIMAL(8,1)',desc:'停机时长(分钟)',nullable:false,quality:'✓'},
    {name:'oee_value',type:'DECIMAL(5,2)',desc:'OEE综合效率值',nullable:false,quality:'✓'},
    {name:'workshop',type:'VARCHAR(20)',desc:'车间代码',nullable:false,quality:'✓'},
    {name:'line_code',type:'VARCHAR(10)',desc:'产线代码',nullable:true,quality:'✓'},
  ]},
  'MRS':{desc:'生产核心系统 (数据库待确认, 4张真实表+4报告)',fields:[
    {name:'event_time',type:'DATETIME',desc:'事件时间',nullable:false,quality:'✓'},
    {name:'cp_code',type:'VARCHAR(20)',desc:'Check Point编号 (00005094等)',nullable:false,quality:'✓'},
    {name:'output_qty',type:'INT',desc:'产出数量',nullable:false,quality:'✓'},
    {name:'defect_qty',type:'INT',desc:'缺陷数量',nullable:true,quality:'⚠ 3%空值'},
    {name:'jph_value',type:'DECIMAL(5,1)',desc:'JPH值',nullable:false,quality:'✓'},
    {name:'vehicle_id',type:'VARCHAR(30)',desc:'车辆VIN码',nullable:true,quality:'✓'},
  ]},
  'iPortal':{desc:'生产门户系统 (SQL Server/MySQL, 2张表)',fields:[
    {name:'kpi_code',type:'VARCHAR(20)',desc:'KPI代码',nullable:false,quality:'✓'},
    {name:'kpi_value',type:'DECIMAL(10,2)',desc:'KPI值',nullable:false,quality:'✓'},
    {name:'level_code',type:'VARCHAR(10)',desc:'停机层级代码(1-4)',nullable:false,quality:'✓'},
    {name:'level_desc',type:'VARCHAR(200)',desc:'停机层级描述',nullable:true,quality:'✓'},
    {name:'update_time',type:'DATETIME',desc:'更新时间',nullable:false,quality:'✓'},
  ]},
};
Object.keys(FIELD_META).forEach(k=>{FIELD_META[k].fields=FIELD_META[k].fields||[]});

export default function GovernancePanel() {
  const [tab, setTab] = useState(0);
  const [selectedSys, setSelectedSys] = useState(null);
  const [searchMeta, setSearchMeta] = useState('');
  const systems = BENZ_SYSTEMS || [];
  const dbs = BENZ_DATABASES || [];
  const ready = READINESS_STATS || {A:0,B1:0,B2:0,C:0,D:0};
  const sysWithTables = systems.filter(s=>s.tables?.length>0);

  // 质量趋势模拟
  const qualityTrend = useMemo(()=>Array.from({length:30},(_,i)=>({day:`D${i+1}`,完整性:96+Math.random()*4,有效性:94+Math.random()*5,及时性:88+Math.random()*10,一致性:92+Math.random()*6,准确性:95+Math.random()*4,唯一性:97+Math.random()*3})),[]);
  const qualityRadar = [{metric:'完整性',value:98.5},{metric:'有效性',value:94.2},{metric:'及时性',value:82.5},{metric:'一致性',value:91.0},{metric:'准确性',value:96.8},{metric:'唯一性',value:99.1}];

  const renderTab = () => {
    switch(tab) {
      case 0: // 数据地图 - 可点击详细
        return (<div className="models-content" style={{flex:1,minHeight:0,gap:14}}>
          <div className="model-list" style={{flex:'0 0 340px'}}>
            <input className="models-search" placeholder="搜索系统..." style={{margin:'0 8px 8px',width:'calc(100% - 16px)'}} onChange={e=>setSearchMeta(e.target.value)}/>
            {systems.filter(s=>!searchMeta||s.name.toLowerCase().includes(searchMeta.toLowerCase())||s.domains.includes(searchMeta)||s.db.includes(searchMeta)).map((s,i)=>(
              <div key={i} className={`model-list-item${selectedSys?.name===s.name?' selected':''}`} onClick={()=>setSelectedSys(s)} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="model-list-item-name" style={{fontSize:11}}>{s.name}</div>
                  <div className="model-list-item-info">{s.domains} · {s.db}</div>
                  <div style={{display:'flex',gap:4,marginTop:2}}>
                    {s.tables?.slice(0,3).map((t,j)=><span key={j} style={{fontSize:8,background:'rgba(0,122,255,0.08)',color:'#007AFF',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:120}}>{t}</span>)}
                    {(s.tables?.length||0)>3&&<span style={{fontSize:8,color:'var(--text-tertiary)'}}>+{s.tables.length-3}</span>}
                  </div>
                </div>
                <span style={{fontSize:10,color:s.readiness==='A'?'#34C759':s.readiness?.startsWith('B')?'#FF9500':s.readiness==='C'?'#FF3B30':'#8E8E93',fontWeight:600,flexShrink:0,marginLeft:8}}>{s.readiness}</span>
              </div>
            ))}
          </div>
          <div className="model-detail" style={{padding:16,overflow:'auto'}}>
            {selectedSys ? (<>
              <div className="model-detail-name" style={{fontSize:15}}>{selectedSys.name}</div>
              <div className="model-detail-path">{selectedSys.domains} · {selectedSys.db} · {selectedSys.demand}条需求 · 就绪度 {selectedSys.readiness}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
                <div className="chart-card" style={{padding:10}}><div className="chart-title" style={{fontSize:10}}>基本信息</div>
                  <table className="data-table"><tbody>
                    <tr><td style={{fontWeight:600,fontSize:10}}>需求数</td><td>{selectedSys.demand} 条</td></tr>
                    <tr><td style={{fontWeight:600,fontSize:10}}>涉及部门</td><td style={{fontSize:10}}>{selectedSys.depts}</td></tr>
                    <tr><td style={{fontWeight:600,fontSize:10}}>业务域</td><td style={{fontSize:10}}>{selectedSys.domains}</td></tr>
                    <tr><td style={{fontWeight:600,fontSize:10}}>数据量</td><td>{selectedSys.vol_gb>0?`${selectedSys.vol_gb} GB`:'待评估'}</td></tr>
                    <tr><td style={{fontWeight:600,fontSize:10}}>消费场景</td><td style={{fontSize:10}}>{selectedSys.scenes}</td></tr>
                  </tbody></table>
                </div>
                <div className="chart-card" style={{padding:10}}><div className="chart-title" style={{fontSize:10}}>已确认表名</div>
                  {(selectedSys.tables||[]).length>0?<ul style={{fontSize:10,lineHeight:1.8,paddingLeft:16,color:'var(--text-secondary)'}}>{selectedSys.tables.map((t,j)=><li key={j} style={{fontFamily:"'SF Mono',monospace"}}>{t}</li>)}</ul>:<div style={{color:'var(--text-tertiary)',fontSize:10,padding:8}}>暂无确认表名</div>}
                </div>
              </div>
            </>) : (<div style={{textAlign:'center',color:'var(--text-tertiary)',padding:40}}>← 点击左侧系统查看详情</div>)}
          </div>
        </div>);
      case 1: // 元数据管理 - 字段浏览
        return (<div>
          <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}><S label="已确认表名系统" value={sysWithTables.length} unit="个" color="#007AFF"/><S label="确认表名" value={sysWithTables.reduce((a,s)=>a+(s.tables?.length||0),0)} unit="张" color="#34C759"/><S label="已标注字段" value="48" unit="列" color="#FF9500"/><S label="字段完整率" value="62" unit="%" color="#AF52DE"/></div>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10,marginTop:10}}>
            <div className="chart-card"><div className="chart-title" style={{fontSize:11,marginBottom:8}}>已确认表名的系统</div>
              {sysWithTables.map((s,i)=>(<div key={i} style={{padding:'6px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>setSelectedSys(s)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:500,fontSize:11}}>{s.name}</span>
                  <span style={{fontSize:9,color:'var(--text-tertiary)'}}>{s.db}</span>
                </div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}}>{(s.tables||[]).map((t,j)=><span key={j} style={{fontSize:9,background:'rgba(0,122,255,0.06)',color:'#007AFF',padding:'1px 6px',borderRadius:3,fontFamily:"'SF Mono',monospace"}}>{t}</span>)}</div>
              </div>))}
            </div>
            <div className="chart-card"><div className="chart-title" style={{fontSize:11,marginBottom:8}}>字段详情 {selectedSys&&`— ${selectedSys.name}`}</div>
              {selectedSys && FIELD_META[selectedSys.name] ? (<div style={{maxHeight:300,overflow:'auto'}}><table className="data-table"><thead><tr><th>字段名</th><th>类型</th><th>描述</th><th>质量</th></tr></thead><tbody>
                {FIELD_META[selectedSys.name].fields.map((f,j)=><tr key={j}><td style={{fontFamily:"'SF Mono',monospace",fontSize:10,fontWeight:500}}>{f.name}</td><td style={{fontSize:10,color:'var(--text-secondary)'}}>{f.type}</td><td style={{fontSize:10}}>{f.desc}</td><td style={{color:f.quality==='✓'?'#34C759':'#FF9500',fontSize:10}}>{f.quality}</td></tr>)}
              </tbody></table></div>) : (<div style={{color:'var(--text-tertiary)',fontSize:10,padding:20,textAlign:'center'}}>{selectedSys?'该系统的字段元数据待补充':'点击左侧系统查看字段详情'}</div>)}
            </div>
          </div>
        </div>);
      case 2: // 数据标准
        return (<div>
          <div className="sources-grid">
            <div className="chart-card"><div className="chart-title">命名标准与类型映射</div><table className="data-table"><thead><tr><th>标准项</th><th>规范</th><th>示例</th></tr></thead><tbody>
              <tr><td>表命名</td><td style={{fontFamily:"'SF Mono',monospace"}}>{'{layer}_{domain}_{short_name}'}</td><td>dwd_prod_bde_stop</td></tr>
              <tr><td>列命名</td><td>英文snake_case, ISO 11179, ≤30字符</td><td>event_time, shift_id</td></tr>
              <tr><td>主键</td><td>每表必有业务主键, ROW_NUMBER()去重</td><td>PK(bde_id, event_time)</td></tr>
              <tr><td>增量策略</td><td>使用 incremental_filter() 宏</td><td>{'{% if is_incremental() %}'}</td></tr>
              <tr><td>审计列</td><td>7 标准审计列必须 (audit_columns宏)</td><td>dbt_updated_at, dbt_created_at...</td></tr>
              <tr><td>编码</td><td>UTF-8 无BOM</td><td>-</td></tr>
            </tbody></table></div>
            <div className="chart-card"><div className="chart-title">8个标准化宏函数</div><table className="data-table"><thead><tr><th>宏</th><th>用途</th><th>示例</th></tr></thead><tbody>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>sap_date(col)</td><td>yyyyMMdd→DATE</td><td>{`{{ sap_date("a.erdat") }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>sap_string(col,def)</td><td>TRIM+COALESCE</td><td>{`{{ sap_string("a.name1","") }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>sap_flag(col)</td><td>'X'/''→'1'/'0'</td><td>{`{{ sap_flag("a.fksto") }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>sap_decimal(col)</td><td>NULL→0+CAST</td><td>{`{{ sap_decimal("a.netwr") }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>audit_columns()</td><td>7标准审计列</td><td>{`{{ audit_columns() }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>group_concat(expr)</td><td>跨方言GROUP_CONCAT</td><td>{`{{ group_concat("col") }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>incremental_filter()</td><td>增量加载WHERE</td><td>{`{{ incremental_filter() }}`}</td></tr>
              <tr><td style={{color:'#007AFF',fontFamily:"'SF Mono',monospace"}}>gen_schema_name()</td><td>自定义schema命名</td><td>自动应用</td></tr>
            </tbody></table></div>
          </div>
        </div>);
      case 3: // 质量中心
        return (<div>
          <div className="kpi-row" style={{gridTemplateColumns:'repeat(6,1fr)'}}><S label="完整性" value="98.5" unit="%" color="#007AFF" sub="415断言"/><S label="有效性" value="94.2" unit="%" color="#34C759"/><S label="及时性" value="82.5" unit="%" color="#FF9500" sub="3源延迟"/><S label="一致性" value="91.0" unit="%" color="#FF3B30" sub="1断裂"/><S label="准确性" value="96.8" unit="%" color="#5AC8FA"/><S label="唯一性" value="99.1" unit="%" color="#AF52DE" sub="2重复"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
            <div className="chart-card"><div className="chart-title">六维度质量雷达图</div>
              <ResponsiveContainer width="100%" height={260}><RadarChart data={qualityRadar}><PolarGrid stroke="rgba(0,0,0,0.1)"/><PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:'#86868B'}}/><PolarRadiusAxis domain={[70,100]} tick={{fontSize:8,fill:'#AEAEB2'}}/><Radar dataKey="value" stroke="#007AFF" fill="#007AFF" fillOpacity={0.2} strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
            <div className="chart-card"><div className="chart-title">质量趋势（近30天）</div>
              <ResponsiveContainer width="100%" height={260}><LineChart data={qualityTrend} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="day" tick={{fontSize:8,fill:'#AEAEB2'}} interval={5}/><YAxis domain={[75,100]} tick={{fontSize:9,fill:'#AEAEB2'}} width={24}/><Tooltip content={<Tp/>}/><Line type="monotone" dataKey="完整性" stroke="#007AFF" strokeWidth={1.5} dot={false}/><Line type="monotone" dataKey="有效性" stroke="#34C759" strokeWidth={1.5} dot={false}/><Line type="monotone" dataKey="及时性" stroke="#FF9500" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
          </div>
          <div className="table-wrapper" style={{marginTop:10}}><table className="data-table"><thead><tr><th>质量规则</th><th>检查范围</th><th>通过率</th><th>最近检查</th><th>状态</th></tr></thead><tbody>
            <tr><td>not_null 主键</td><td>68张ODS表</td><td>100%</td><td>07-05 06:05</td><td style={{color:'#34C759'}}>✓ 通过</td></tr>
            <tr><td>not_null 审计列</td><td>7列×68表</td><td>100%</td><td>07-05 06:05</td><td style={{color:'#34C759'}}>✓ 通过</td></tr>
            <tr><td>unique 主键</td><td>68张表</td><td>98.5%</td><td>07-05 06:08</td><td style={{color:'#FF9500'}}>⚠ 2项重复</td></tr>
            <tr><td>referential 外键</td><td>32项关联</td><td>96.9%</td><td>07-05 06:10</td><td style={{color:'#FF9500'}}>⚠ 1项断裂</td></tr>
            <tr><td>freshness 新鲜度</td><td>12数据源</td><td>75%</td><td>07-05 06:12</td><td style={{color:'#FF3B30'}}>✗ 3源过期</td></tr>
            <tr><td>accepted_values 枚举</td><td>shift_id等8列</td><td>100%</td><td>07-05 06:05</td><td style={{color:'#34C759'}}>✓ 通过</td></tr>
          </tbody></table></div>
        </div>);
      case 4: // 血缘追踪
        return (<div><div className="kpi-row" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:10}}><S label="ODS源表" value="68" unit="张" color="#007AFF"/><S label="DWD模型" value="60" unit="个" color="#34C759"/><S label="DWS中间表" value="8" unit="个" color="#FF9500"/><S label="DIM维度" value="1" unit="个" color="#AF52DE"/><S label="ADS视图" value="1" unit="个" color="#FF3B30"/></div>
        <div className="arch-diagram"><div className="chart-title" style={{marginBottom:12}}>5层数据血缘 DAG — 单击层节点查看详情</div><div className="arch-layers">
          {[{l:'ODS',c:'#007AFF',n:'68张源表',d:'dmp_ods · 只读 · DataX同步 · 含MRS/BDE/iPortal/AMS/HR等',tables:'MRS.Delivery_data_hour, BDE.OEE报表, iPortal.kpi_indicator, AMS.AFKO/AFRU...'},
            {l:'DWD',c:'#34C759',n:'60个清洗模型',d:'dmp_dw · 1:1清洗 · 7审计列 · 不含跨表JOIN',tables:'dwd_prod_bde_stop, dwd_prod_iportal_oee, dwd_prod_mrs_ftc...'},
            {l:'DWS',c:'#FF9500',n:'8个服务宽表',d:'dmp_dw · 多表JOIN · 业务逻辑 · 日/月粒度',tables:'dws_prod_oee_daily, dws_prod_quality_daily, dws_fi_invoice_base...'},
            {l:'ADS',c:'#FF3B30',n:'1个BI视图',d:'dmp_ads · BI就绪 · Hive+OceanBase双写',tables:'ads_prod_ops_dashboard · ads_fi_zsdr005'},{l:'BI消费',c:'#AF52DE',n:'FineReport',d:'4生产看板 · 各域总览 · 订阅推送',tables:'生产运营/质量绩效/设备效率/过程控制'}].map(layer=>(
            <div key={layer.l} className="arch-layer" style={{background:'rgba(0,0,0,0.02)',cursor:'pointer',flexDirection:'column',alignItems:'flex-start',gap:4,padding:12}} onClick={()=>setSelectedSys({name:layer.l,desc:layer.d,tables:[layer.tables],db:'',demand:0,readiness:'A'})}>
              <div style={{display:'flex',alignItems:'center',gap:12,width:'100%'}}><span className="arch-layer-tag" style={{background:layer.c}}>{layer.l}</span><span className="arch-layer-name" style={{fontWeight:600}}>{layer.n}</span><span style={{fontSize:10,color:'var(--text-tertiary)',marginLeft:'auto'}}>点击查看表清单</span></div>
              <span style={{fontSize:10,color:'var(--text-secondary)'}}>{layer.d}</span>
            </div>))}
        </div></div>
        {selectedSys?.name&&['ODS','DWD','DWS','ADS','BI消费'].includes(selectedSys.name)&&(<div className="chart-card" style={{marginTop:8}}><div className="chart-title">{selectedSys.name} 层表清单</div><div style={{fontSize:11,color:'var(--text-secondary)',fontFamily:"'SF Mono',monospace",padding:8}}>{selectedSys.tables?.[0]}</div></div>)}
        </div>);
      case 5: // 安全中心
        return (<div>
          <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}><S label="敏感表" value="12" unit="张" color="#FF3B30" sub="机密级"/><S label="脱敏字段" value="24" unit="列" color="#FF9500" sub="动态脱敏"/><S label="审计日志" value="1,250" unit="条/天" color="#007AFF"/><S label="合规评分" value="92" unit="分" color="#34C759" sub="ISO27001"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
            <div className="chart-card"><div className="chart-title">数据分类分级概览</div><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[{name:'公开',value:38},{name:'内部',value:18},{name:'机密',value:12}]} cx="50%" cy="50%" innerRadius={35} outerRadius={75} dataKey="value" stroke="none"><Cell fill="#34C759"/><Cell fill="#FF9500"/><Cell fill="#FF3B30"/></Pie><Tooltip content={<Tp/>}/></PieChart></ResponsiveContainer><div className="chart-legend-mini"><span><span className="legend-dot" style={{background:'#34C759'}}/>公开 38</span><span><span className="legend-dot" style={{background:'#FF9500'}}/>内部 18</span><span><span className="legend-dot" style={{background:'#FF3B30'}}/>机密 12</span></div></div>
            <div className="chart-card"><div className="chart-title">安全策略执行状态</div><table className="data-table"><thead><tr><th>策略</th><th>覆盖</th><th>生效</th><th>状态</th></tr></thead><tbody>
              <tr><td>数据分类分级</td><td>68系统</td><td>2026-06</td><td style={{color:'#34C759'}}>已部署</td></tr>
              <tr><td>动态脱敏</td><td>12张敏感表</td><td>2026-06</td><td style={{color:'#34C759'}}>已部署</td></tr>
              <tr><td>访问审计</td><td>全量查询</td><td>2026-05</td><td style={{color:'#FF9500'}}>部分覆盖</td></tr>
              <tr><td>数据水印</td><td>报表+API</td><td>-</td><td style={{color:'#8E8E93'}}>待部署</td></tr>
              <tr><td>隐私保护</td><td>HR/薪资数据</td><td>2026-06</td><td style={{color:'#34C759'}}>已部署</td></tr>
            </tbody></table></div>
          </div>
        </div>);
      case 6: // 生命周期
        return (<div>
          <div className="table-wrapper" style={{marginBottom:10}}><table className="data-table"><thead><tr><th>阶段</th><th>保留策略</th><th>适用数据</th><th>保留期</th><th>到期操作</th><th>当前数据量</th></tr></thead><tbody>
            <tr><td style={{color:'#007AFF',fontWeight:600}}>热数据</td><td>SSD高速存储</td><td>当日生产(MRS/BDE)</td><td>7天</td><td>自动归档</td><td>~50 GB/天</td></tr>
            <tr><td style={{color:'#34C759',fontWeight:600}}>温数据</td><td>HDD常规存储</td><td>月度报表/质量趋势</td><td>12个月</td><td>自动迁移</td><td>~800 GB</td></tr>
            <tr><td style={{color:'#FF9500',fontWeight:600}}>冷数据</td><td>对象存储压缩</td><td>历史产量/审计日志</td><td>3年</td><td>自动归档</td><td>~12 TB</td></tr>
            <tr><td style={{color:'#8E8E93',fontWeight:600}}>归档</td><td>对象存储(深度归档)</td><td>3年前生产记录</td><td>永久</td><td>只读查询</td><td>~4 TB</td></tr>
            <tr><td style={{color:'#FF3B30',fontWeight:600}}>销毁</td><td>物理删除</td><td>手工填报/Excel</td><td>1年</td><td>不可恢复</td><td>~50 GB</td></tr>
          </tbody></table></div>
          <div className="chart-card"><div className="chart-title">各阶段数据量占比</div><ResponsiveContainer width="100%" height={180}><BarChart data={[{name:'热',value:50},{name:'温',value:800},{name:'冷',value:12000},{name:'归档',value:4000},{name:'销毁',value:50}]} margin={{top:5,right:10,left:-10,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis dataKey="name" tick={{fontSize:10,fill:'#AEAEB2'}}/><YAxis tick={{fontSize:9,fill:'#AEAEB2'}} width={30}/><Tooltip content={<Tp/>}/><Bar dataKey="value" name="GB" maxBarSize={40} radius={[4,4,0,0]}>{[{v:'#007AFF'},{v:'#34C759'},{v:'#FF9500'},{v:'#8E8E93'},{v:'#FF3B30'}].map((c,i)=><Cell key={i} fill={c.v}/>)}</Bar></BarChart></ResponsiveContainer></div>
        </div>);
      case 7: // 治理评估
        const scores=[{d:'生产制造',s:72,c:'#007AFF',a:8,t:20},{d:'质量管理',s:58,c:'#34C759',a:4,t:16},{d:'安全消防',s:45,c:'#FF9500',a:3,t:12},{d:'人力资源',s:82,c:'#AF52DE',a:2,t:6},{d:'财务成本',s:51,c:'#FF3B30',a:3,t:11},{d:'技术支持',s:44,c:'#5AC8FA',a:2,t:6},{d:'生产计划',s:65,c:'#FF6B35',a:2,t:6},{d:'研发工艺',s:25,c:'#8E8E93',a:0,t:4},{d:'物流',s:30,c:'#FB923C',a:1,t:4}];
        return (<div>
          <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}><S label="总体健康分" value="68" unit="/100" color="#007AFF" sub="+5 较上月"/><S label="A档系统占比" value="29" unit="%" color="#34C759" sub={`${ready.A||0}个`}/><S label="治理覆盖率" value="35" unit="%" color="#FF9500"/><S label="TOP3域" value="人力/生产/计划" unit="" color="#AF52DE"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
            <div className="chart-card"><div className="chart-title">业务域治理健康分排名</div><ResponsiveContainer width="100%" height={260}><BarChart data={scores} layout="vertical" margin={{top:5,right:30,left:55,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/><XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:'#AEAEB2'}}/><YAxis type="category" dataKey="d" tick={{fontSize:9,fill:'#AEAEB2'}} width={50}/><Tooltip content={<Tp/>}/><Bar dataKey="s" name="健康分" maxBarSize={16} radius={[0,3,3,0]} label={{position:'right',fontSize:9,fill:'#86868B',formatter:v=>`${v}分`}}>{scores.map((_,i)=><Cell key={i} fill={scores[i].c}/>)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="chart-card"><div className="chart-title">治理排行榜</div><table className="data-table"><thead><tr><th>#</th><th>域</th><th>健康分</th><th>A档系统</th><th>总系统</th><th>评级</th></tr></thead><tbody>
              {[...scores].sort((a,b)=>b.s-a.s).map((x,i)=><tr key={i}><td style={{fontWeight:700,color:i<3?'#FF9500':'var(--text-secondary)'}}>{i+1}</td><td style={{fontWeight:600}}>{x.d}</td><td style={{color:x.c,fontWeight:600}}>{x.s}</td><td>{x.a}</td><td>{x.t}</td><td style={{color:x.s>=70?'#34C759':x.s>=50?'#FF9500':'#FF3B30'}}>{x.s>=70?'★ 优秀':x.s>=50?'◆ 良好':'△ 待改进'}</td></tr>)}
            </tbody></table></div>
          </div>
        </div>);
      default: return null;
    }
  };

  return (<div className="monitor-layout">
    <h1 className="page-title">数据治理</h1>
    <div className="models-tabs">{TABS.map((t,i)=><button key={i} className={`models-tab${tab===i?' active':''}`} onClick={()=>{setTab(i);setSelectedSys(null)}}>{t}</button>)}</div>
    {renderTab()}
  </div>);
}
