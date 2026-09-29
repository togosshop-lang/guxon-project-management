import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type StrategyRequest = {
  project?: { name?: string; version?: string | null; launch_date?: string | null; retail_price?: number | null; group_price?: number | null; success_goal?: string | null }
  section?: { name?: string; description?: string | null; section_key?: string | null }
  item?: { title?: string; content?: string | null; source_note?: string | null }
  relatedItems?: Array<{ title?: string; content?: string | null; source_status?: string }>
  context?: Record<string, string | null | undefined>
  confirmationStatus?: Record<string, boolean>
}
function outputText(data:any){if(typeof data?.output_text==='string')return data.output_text.trim();return(data?.output||[]).flatMap((o:any)=>o?.content||[]).map((c:any)=>c?.text).filter(Boolean).join('\n').trim()}
const labels:Record<string,string>={product_basics:'產品基本資料',specs_features:'規格與功能',cost_pricing:'成本與售價',target_audience:'目標客群',sales_channels:'銷售通路',competitors:'已知競品',supplier_testing:'供應商／測試資料',background_notes:'其他背景資料'}
const sectionNeeds:Record<string,string[]>={
  market:['product_basics','specs_features','target_audience','sales_channels','competitors','background_notes'],
  positioning:['product_basics','specs_features','target_audience','competitors','background_notes'],
  'selling-points':['product_basics','specs_features','target_audience','competitors','supplier_testing','background_notes'],
  commercial:['product_basics','cost_pricing','target_audience','sales_channels','competitors','background_notes'],
  'launch-marketing':['product_basics','specs_features','target_audience','sales_channels','competitors','supplier_testing','background_notes'],
  'launch-decision':['product_basics','specs_features','cost_pricing','target_audience','sales_channels','competitors','supplier_testing','background_notes'],
}
export async function POST(request:Request){
  const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return NextResponse.json({error:'AI 尚未設定：缺少 OPENAI_API_KEY。'},{status:503})
  let body:StrategyRequest;try{body=await request.json()}catch{return NextResponse.json({error:'請求格式錯誤。'},{status:400})}
  const project=body.project||{},section=body.section||{},item=body.item||{};if(!project.name||!item.title)return NextResponse.json({error:'缺少專案或策略項目資料。'},{status:400})
  const context=body.context||{},confirmed=body.confirmationStatus||{};const wanted=sectionNeeds[section.section_key||'']||Object.keys(labels)
  const contextText=wanted.map(key=>`【${labels[key]}｜${confirmed[key]?'已確認':'待確認'}】\n${context[key]?.trim()||'尚未提供'}`).join('\n\n')
  const related=(body.relatedItems||[]).filter(x=>x.content).slice(0,12).map(x=>`- ${x.title}: ${x.content}（${x.source_status||'未標示'}）`).join('\n')
  const prompt=`你是 GUXON 內部新品策略協作 AI。請用台灣繁體中文，協助團隊完成策略欄位。\n\n規則：\n1. 不得把未知資訊寫成事實；缺資料時明確標示「待確認」。\n2. 規格、價格、日期、供應商數據與宣稱若沒有提供，不得自行捏造。\n3. 「已確認」資料可作為內部事實使用；「待確認」資料只能當暫定資訊，不得寫成已核准事實。\n4. 優先使用下方「AI 策略資料中心」內容，不要要求使用者重複提供已存在的資料。\n5. 輸出使用純文字與清楚的段落／編號，不要輸出 Markdown 星號（例如 **粗體**）。\n6. 先給結論，再給策略建議、依據、資料來源／建議補充與待確認事項。\n7. 內容精簡但具體，避免空泛行銷話術。這是內部策略建議，不代表已核准。\n\n專案：${project.name}\n型號：${project.version||'待確認'}\n預計上市日：${project.launch_date||'待確認'}\n正式售價：${project.retail_price??'待確認'}\n團購／活動價：${project.group_price??'待確認'}\n成功定義：${project.success_goal||'待確認'}\n\nAI 策略資料中心：\n${contextText}\n\n策略區塊：${section.name||'未分類'}\n區塊說明：${section.description||''}\n目前項目：${item.title}\n現有內容：${item.content||'尚無內容'}\n資料來源／待確認：${item.source_note||'尚未填寫'}\n\n已經有內容的其他策略欄位：\n${related||'尚無其他內容'}\n\n請針對「${item.title}」提出可直接採用的策略草稿。最後加一行「待確認：」列出仍需人工或供應商確認的資訊；若沒有就寫「待確認：無」。`
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model:process.env.OPENAI_STRATEGY_MODEL||'gpt-5.6-luna',input:prompt,reasoning:{effort:'low'},max_output_tokens:1400})})
  const data=await response.json().catch(()=>null);if(!response.ok)return NextResponse.json({error:data?.error?.message||'AI 服務暫時無法使用。'},{status:response.status})
  const text=outputText(data);if(!text)return NextResponse.json({error:'AI 沒有回傳內容。'},{status:502});return NextResponse.json({text,model:process.env.OPENAI_STRATEGY_MODEL||'gpt-5.6-luna'})
}
