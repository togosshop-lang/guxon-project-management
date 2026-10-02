'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type Props={projectId:number;projectName:string;model?:string|null}

const SECTIONS: Array<{title:string;fields:Array<readonly [string,string]>}>=[
 {title:'一、基本資料',fields:[['product_name','產品名稱'],['model','型號／貨號'],['category_series','分類／系列'],['owner','負責人'],['record_date','建檔日期'],['current_status','目前狀態']]},
 {title:'二、規格明細',fields:[['product_dimensions','產品尺寸（長×寬×高，cm）'],['package_dimensions','包裝尺寸'],['net_gross_weight','淨重／毛重'],['material','材質'],['color_options','顏色／款式選項'],['capacity_parameters','容量／規格參數'],['packaging_method','包裝方式'],['accessories','配件內容物'],['power_battery','電源／電池規格（如適用）'],['carton_info','裝箱尺寸／裝箱數量／裝箱實重'],['warranty','保固']]},
 {title:'四、注意事項／其他備註',fields:[['warnings','使用注意事項／警語'],['notes','備註']]},
]
const INTERNAL=[['target_audience','目標客群'],['use_scenarios','核心使用情境'],['competitors','主要競品'],['competitor_price','競品價格帶'],['retail_price','預計售價'],['cost','成本'],['margin','毛利'],['positioning','核心差異化'],['launch_direction','上市主打方向'],['market_notes','市場觀察'],['supplier','供應商／採購資訊']] as const
type Row={id:string;[key:string]:string}
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36)
const arr=(v:any,defaults:number)=>Array.isArray(v)&&v.length?v:Array.from({length:defaults},()=>({id:uid()}))

