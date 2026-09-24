'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'
import { STRATEGY_SECTION_STATUS, STRATEGY_SOURCE_STATUS, STRATEGY_WORKSPACE_TEMPLATE } from '@/src/lib/strategy-workspace'
import type { Project, StrategyItem, StrategySection } from '@/src/lib/types'

export default function StrategyWorkspacePage(){
  const params=useParams<{projectId:string}>(); const router=useRouter(); const projectId=Number(params.projectId)
  const [project,setProject]=useState<Project|null>(null); const [sections,setSections]=useState<StrategySection[]>([]); const [items,setItems]=useState<StrategyItem[]>([])
  const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [open,setOpen]=useState<Record<number,boolean>>({})

  async function load(){
    setLoading(true)
    const [p,s,i]=await Promise.all([
      supabase.from('projects').select('*').eq('id',projectId).maybeSingle(),
      supabase.from('strategy_sections').select('*').eq('project_id',projectId).order('sort_order'),
      supabase.from('strategy_items').select('*').eq('project_id',projectId).order('sort_order'),
    ])
    if(p.error) alert('讀取專案失敗：'+p.error.message); else setProject(p.data as Project|null)
    if(s.error) alert('讀取策略區塊失敗：'+s.error.message); else setSections((s.data||[]) as StrategySection[])
    if(i.error) alert('讀取策略項目失敗：'+i.error.message); else setItems((i.data||[]) as StrategyItem[])
    setLoading(false)
  }
  useEffect(()=>{if(Number.isFinite(projectId)) load()},[projectId])

  async function createWorkspace(){
    if(!project||creating) return; setCreating(true)
    const sectionRows=STRATEGY_WORKSPACE_TEMPLATE.map((s,index)=>({project_id:project.id,section_key:s.key,name:s.name,description:s.description,sort_order:index+1,status:'未開始'}))
    const {data:created,error}=await supabase.from('strategy_sections').insert(sectionRows).select('*')
    if(error){setCreating(false);return alert('建立策略工作區失敗：'+error.message)}
    const rows=(created||[]).flatMap((section:any)=>{
      const template=STRATEGY_WORKSPACE_TEMPLATE.find(x=>x.key===section.section_key)
      return (template?.items||[]).map((title,index)=>({project_id:project.id,section_id:section.id,item_key:`${section.section_key}-${index+1}`,title,content:null,source_status:'缺少資料',source_note:null,assignee_id:null,sort_order:index+1}))
    })
    const result=await supabase.from('strategy_items').insert(rows)
    setCreating(false); if(result.error)return alert('建立策略項目失敗：'+result.error.message); await load()
  }
  async function updateSection(id:number,patch:Partial<StrategySection>){
    const {error}=await supabase.from('strategy_sections').update({...patch,updated_at:new Date().toISOString()}).eq('id',id); if(error)return alert('更新失敗：'+error.message)
    setSections(c=>c.map(x=>x.id===id?{...x,...patch}:x))
  }
  async function updateItem(id:number,patch:Partial<StrategyItem>){
    const {error}=await supabase.from('strategy_items').update({...patch,updated_at:new Date().toISOString()}).eq('id',id); if(error)return alert('更新失敗：'+error.message)
    setItems(c=>c.map(x=>x.id===id?{...x,...patch}:x))
  }
  const confirmed=items.filter(x=>x.source_status==='已確認').length; const progress=items.length?Math.round(confirmed/items.length*100):0
  const needsAttention=items.filter(x=>x.source_status==='缺少資料'||x.source_status==='待確認').length
  const grouped=useMemo(()=>sections.map(s=>({section:s,items:items.filter(i=>i.section_id===s.id)})),[sections,items])

  if(loading)return <main style={styles.page}><div style={styles.shell}>載入策略工作區…</div></main>
  if(!project)return <main style={styles.page}><div style={styles.shell}>找不到專案。<button onClick={()=>router.push('/')}>返回</button></div></main>
  return <main style={styles.page}><div style={styles.shell}>
    <div style={styles.top}><div><button style={styles.back} onClick={()=>router.push('/')}>← 返回新品管理平台</button><h1 style={{margin:'14px 0 4px'}}>AI 新品策略｜{project.name}</h1><p style={styles.muted}>策略決策與新品執行平行進行；這裡不會把每個策略項目變成員工任務。</p></div><span style={styles.badge}>{project.status||'未設定'}</span></div>
    {!sections.length?<section style={styles.empty}><h2>建立新版策略工作區</h2><p>建立後會產生 6 大策略區塊。既有策略任務與新品執行資料都不會被刪除。</p><button style={styles.primary} disabled={creating} onClick={createWorkspace}>{creating?'建立中…':'建立 6 大策略區塊'}</button></section>:<>
      <section style={styles.summary}><div><small style={styles.muted}>策略完成度</small><strong style={styles.big}>{progress}%</strong></div><div><small style={styles.muted}>已確認</small><strong style={styles.big}>{confirmed}/{items.length}</strong></div><div><small style={styles.muted}>需要處理</small><strong style={styles.big}>{needsAttention}</strong></div><div style={{flex:1,minWidth:220}}><small style={styles.muted}>整體進度</small><div style={styles.bar}><i style={{...styles.fill,width:`${progress}%`}}/></div></div></section>
      <div style={styles.notice}><b>AI 協作規則</b><span>「AI 建議」代表尚未人工確認；「待確認」代表需要供應商、規格或內部決策佐證；只有「已確認」才作為正式策略依據。</span></div>
      <div style={{display:'grid',gap:14}}>{grouped.map(({section,items:sectionItems},index)=>{
        const sectionConfirmed=sectionItems.filter(x=>x.source_status==='已確認').length; const isOpen=open[section.id]??true
        return <section key={section.id} style={styles.card}>
          <button style={styles.sectionHead} onClick={()=>setOpen(c=>({...c,[section.id]:!isOpen}))}><div style={{textAlign:'left'}}><small style={styles.muted}>STRATEGY {index+1}</small><h2 style={{margin:'3px 0'}}>{section.name}</h2><p style={{...styles.muted,margin:0}}>{section.description}</p></div><div style={{display:'flex',gap:10,alignItems:'center'}}><span style={styles.count}>{sectionConfirmed}/{sectionItems.length}</span><span>{isOpen?'收起':'展開'}</span></div></button>
          {isOpen&&<div style={{padding:'0 18px 18px'}}><div style={styles.sectionStatus}><span>區塊狀態</span><select value={section.status} onChange={e=>updateSection(section.id,{status:e.target.value as StrategySection['status']})}>{STRATEGY_SECTION_STATUS.map(x=><option key={x}>{x}</option>)}</select></div>
            <div style={{display:'grid',gap:10}}>{sectionItems.map(item=><article key={item.id} style={styles.item}>
              <div style={styles.itemTop}><b>{item.title}</b><select value={item.source_status} onChange={e=>updateItem(item.id,{source_status:e.target.value as StrategyItem['source_status']})}>{STRATEGY_SOURCE_STATUS.map(x=><option key={x}>{x}</option>)}</select></div>
              <textarea style={styles.textarea} value={item.content||''} placeholder="輸入目前策略內容；之後 AI 會在這裡協助分析、補充與改寫。" onChange={e=>setItems(c=>c.map(x=>x.id===item.id?{...x,content:e.target.value}:x))} onBlur={e=>updateItem(item.id,{content:e.target.value||null})}/>
              <input style={styles.input} value={item.source_note||''} placeholder="資料來源／待確認事項（例：承重數據待供應商報告）" onChange={e=>setItems(c=>c.map(x=>x.id===item.id?{...x,source_note:e.target.value}:x))} onBlur={e=>updateItem(item.id,{source_note:e.target.value||null})}/>
            </article>)}</div>
          </div>}
        </section>})}</div>
    </>}
  </div></main>
}

