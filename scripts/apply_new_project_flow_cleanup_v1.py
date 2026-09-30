from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()
start=s.index("    if(newProject.strategy_mode!=='none') {")
end=s.index("    setShowNewProject(false)", start)
s=s[:start]+"    // 品牌新品的策略改由 AI 策略決策工作區管理，不再建立舊版策略任務。\n"+s[end:]
old="""    const strategyLabel = newProject.strategy_mode==='full'\n      ? '完整策略 6 階段／41 項工作'\n      : newProject.strategy_mode==='simple'\n        ? '簡易策略 4 階段／10 項工作'\n        : '不建立策略工作'\n    alert(`專案建立完成：${strategyLabel}；新品執行管理 9 大工作區／${EXECUTION_TASK_COUNT} 項工作。`)"""
new="""    alert(`專案建立完成：產品資料表＋AI 策略決策工作區；新品執行管理 9 大工作區／${EXECUTION_TASK_COUNT} 項工作。`)"""
assert old in s
s=s.replace(old,new)
s=s.replace("<b>GUXON 品牌新品</b><small>可選不使用／簡易／完整策略＋執行管理</small>","<b>GUXON 品牌新品</b><small>產品資料＋AI 策略決策＋新品執行管理</small>")
old="""{!is1688&&<><Field label=\"策略管理模式\"><select value={data.strategy_mode} onChange={e=>setData({...data,strategy_mode:e.target.value as 'none'|'simple'|'full'})}>{STRATEGY_MODES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></Field><Field label=\"本輪預算版本\">"""
new="""{!is1688&&<><Field label=\"本輪預算版本\">"""
assert old in s
s=s.replace(old,new)
old="""<><b>{STRATEGY_MODES.find(x=>x.value===data.strategy_mode)?.label || '簡易策略'}＋新品執行管理</b><p>{STRATEGY_MODES.find(x=>x.value===data.strategy_mode)?.description} 新品執行管理仍會自動建立 9 大工作區／68 項跨部門工作。</p></>"""
new="""<><b>品牌新品標準流程</b><p>建立後使用「產品資料表 → AI 策略決策 → 新品執行管理」。策略不再建立另一套任務；新品執行管理仍依模板自動建立 9 大工作區。</p></>"""
assert old in s
s=s.replace(old,new)
s=s.replace("<p>品牌新品使用完整策略／執行流程；1688 新品使用簡化上架流程</p>","<p>品牌新品使用產品資料、AI 策略決策與執行流程；1688 新品使用簡化上架流程</p>")
p.write_text(s)