export default function ProductDataPanel({projectId,projectName,model}:Props){
 const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[completed,setCompleted]=useState(false)
 const [spec,setSpec]=useState<Record<string,any>>({}),[internal,setInternal]=useState<Record<string,string>>({})
 useEffect(()=>{(async()=>{const {data}=await supabase.from('product_data_sheets').select('*').eq('project_id',projectId).maybeSingle();if(data){setSpec(data.public_specs||{});setInternal(data.internal_analysis||{});setCompleted(!!data.completed)}else setSpec({product_name:projectName,model:model||''})})()},[projectId])
 const features=arr(spec.features_list,5),faqs=arr(spec.faqs,5),barcodes=arr(spec.barcodes,4)
 const scalarFields: Array<readonly [string,string]>=SECTIONS.flatMap(section=>section.fields)
 const filled=scalarFields.filter(([k])=>String(spec[k]||'').trim().length>0).length+(features.some((x:any)=>x.description)?1:0)+(faqs.some((x:any)=>x.question||x.answer)?1:0)+(barcodes.some((x:any)=>x.variant||x.barcode)?1:0)
 const total=scalarFields.length+3,progress=Math.round(filled/total*100)
 function setList(key:string,list:Row[]){setSpec(s=>({...s,[key]:list}))}
 async function save(forceCompleted=completed){
   setSaving(true);const now=new Date().toISOString()
   const normalized={...spec,features_list:features,faqs,barcodes,product_name:spec.product_name||projectName,model:spec.model||model||''}
   const {error}=await supabase.from('product_data_sheets').upsert({project_id:projectId,public_specs:normalized,internal_analysis:internal,completed:forceCompleted,completed_at:forceCompleted?now:null,updated_at:now},{onConflict:'project_id'})
   setSaving(false);if(error)return alert('儲存失敗：'+error.message);setSpec(normalized);setCompleted(forceCompleted);alert(forceCompleted?'產品資料表已標記完成。':'產品資料表已儲存。')
 }
 function buildPublicRows(){
   const esc=(v:any)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
   let rows='<tr><th colspan="3">規格紀錄表</th></tr>'
   for(const section of SECTIONS){rows+=`<tr><th colspan="3">${esc(section.title)}</th></tr>`;for(const [k,l] of section.fields)rows+=`<tr><td>${esc(l)}</td><td colspan="2">${esc(spec[k])}</td></tr>`;if(section.title.startsWith('二、')){rows+='<tr><th colspan="3">三、特色重點說明</th></tr><tr><th>編號</th><th colspan="2">特色重點說明</th></tr>'+features.map((x:any,i:number)=>`<tr><td>${i+1}</td><td colspan="2">${esc(x.description)}</td></tr>`).join('')}}
   rows+='<tr><th colspan="3">五、常見問題（FAQ）</th></tr><tr><th>編號</th><th>問題</th><th>回答</th></tr>'+faqs.map((x:any,i:number)=>`<tr><td>${i+1}</td><td>${esc(x.question)}</td><td>${esc(x.answer)}</td></tr>`).join('')
   rows+='<tr><th colspan="3">六、國際條碼</th></tr><tr><th>編號</th><th>規格/顏色</th><th>國際條碼</th></tr>'+barcodes.map((x:any,i:number)=>`<tr><td>${i+1}</td><td>${esc(x.variant)}</td><td>${esc(x.barcode)}</td></tr>`).join('')
   return {rows,esc}
 }
 function downloadExcel(rows:string,fileName:string){
   const html=`<html><head><meta charset="utf-8"></head><body><table border="1">${rows}</table></body></html>`
   const url=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url)
 }
 function exportExcel(){
   const {rows}=buildPublicRows()
   downloadExcel(rows,`${projectName}_客服規格表.xls`)
 }
 function exportFullExcel(){
   const {rows:publicRows,esc}=buildPublicRows()
   let rows=publicRows+'<tr><th colspan="3">內部分析資料（機密）</th></tr>'
   for(const [k,l] of INTERNAL) rows+=`<tr><td>${esc(l)}</td><td colspan="2">${esc(internal[k])}</td></tr>`
   downloadExcel(rows,`${projectName}_完整產品資料表_內部分析.xls`)
 }
 const listEditor=(key:string,list:any[],cols:[string,string][]) => <div className="product-list"><div className="product-list-head">{cols.map(c=><b key={c[0]}>{c[1]}</b>)}</div>{list.map((row,i)=><div className="product-list-row" key={row.id||i}>{cols.map(([k])=><textarea key={k} value={row[k]||''} onChange={e=>{const next=list.map((x,j)=>j===i?{...x,[k]:e.target.value}:x);setList(key,next)}}/>)}<button className="text-danger" onClick={()=>setList(key,list.filter((_,j)=>j!==i))}>刪除</button></div>)}<button className="btn" onClick={()=>setList(key,[...list,{id:uid()}])}>＋ 新增一列</button></div>
 return <section className="product-data-panel">
   <button className="product-data-head" onClick={()=>setOpen(v=>!v)}><div><small>PRODUCT DATA</small><b>產品資料表</b><span>依公司規格紀錄表集中維護，AI 策略直接引用</span></div><div className="product-data-status"><strong>{completed?'✓ 已完成':`${progress}%`}</strong><span>{open?'收合':'展開'}</span></div></button>
   {open&&<div className="product-data-body">
     <div className="product-progress"><i style={{width:`${progress}%`}}/><span>資料完成度 {progress}%</span></div>
     {SECTIONS.map(section=><div className="product-data-section" key={section.title}><h3>{section.title}</h3><div className="product-data-grid">{section.fields.map(([k,l])=><label key={k}><b>{l}</b><textarea value={spec[k]||''} onChange={e=>setSpec(s=>({...s,[k]:e.target.value}))}/></label>)}</div>{section.title.startsWith('二、')&&<><h3>三、特色重點說明</h3>{listEditor('features_list',features,[['description','特色重點說明']])}</>}</div>)}
     <div className="product-data-section"><h3>五、常見問題（FAQ）</h3>{listEditor('faqs',faqs,[['question','問題'],['answer','回答']])}</div>
     <div className="product-data-section"><h3>六、國際條碼</h3>{listEditor('barcodes',barcodes,[['variant','規格／顏色'],['barcode','國際條碼']])}</div>
     <div className="product-data-section internal"><h3>內部分析資料 🔒 <small>不匯出至客服規格表</small></h3><div className="product-data-grid">{INTERNAL.map(([k,l])=><label key={k}><b>{l}</b><textarea value={internal[k]||''} onChange={e=>setInternal(s=>({...s,[k]:e.target.value}))}/></label>)}</div></div>
     <div className="product-data-actions"><label><input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)}/> 產品資料表已完成</label><div><button className="btn" onClick={exportExcel}>匯出客服規格表 Excel</button><button className="btn" onClick={exportFullExcel}>匯出完整產品資料表 Excel</button><button className="btn-primary" disabled={saving} onClick={()=>save()}>{saving?'儲存中…':'儲存產品資料表'}</button></div></div>
   </div>}
 </section>
}