const styles:any={page:{minHeight:'100vh',background:'#f5f6f8',padding:'28px 18px',fontFamily:'Arial, sans-serif',color:'#111827'},shell:{maxWidth:1180,margin:'0 auto'},top:{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start',marginBottom:18},back:{border:0,background:'transparent',padding:0,cursor:'pointer',color:'#324BAA',fontWeight:700},muted:{color:'#6b7280'},badge:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:999,padding:'8px 12px',fontSize:13},empty:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:28},primary:{border:0,borderRadius:10,padding:'11px 16px',background:'#324BAA',color:'#fff',fontWeight:700,cursor:'pointer'},summary:{display:'flex',gap:18,alignItems:'center',background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:'16px 20px',marginBottom:12,flexWrap:'wrap'},big:{display:'block',fontSize:24,marginTop:4},bar:{height:9,background:'#e5e7eb',borderRadius:99,overflow:'hidden',marginTop:10},fill:{display:'block',height:'100%',background:'#324BAA',borderRadius:99},notice:{display:'flex',gap:12,background:'#fff7ed',border:'1px solid #fed7aa',padding:'12px 16px',borderRadius:12,marginBottom:14,fontSize:14},card:{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden'},sectionHead:{width:'100%',display:'flex',justifyContent:'space-between',gap:20,alignItems:'center',padding:'18px',border:0,background:'#fff',cursor:'pointer'},count:{background:'#eef2ff',color:'#324BAA',borderRadius:999,padding:'6px 10px',fontWeight:700},sectionStatus:{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:8,padding:'12px 0',borderTop:'1px solid #f0f1f3'},item:{border:'1px solid #e5e7eb',borderRadius:12,padding:14},itemTop:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:10},textarea:{width:'100%',minHeight:100,boxSizing:'border-box',border:'1px solid #d1d5db',borderRadius:9,padding:10,resize:'vertical',font:'inherit'},input:{width:'100%',boxSizing:'border-box',border:'1px solid #d1d5db',borderRadius:9,padding:10,marginTop:8,font:'inherit'}}
