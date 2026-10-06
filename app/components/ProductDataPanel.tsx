'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import * as XLSX from 'xlsx'

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
 function publicRows(){
   const rows:(string|number)[][]=[['規格紀錄表','','']]
   for(const section of SECTIONS){
     rows.push([section.title,'',''])
     for(const [k,l] of section.fields) rows.push([l,String(spec[k]??''),''])
     if(section.title.startsWith('二、')){
       rows.push(['三、特色重點說明','',''],['編號','特色重點說明',''])
       features.forEach((x:any,i:number)=>rows.push([i+1,String(x.description??''),'']))
     }
   }
   rows.push(['五、常見問題（FAQ）','',''],['編號','問題','回答'])
   faqs.forEach((x:any,i:number)=>rows.push([i+1,String(x.question??''),String(x.answer??'')]))
   rows.push(['六、國際條碼','',''],['編號','規格／顏色','國際條碼'])
   barcodes.forEach((x:any,i:number)=>rows.push([i+1,String(x.variant??''),String(x.barcode??'')]))
   return rows
 }
 function downloadXlsx(rows:(string|number)[][],fileName:string){
   const ws=XLSX.utils.aoa_to_sheet(rows)
   ws['!cols']=[{wch:28},{wch:48},{wch:48}]
   const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'產品資料表')
   XLSX.writeFile(wb,fileName)
 }
 function exportExcel(){downloadXlsx(publicRows(),`${projectName}_客服規格表.xlsx`)}
 function exportFullExcel(){
   const rows=publicRows()
   rows.push(['內部分析資料（機密）','',''])
   for(const [k,l] of INTERNAL) rows.push([l,String(internal[k]??''),''])
   downloadXlsx(rows,`${projectName}_完整產品資料表_內部分析.xlsx`)
 }
 async function importExcel(file:File){
   try{
     const data=await file.arrayBuffer(),wb=XLSX.read(data,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]]
     const rows=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,defval:''})
     const nextSpec={...spec},nextInternal={...internal},nextFeatures:Row[]=[],nextFaqs:Row[]=[],nextBarcodes:Row[]=[]
     const scalarMap=new Map<string,string>();SECTIONS.forEach(section=>section.fields.forEach(([k,l])=>scalarMap.set(l,k)))
     const internalMap=new Map<string,string>();INTERNAL.forEach(([k,l])=>internalMap.set(l,k))
     let mode=''
     for(const raw of rows){
       const a=String(raw[0]??'').trim(),b=String(raw[1]??''),c=String(raw[2]??'')
       if(a==='三、特色重點說明'){mode='features';continue}
       if(a==='五、常見問題（FAQ）'){mode='faq';continue}
       if(a==='六、國際條碼'){mode='barcode';continue}
       if(a==='內部分析資料（機密）'){mode='internal';continue}
       if(a.startsWith('一、')||a.startsWith('二、')||a.startsWith('四、')){mode='scalar';continue}
       const key=scalarMap.get(a);if(key){nextSpec[key]=b;continue}
       const ik=internalMap.get(a);if(ik){nextInternal[ik]=b;continue}
       if(a==='編號')continue
       if(/^\d+$/.test(a)){
         if(mode==='features')nextFeatures.push({id:uid(),description:b})
         else if(mode==='faq')nextFaqs.push({id:uid(),question:b,answer:c})
         else if(mode==='barcode')nextBarcodes.push({id:uid(),variant:b,barcode:c})
       }
     }
     if(nextFeatures.length)nextSpec.features_list=nextFeatures
     if(nextFaqs.length)nextSpec.faqs=nextFaqs
     if(nextBarcodes.length)nextSpec.barcodes=nextBarcodes
     setSpec(nextSpec);setInternal(nextInternal)
     alert('Excel 已匯入表單。請先檢查內容，確認後再按「儲存產品資料表」。')
   }catch(err:any){alert('Excel 匯入失敗：'+(err?.message||'無法解析檔案'))}
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
     <div className="product-data-actions"><label><input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)}/> 產品資料表已完成</label><div><label className="btn" style={{cursor:'pointer'}}>匯入產品資料 Excel<input type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={e=>{const file=e.target.files?.[0];if(file)importExcel(file);e.currentTarget.value=''}}/></label><button className="btn" onClick={exportExcel}>匯出客服規格表 Excel</button><button className="btn" onClick={exportFullExcel}>匯出完整產品資料表 Excel</button><button className="btn-primary" disabled={saving} onClick={()=>save()}>{saving?'儲存中…':'儲存產品資料表'}</button></div></div>
   </div>}
 </section>
}
