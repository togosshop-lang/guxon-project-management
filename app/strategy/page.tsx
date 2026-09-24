'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'
import type { Project } from '@/src/lib/types'

export default function StrategyIndexPage(){
  const router=useRouter()
  const [projects,setProjects]=useState<Project[]>([])
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')

  useEffect(()=>{(async()=>{
    const {data,error}=await supabase.from('projects').select('*').order('id',{ascending:false})
    if(error) alert('讀取專案失敗：'+error.message)
    else setProjects(((data||[]) as Project[]).filter(p=>(p.project_kind||'brand')==='brand'))
    setLoading(false)
  })()},[])

  const visible=projects.filter(p=>`${p.name} ${p.version||''}`.toLowerCase().includes(query.trim().toLowerCase()))
  return <main style={{minHeight:'100vh',background:'#f5f6f8',padding:'28px 18px',fontFamily:'Arial, sans-serif',color:'#111827'}}><div style={{maxWidth:1100,margin:'0 auto'}}>
    <button onClick={()=>router.push('/')} style={{border:0,background:'transparent',padding:0,cursor:'pointer',color:'#324BAA',fontWeight:700}}>← 返回新品管理平台</button>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:16,margin:'18px 0'}}><div><h1 style={{margin:'0 0 6px'}}>AI 新品策略</h1><p style={{margin:0,color:'#6b7280'}}>選擇一個品牌新品，進入 AI 策略共同工作區。策略與新品執行可平行進行。</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋新品／型號…" style={{width:260,padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:10}}/></div>
    {loading?<div style={{background:'#fff',padding:24,borderRadius:14}}>載入專案…</div>:<div style={{display:'grid',gap:12}}>{visible.map(p=><button key={p.id} onClick={()=>router.push(`/strategy/${p.id}`)} style={{width:'100%',textAlign:'left',background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:'16px 18px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}><div><b style={{fontSize:17}}>{p.name}</b><div style={{color:'#6b7280',marginTop:5}}>{p.version||'未設定型號'} ・ 上市日 {p.launch_date||'未設定'}</div></div><div style={{display:'flex',gap:10,alignItems:'center'}}><span style={{padding:'5px 9px',borderRadius:999,background:'#f3f4f6',fontSize:13}}>{p.status||'未設定'}</span><b style={{color:'#324BAA'}}>進入策略 →</b></div></button>)}{!visible.length&&<div style={{background:'#fff',padding:24,borderRadius:14,color:'#6b7280'}}>目前沒有符合條件的品牌新品。</div>}</div>}
  </div></main>
}
